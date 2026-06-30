/**
 * @file executionPipelineEvents.ts
 *
 * Event emitter for execution pipeline state changes.
 * Used to trigger downstream systems (Goal Health, Deadline Rescue, etc.) 
 * after task completion propagates through the primary pipeline.
 */

export type ExecutionPipelineEventType =
  | 'task_completed'
  | 'day_completed'
  | 'week_completed'
  | 'week_unlocked'
  | 'achievement_unlocked'
  | 'milestone_unlocked'
  | 'xp_awarded'
  | 'progress_updated'
  | 'first_login'
  | 'goal_analysis_complete'
  | 'roadmap_generated'
  | 'first_mission_generated';

export interface ExecutionPipelineEvent {
  type: ExecutionPipelineEventType;
  timestamp: string;
  data: Record<string, unknown>;
}

type EventListener = (event: ExecutionPipelineEvent) => void | Promise<void>;

class ExecutionPipelineEventEmitter {
  private listeners: Map<ExecutionPipelineEventType, EventListener[]> = new Map();

  /**
   * Subscribe to a pipeline event.
   * Returns an unsubscribe function.
   */
  subscribe(
    eventType: ExecutionPipelineEventType,
    listener: EventListener,
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(listener);

    // Return unsubscribe function
    return () => {
      const list = this.listeners.get(eventType);
      if (list) {
        const index = list.indexOf(listener);
        if (index > -1) list.splice(index, 1);
      }
    };
  }

  /**
   * Emit a pipeline event to all subscribed listeners.
   * Errors in listeners are logged but don't propagate.
   */
  async emit(event: ExecutionPipelineEvent): Promise<void> {
    const listeners = this.listeners.get(event.type) || [];
    console.log(
      `[ExecutionPipeline] Emitting "${event.type}" to ${listeners.length} listener(s)`,
    );

    for (const listener of listeners) {
      try {
        await listener(event);
      } catch (error) {
        console.error(`[ExecutionPipeline] Listener error for "${event.type}":`, error);
      }
    }
  }

  /**
   * Subscribe to all events.
   */
  subscribeAll(listener: EventListener): () => void {
    const unsubscribers: (() => void)[] = [];

    const eventTypes: ExecutionPipelineEventType[] = [
      'task_completed',
      'day_completed',
      'week_completed',
      'week_unlocked',
      'achievement_unlocked',
      'milestone_unlocked',
      'xp_awarded',
      'progress_updated',
      'first_login',
      'goal_analysis_complete',
      'roadmap_generated',
      'first_mission_generated',
    ];

    for (const eventType of eventTypes) {
      unsubscribers.push(this.subscribe(eventType, listener));
    }

    return () => unsubscribers.forEach((fn) => fn());
  }

  /**
   * Clear all listeners (for testing).
   */
  clear(): void {
    this.listeners.clear();
  }
}

// Singleton instance
export const executionPipelineEvents = new ExecutionPipelineEventEmitter();
