'use server';

/**
 * @fileOverview A flow that transcribes audio to text.
 * - speechToText - A function that converts audio to text.
 * - SpeechToTextInput - The input type for the speechToText function.
 * - SpeechToTextOutput - The return type for the speechToText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpeechToTextInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "A data URI containing the audio data to transcribe. It must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SpeechToTextInput = z.infer<typeof SpeechToTextInputSchema>;

const SpeechToTextOutputSchema = z.object({
    transcript: z.string().describe('The transcribed text from the audio.')
});
export type SpeechToTextOutput = z.infer<typeof SpeechToTextOutputSchema>;

export async function speechToText(input: SpeechToTextInput): Promise<SpeechToTextOutput> {
  return speechToTextFlow(input);
}

const speechToTextPrompt = ai.definePrompt({
    name: 'speechToTextPrompt',
    input: {schema: SpeechToTextInputSchema},
    output: {schema: SpeechToTextOutputSchema},
    prompt: `You are a highly accurate speech-to-text transcription service. Transcribe the following audio data to text.
    Audio: {{media url=audioDataUri}}
    Respond ONLY with the transcribed text.`,
});


const speechToTextFlow = ai.defineFlow(
  {
    name: 'speechToTextFlow',
    inputSchema: SpeechToTextInputSchema,
    outputSchema: SpeechToTextOutputSchema,
  },
  async (input) => {
    const {output} = await speechToTextPrompt(input);
    return output!;
  }
);
