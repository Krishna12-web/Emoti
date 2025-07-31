'use server';

/**
 * @fileOverview A flow that generates a stylized avatar from a user-uploaded photo.
 *
 * - generateAvatarFromPhoto - A function that takes a photo and generates an avatar.
 * - GenerateAvatarFromPhotoInput - The input type for the function.
 * - GenerateAvatarFromPhotoOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAvatarFromPhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a person, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateAvatarFromPhotoInput = z.infer<typeof GenerateAvatarFromPhotoInputSchema>;

const GenerateAvatarFromPhotoOutputSchema = z.object({
  avatarDataUri: z
    .string()
    .describe(
      'A data URI of the generated avatar image, including a MIME type and Base64 encoding.'
    ),
});
export type GenerateAvatarFromPhotoOutput = z.infer<typeof GenerateAvatarFromPhotoOutputSchema>;

export async function generateAvatarFromPhoto(
  input: GenerateAvatarFromPhotoInput
): Promise<GenerateAvatarFromPhotoOutput> {
  return generateAvatarFromPhotoFlow(input);
}

const generateAvatarFromPhotoFlow = ai.defineFlow(
  {
    name: 'generateAvatarFromPhotoFlow',
    inputSchema: GenerateAvatarFromPhotoInputSchema,
    outputSchema: GenerateAvatarFromPhotoOutputSchema,
  },
  async ({photoDataUri}) => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        {
          text: 'Generate a friendly, animated-style avatar based on the person in this photo. The avatar should have a neutral, pleasant expression and be suitable for a virtual companion. It should be a bust shot (head and shoulders) on a simple, neutral background.',
        },
        {media: {url: photoDataUri}},
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media || !media.url) {
      throw new Error('Image generation failed to return an avatar.');
    }

    return {avatarDataUri: media.url};
  }
);
