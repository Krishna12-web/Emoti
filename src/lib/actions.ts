"use server";

import { analyzeFacialExpressions, type AnalyzeFacialExpressionsInput, type AnalyzeFacialExpressionsOutput } from "@/ai/flows/analyze-facial-expressions";
import { analyzeTextSentiment, type AnalyzeTextSentimentInput, type AnalyzeTextSentimentOutput } from "@/ai/flows/analyze-text-sentiment";
import { analyzeVoiceTone, type AnalyzeVoiceToneInput, type AnalyzeVoiceToneOutput } from "@/ai/flows/analyze-voice-tone";
import { generateAdaptiveResponse, type GenerateAdaptiveResponseInput, type GenerateAdaptiveResponseOutput } from "@/ai/flows/generate-adaptive-response";
import { textToSpeech, type TextToSpeechInput, type TextToSpeechOutput } from "@/ai/flows/text-to-speech";
import { translateText, type TranslateTextInput, type TranslateTextOutput } from "@/ai/flows/translate-text";
import { speechToText, type SpeechToTextInput, type SpeechToTextOutput } from "@/ai/flows/speech-to-text";

export async function performTextAnalysis(
    input: AnalyzeTextSentimentInput
): Promise<AnalyzeTextSentimentOutput> {
  return await analyzeTextSentiment(input);
}

export async function performFacialAnalysis(
    input: AnalyzeFacialExpressionsInput["photoDataUri"]
): Promise<AnalyzeFacialExpressionsOutput> {
  return await analyzeFacialExpressions({ photoDataUri: input });
}

export async function performVoiceAnalysis(
    input: AnalyzeVoiceToneInput["audioDataUri"]
): Promise<AnalyzeVoiceToneOutput> {
  return await analyzeVoiceTone({ audioDataUri: input });
}

export async function getAdaptiveResponse(
    input: GenerateAdaptiveResponseInput
): Promise<GenerateAdaptiveResponseOutput> {
  return await generateAdaptiveResponse(input);
}

export async function getAudioResponse(
    input: TextToSpeechInput
): Promise<TextToSpeechOutput> {
    return await textToSpeech(input);
}

export async function performTranslation(
    text: string,
    targetLanguage: string
): Promise<TranslateTextOutput> {
    return await translateText({ text, targetLanguage });
}

export async function performSpeechToText(
    audioDataUri: string
): Promise<SpeechToTextOutput> {
    return await speechToText({ audioDataUri });
}
