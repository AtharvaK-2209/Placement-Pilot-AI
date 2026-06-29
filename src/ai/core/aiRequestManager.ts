/**
 * @file aiRequestManager.ts — Generic AI Cache Layer & Smart Request Manager
 *
 * ARCHITECTURAL ROLE:
 * This is the single entry point for ALL Gemini requests in the application.
 * Every AI agent MUST use this manager instead of calling safeGenerateContent() directly.
 *
 * FLOW:
 *   User Action
 *     ↓
 *   AI Agent
 *     ↓
 *   AI Request Manager
 *     ↓
 *   Check Memory Cache
 *     ↓
 *   Check Firestore Cache
 *     ↓
 *   Check LocalStorage Cache
 *     ↓
 *   If cached → Return cached result
 *     ↓
 *   If not cached → Call Gemini (via safeGenerateContent)
 *     ↓
 *   Validate & Save to all cache layers
 *     ↓
 *   Return result
 *
 * FEATURES:
 *   ✓ Multi-layer caching (Memory → Firestore → LocalStorage → Gemini)
 *   ✓ Request deduplication (multiple rapid clicks → single Gemini request)
 *   ✓ Exponential backoff retry logic (transient failures only)
 *   ✓ Friendly 429 handling (quota exceeded messages)
 *   ✓ Automatic cache invalidation
 *   ✓ Comprehensive logging
 *   ✓ Future-proof (works for all AI agents automatically)
 *
 * USAGE:
 *   import { aiRequestManager } from './core/aiRequestManager';
 *
 *   const result = await aiRequestManager.request({
 *     agentName: 'GoalAnalysis',
 *     cacheKey: { goal, deadline, weeklyHours, selectedTopics, executionMode },
 *     generateFn: async () => {
 *       // Your Gemini call here
 *       return await safeGenerateContent({ ... });
 *     },
 *     cacheTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
 *     userId: uid, // optional — enables Firestore caching
 *   });
 */

import { db } from '../../config/firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AIRequestOptions<T = unknown> {
  /** Unique identifier for the AI agent (e.g., 'GoalAnalysis', 'Roadmap', 'DailyMission') */
  agentName: string;

  /** Cache key inputs — will be hashed to create deterministic cache key */
  cacheKey: Record<string, unknown>;

  /** Function that performs the actual Gemini request */
  generateFn: () => Promise<T>;

  /** Cache TTL in milliseconds (default: 7 days) */
  cacheTTL?: number;

  /** Firebase Auth user ID — if provided, enables Firestore caching */
  userId?: string;

  /** Optional validator function to verify response structure */
  validator?: (data: T) => boolean;

  /** Force skip cache and always call Gemini (default: false) */
  forceRefresh?: boolean;
}

export interface CachedResponse<T = unknown> {
  data: T;
  cachedAt: string;
  expiresAt: string;
  cacheKey: string;
  agentName: string;
}

export interface AIRequestResult<T = unknown> {
  success: boolean;
  data: T | null;
  cacheHit: boolean;
  cacheSource?: 'memory' | 'firestore' | 'localStorage' | 'none';
  error?: string;
}

// ─── Cache Keys ───────────────────────────────────────────────────────────────

/**
 * Generates a deterministic hash from cache key inputs.
 * Uses SHA-256 to create a stable, collision-resistant cache key.
 */
async function generateCacheKeyAsync(agentName: string, inputs: Record<string, unknown>): Promise<string> {
  const normalized = JSON.stringify(inputs, Object.keys(inputs).sort());
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${agentName}:${hash.slice(0, 16)}`;
}

// ─── In-Memory Cache ──────────────────────────────────────────────────────────

const memoryCache = new Map<string, CachedResponse>();

function getFromMemory<T>(cacheKey: string): T | null {
  const cached = memoryCache.get(cacheKey);
  if (!cached) return null;

  const now = new Date().toISOString();
  if (now > cached.expiresAt) {
    memoryCache.delete(cacheKey);
    console.log(`[AI CACHE] ${cached.agentName} — Memory cache expired`);
    return null;
  }

  console.log(`[AI CACHE] ${cached.agentName} — Cache HIT (memory)`);
  return cached.data as T;
}

function saveToMemory<T>(cacheKey: string, agentName: string, data: T, ttl: number): void {
  const now = Date.now();
  memoryCache.set(cacheKey, {
    data,
    cachedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttl).toISOString(),
    cacheKey,
    agentName,
  });
  console.log(`[AI CACHE] ${agentName} — Saved to memory cache`);
}

// ─── LocalStorage Cache ───────────────────────────────────────────────────────

const LOCALSTORAGE_PREFIX = 'ai_cache_';

function getFromLocalStorage<T>(cacheKey: string): T | null {
  try {
    const key = `${LOCALSTORAGE_PREFIX}${cacheKey}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const cached: CachedResponse<T> = JSON.parse(raw);
    const now = new Date().toISOString();
    if (now > cached.expiresAt) {
      localStorage.removeItem(key);
      console.log(`[AI CACHE] ${cached.agentName} — LocalStorage cache expired`);
      return null;
    }

    console.log(`[AI CACHE] ${cached.agentName} — Cache HIT (localStorage)`);
    return cached.data;
  } catch (e) {
    console.warn('[AI CACHE] LocalStorage read failed:', e);
    return null;
  }
}

