'use server';

/**
 * @fileOverview A flow that generates a talking avatar video.
 *
 * - generateTalkingAvatar - A function that takes an avatar image and text, and returns a video.
 * - GenerateTalkingAvatarInput - The input type for the function.
 * - GenerateTalkingAvatarOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import * as fs from 'fs';
import {Readable} from 'stream';
import type {MediaPart} from 'genkit';

const GenerateTalkingAvatarInputSchema = z.object({
  avatarDataUri: z
    .string()
    .describe(
      'The avatar image as a data URI, including a MIME type and Base64 encoding.'
    ),
  text: z.string().describe('The text the avatar should speak.'),
});
export type GenerateTalkingAvatarInput = z.infer<typeof GenerateTalkingAvatarInputSchema>;

const GenerateTalkingAvatarOutputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      'A data URI of the generated video, including a MIME type and Base64 encoding.'
    ),
});
export type GenerateTalkingAvatarOutput = z.infer<typeof GenerateTalkingAvatarOutputSchema>;

export async function generateTalkingAvatar(
  input: GenerateTalkingAvatarInput
): Promise<GenerateTalkingAvatarOutput> {
  return generateTalkingAvatarFlow(input);
}

const generateTalkingAvatarFlow = ai.defineFlow(
  {
    name: 'generateTalkingAvatarFlow',
    inputSchema: GenerateTalkingAvatarInputSchema,
    outputSchema: GenerateTalkingAvatarOutputSchema,
  },
  async ({avatarDataUri, text}) => {
    let {operation} = await ai.generate({
      model: googleAI.model('veo-2.0-generate-001'),
      prompt: [
        {text},
        {media: {url: avatarDataUri, contentType: 'image/png'}},
      ],
      config: {
        durationSeconds: 5,
        aspectRatio: '16:9',
        personGeneration: 'allow_adult',
      },
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation.');
    }

    // Wait for the video generation to complete
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      operation = await ai.checkOperation(operation);
    }

    if (operation.error) {
      console.error('Video generation failed:', operation.error);
      throw new Error('Failed to generate video: ' + operation.error.message);
    }

    const videoPart = operation.output?.message?.content.find(p => !!p.media);
    if (!videoPart || !videoPart.media) {
      throw new Error('Failed to find the generated video in the operation output.');
    }
    
    // Fetch the video content and encode it as a Base64 data URI
    const fetch = (await import('node-fetch')).default;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in the environment.");
    }
    const videoDownloadResponse = await fetch(
      `${videoPart.media.url}&key=${apiKey}`
    );

    if (!videoDownloadResponse.ok) {
        const errorText = await videoDownloadResponse.text();
        console.error("Failed to download video:", errorText);
        throw new Error(`Failed to download video. Status: ${videoDownloadResponse.status}`);
    }

    const videoBuffer = await videoDownloadResponse.buffer();
    const videoBase64 = videoBuffer.toString('base64');
    
    return {
      videoDataUri: `data:video/mp4;base64,${videoBase64}`,
    };
  }
);
