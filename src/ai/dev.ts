import { config } from 'dotenv';
config();

import '@/ai/flows/generate-adaptive-response.ts';
import '@/ai/flows/analyze-facial-expressions.ts';
import '@/ai/flows/analyze-voice-tone.ts';
import '@/ai/flows/analyze-text-sentiment.ts';
import '@/ai/flows/text-to-speech.ts';
import '@/ai/flows/translate-text.ts';
import '@/ai/flows/speech-to-text.ts';