function saveToLocalStorage<T>(cacheKey: string, agentName: string, data: T, ttl: number): void {
  try {
    const now = Date.now();
    const key = `${LOCALSTORAGE_PREFIX}${cacheKey}`;
    const cached: CachedResponse<T> = {
      data,
      cachedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + ttl).toISOString(),
      cacheKey,
      agentName,
    };
    localStorage.setItem(key, JSON.stringify(cached));
    console.log(`[AI CACHE] ${agentName} — Saved to localStorage`);
  } catch (e) {
    console.warn('[AI CACHE] LocalStorage write failed:', e);
  }
}

// ─── Firestore Cache ──────────────────────────────────────────────────────────

const FIRESTORE_COLLECTION = 'aiCache';

async function getFromFirestore<T>(cacheKey: string, userId: string): Promise<T | null> {
  try {
    const docRef = doc(db, `users/${userId}/${FIRESTORE_COLLECTION}`, cacheKey);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) return null;

    const cached = snapshot.data() as CachedResponse<T>;
    const now = new Date().toISOString();
    if (now > cached.expiresAt) {
      await deleteDoc(docRef);
      console.log(`[AI CACHE] ${cached.agentName} — Firestore cache expired`);
      return null;
    }

    console.log(`[AI CACHE] ${cached.agentName} — Cache HIT (firestore)`);
    return cached.data;
  } catch (e) {
    console.warn('[AI CACHE] Firestore read failed:', e);
    return null;
  }
}

async function saveToFirestore<T>(
  cacheKey: string,
  agentName: string,
  data: T,
  ttl: number,
  userId: string,
): Promise<void> {
  try {
    const now = Date.now();
    const docRef = doc(db, `users/${userId}/${FIRESTORE_COLLECTION}`, cacheKey);
    const cached: CachedResponse<T> = {
      data,
      cachedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + ttl).toISOString(),
      cacheKey,
      agentName,
    };
    await setDoc(docRef, cached);
    console.log(`[AI CACHE] ${agentName} — Saved to Firestore`);
  } catch (e) {
    console.warn('[AI CACHE] Firestore write failed:', e);
  }
}

// ─── Request Deduplication ────────────────────────────────────────────────────

/**
 * In-flight request tracker.
 * If multiple requests with the same cache key arrive simultaneously,
 * only one Gemini request is made and all callers await the same Promise.
 */
const inflightRequests = new Map<string, Promise<unknown>>();

// ─── Retry Logic with Exponential Backoff ─────────────────────────────────────

interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const asAny = error as unknown as Record<string, unknown>;
  const status =
    (asAny['status'] as number | undefined) ??
    (asAny['statusCode'] as number | undefined) ??
    (asAny['code'] as number | undefined);

  // Retry on transient errors
  if (status === undefined) return true; // Network error
  if (status === 503) return true; // Service unavailable
  if (status === 500) return true; // Internal server error

  return false;
}

function is429Error(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const asAny = error as unknown as Record<string, unknown>;
  const status =
    (asAny['status'] as number | undefined) ??
    (asAny['statusCode'] as number | undefined) ??
    (asAny['code'] as number | undefined);

  return status === 429;
}

