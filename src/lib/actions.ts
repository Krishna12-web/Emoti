"use server";

import { analyzeFacialExpressions, type AnalyzeFacialExpressionsInput, type AnalyzeFacialExpressionsOutput } from "@/ai/flows/analyze-facial-expressions";
import { analyzeTextSentiment, type AnalyzeTextSentimentInput, type AnalyzeTextSentimentOutput } from "@/ai/flows/analyze-text-sentiment";
import { analyzeVoiceTone, type AnalyzeVoiceToneInput, type AnalyzeVoiceToneOutput } from "@/ai/flows/analyze-voice-tone";
import { generateAdaptiveResponse, type GenerateAdaptiveResponseInput, type GenerateAdaptiveResponseOutput } from "@/ai/flows/generate-adaptive-response";

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
