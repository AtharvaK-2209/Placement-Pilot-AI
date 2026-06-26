import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;

export const genai = new GoogleGenAI({ apiKey });