async function executeWithRetry<T>(
  fn: () => Promise<T>,
  agentName: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      console.log(`[AI CACHE] ${agentName} — Attempt ${attempt}/${config.maxAttempts}`);
      const result = await fn();
      if (attempt > 1) {
        console.log(`[AI CACHE] ${agentName} — ✓ Succeeded on retry ${attempt}`);
      }
      return result;
    } catch (error) {
      lastError = error;

      // Check for 429 quota error
      if (is429Error(error)) {
        console.error(`[AI CACHE] ${agentName} — ✗ 429 Quota Exceeded`);
        throw new Error('QUOTA_EXCEEDED');
      }

      // Check if error is retryable
      if (!isRetryableError(error)) {
        console.error(`[AI CACHE] ${agentName} — ✗ Non-retryable error:`, error);
        throw error;
      }

      // If this was the last attempt, throw
      if (attempt === config.maxAttempts) {
        console.error(`[AI CACHE] ${agentName} — ✗ All ${config.maxAttempts} attempts failed`);
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s, ...
      const delayMs = config.baseDelayMs * Math.pow(2, attempt - 1);
      console.warn(`[AI CACHE] ${agentName} — ⚠ Retry #${attempt} failed, waiting ${delayMs}ms...`);
      await sleep(delayMs);
    }
  }

  throw lastError;
}

// ─── Main Request Manager ─────────────────────────────────────────────────────

