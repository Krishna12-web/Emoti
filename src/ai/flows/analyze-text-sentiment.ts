// The directive tells the Next.js runtime that the code in this file should be executed on the server-side.
'use server';

/**
 * @fileOverview Analyzes the sentiment of text input to detect emotional context, focusing on loneliness or distress.
 *
 * - analyzeTextSentiment - A function that takes text as input and returns an analysis of its sentiment.
 * - AnalyzeTextSentimentInput - The input type for the analyzeTextSentiment function, a string of text.
 * - AnalyzeTextSentimentOutput - The return type for the analyzeTextSentiment function, an object containing the sentiment analysis.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeTextSentimentInputSchema = z.string().describe('The text to analyze for sentiment.');
export type AnalyzeTextSentimentInput = z.infer<typeof AnalyzeTextSentimentInputSchema>;

const AnalyzeTextSentimentOutputSchema = z.object({
  sentiment: z
    .string()
    .describe(
      'The overall sentiment of the text, e.g., positive, negative, neutral, lonely, distressed.'
    ),
  score: z.number().describe('A numerical score representing the sentiment strength.'),
  indicators: z
    .array(z.string())
    .describe(
      'Specific indicators of loneliness or distress found in the text, if any, like keywords or phrases.'
    ),
});
export type AnalyzeTextSentimentOutput = z.infer<typeof AnalyzeTextSentimentOutputSchema>;

export async function analyzeTextSentiment(input: AnalyzeTextSentimentInput): Promise<AnalyzeTextSentimentOutput> {
  return analyzeTextSentimentFlow(input);
}

const analyzeTextSentimentPrompt = ai.definePrompt({
  name: 'analyzeTextSentimentPrompt',
  input: {schema: AnalyzeTextSentimentInputSchema},
  output: {schema: AnalyzeTextSentimentOutputSchema},
  prompt: `You are an AI sentiment analyst specializing in detecting loneliness and distress in user text. Analyze the following text and determine its overall sentiment, providing a sentiment score between -1 (very negative/distressed) and 1 (very positive).

Identify specific indicators of loneliness or distress, such as keywords or phrases, and list them in the indicators array.

Text: {{{$input}}}

Output in JSON format as specified by the schema.`, // Intentionally using {{$input}} to pass the entire input string
});

const analyzeTextSentimentFlow = ai.defineFlow(
  {
    name: 'analyzeTextSentimentFlow',
    inputSchema: AnalyzeTextSentimentInputSchema,
    outputSchema: AnalyzeTextSentimentOutputSchema,
  },
  async input => {
    const {output} = await analyzeTextSentimentPrompt(input);
    return output!;
  }
);
