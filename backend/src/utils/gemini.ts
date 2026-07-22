import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env';

let client: GoogleGenAI | null = null;

function getClient() {
  if (!config.ai.geminiApiKey) throw new Error('GEMINI_API_KEY is not set in .env');
  if (!client) client = new GoogleGenAI({ apiKey: config.ai.geminiApiKey });
  return client;
}

export function getAI() {
  return getClient();
}

// Gemini is used for text-only tasks (campaign copy generation)
export const TEXT_MODEL = config.ai.geminiTextModel;