class AIRequestManager {
  /**
   * Makes an AI request with intelligent caching and retry logic.
   * 
   * This is the ONLY method AI agents should call.
   */
  async request<T>(options: AIRequestOptions<T>): Promise<AIRequestResult<T>> {
    const {
      agentName,
      cacheKey: cacheKeyInputs,
      generateFn,
      cacheTTL = 7 * 24 * 60 * 60 * 1000, // 7 days default
      userId,
      validator,
      forceRefresh = false,
    } = options;

    const cacheKey = await generateCacheKeyAsync(agentName, cacheKeyInputs);
    console.group(`[AI CACHE] ${agentName} Request`);
    console.log('Cache Key:', cacheKey);
    console.log('Force Refresh:', forceRefresh);

    try {
      // ── Step 1: Check caches (unless force refresh) ─────────────────────────
      if (!forceRefresh) {
        // Check memory cache
        const memoryHit = getFromMemory<T>(cacheKey);
        if (memoryHit) {
          // Validate if validator provided
          if (validator && !validator(memoryHit)) {
            console.warn(`[AI CACHE] ${agentName} — Memory cache validation failed, invalidating`);
            memoryCache.delete(cacheKey);
          } else {
            console.groupEnd();
            return {
              success: true,
              data: memoryHit,
              cacheHit: true,
              cacheSource: 'memory',
            };
          }
        }

        // Check Firestore cache (if userId provided)
        if (userId) {
          const firestoreHit = await getFromFirestore<T>(cacheKey, userId);
          if (firestoreHit) {
            // Validate if validator provided
            if (validator && !validator(firestoreHit)) {
              console.warn(`[AI CACHE] ${agentName} — Firestore cache validation failed, invalidating`);
              const docRef = doc(db, `users/${userId}/${FIRESTORE_COLLECTION}`, cacheKey);
              await deleteDoc(docRef);
            } else {
              // Populate memory cache for faster subsequent access
              saveToMemory(cacheKey, agentName, firestoreHit, cacheTTL);
              console.groupEnd();
              return {
                success: true,
                data: firestoreHit,
                cacheHit: true,
                cacheSource: 'firestore',
              };
            }
          }
        }

        // Check localStorage cache
        const localStorageHit = getFromLocalStorage<T>(cacheKey);
        if (localStorageHit) {
          // Validate if validator provided
          if (validator && !validator(localStorageHit)) {
            console.warn(`[AI CACHE] ${agentName} — LocalStorage cache validation failed, invalidating`);
            localStorage.removeItem(`${LOCALSTORAGE_PREFIX}${cacheKey}`);
          } else {
            // Populate memory cache for faster subsequent access
            saveToMemory(cacheKey, agentName, localStorageHit, cacheTTL);
            console.groupEnd();
            return {
              success: true,
              data: localStorageHit,
              cacheHit: true,
              cacheSource: 'localStorage',
            };
          }
        }

        console.log(`[AI CACHE] ${agentName} — Cache MISS (all layers)`);
      }

      // ── Step 2: Request Deduplication ───────────────────────────────────────
      const existingRequest = inflightRequests.get(cacheKey);
      if (existingRequest) {
        console.log(`[AI CACHE] ${agentName} — Deduplicating request (awaiting in-flight)`);
        const data = await existingRequest as T;
        console.groupEnd();
        return {
          success: true,
          data,
          cacheHit: false,
          cacheSource: 'none',
        };
      }

      // ── Step 3: Call Gemini with retry logic ────────────────────────────────
      console.log(`[AI CACHE] ${agentName} — Calling Gemini...`);
      
      const requestPromise = executeWithRetry(generateFn, agentName);
      inflightRequests.set(cacheKey, requestPromise);

      let data: T;
      try {
        data = await requestPromise;
      } catch (error) {
        // Handle quota exceeded specially
        if (error instanceof Error && error.message === 'QUOTA_EXCEEDED') {
          console.error(`[AI CACHE] ${agentName} — ✗ Daily AI quota exceeded`);
          console.groupEnd();
          return {
            success: false,
            data: null,
            cacheHit: false,
            cacheSource: 'none',
            error: 'Daily AI quota has been reached. Previously generated content is still available. Please try again later.',
          };
        }
        throw error;
      } finally {
        inflightRequests.delete(cacheKey);
      }

      console.log(`[AI CACHE] ${agentName} — ✓ Gemini response received`);

      // ── Step 4: Validate response ───────────────────────────────────────────
      if (validator && !validator(data)) {
        console.error(`[AI CACHE] ${agentName} — ✗ Response validation failed`);
        console.groupEnd();
        return {
          success: false,
          data: null,
          cacheHit: false,
          cacheSource: 'none',
          error: 'Response validation failed',
        };
      }

      // ── Step 5: Save to all cache layers ────────────────────────────────────
      saveToMemory(cacheKey, agentName, data, cacheTTL);
      saveToLocalStorage(cacheKey, agentName, data, cacheTTL);
      if (userId) {
        await saveToFirestore(cacheKey, agentName, data, cacheTTL, userId);
      }

      console.log(`[AI CACHE] ${agentName} — ✓ Request complete`);
      console.groupEnd();

      return {
        success: true,
        data,
        cacheHit: false,
        cacheSource: 'none',
      };

    } catch (error) {
      console.error(`[AI CACHE] ${agentName} — ✗ Request failed:`, error);
      console.groupEnd();

      return {
        success: false,
        data: null,
        cacheHit: false,
        cacheSource: 'none',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Invalidates cache for a specific agent and cache key.
   */
  async invalidate(agentName: string, cacheKeyInputs: Record<string, unknown>, userId?: string): Promise<void> {
    const cacheKey = await generateCacheKeyAsync(agentName, cacheKeyInputs);
    console.log(`[AI CACHE] ${agentName} — Invalidating cache: ${cacheKey}`);

    // Remove from memory
    memoryCache.delete(cacheKey);

    // Remove from localStorage
    localStorage.removeItem(`${LOCALSTORAGE_PREFIX}${cacheKey}`);

    // Remove from Firestore
    if (userId) {
      try {
        const docRef = doc(db, `users/${userId}/${FIRESTORE_COLLECTION}`, cacheKey);
        await deleteDoc(docRef);
      } catch (e) {
        console.warn('[AI CACHE] Firestore invalidation failed:', e);
      }
    }
  }

  /**
   * Invalidates ALL caches for a specific agent.
   */
  async invalidateAll(agentName: string, _userId?: string): Promise<void> {
    console.log(`[AI CACHE] ${agentName} — Invalidating ALL caches`);

    // Remove from memory
    for (const [key, value] of memoryCache.entries()) {
      if (value.agentName === agentName) {
        memoryCache.delete(key);
      }
    }

    // Remove from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LOCALSTORAGE_PREFIX)) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const cached = JSON.parse(raw) as CachedResponse;
            if (cached.agentName === agentName) {
              localStorage.removeItem(key);
            }
          }
        } catch (e) {
          // Skip malformed entries
        }
      }
    }

    // Note: Firestore invalidation would require querying all documents
    // which is expensive. Individual invalidation is preferred.
    console.warn('[AI CACHE] Firestore bulk invalidation not implemented (use individual invalidation)');
  }

  /**
   * Clears all caches across all agents (use with caution).
   */
  clearAll(): void {
    console.warn('[AI CACHE] Clearing ALL caches');
    memoryCache.clear();
    
    // Clear all AI cache entries from localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LOCALSTORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const aiRequestManager = new AIRequestManager();
