import OpenAI from "openai";

/**
 * OpenAI client singleton.
 *
 * Requires OPENAI_API_KEY environment variable set in:
 *   - Production: Vercel project environment variables
 *   - Local development: apps/web/.env.local
 *
 * SERVER-ONLY. Never import this in client components or expose the key.
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
