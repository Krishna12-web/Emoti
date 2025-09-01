
"use server";

import { analyzeVoiceTone, type AnalyzeVoiceToneInput, type AnalyzeVoiceToneOutput } from "@/ai/flows/analyze-voice-tone";
import { generateAdaptiveResponse, type GenerateAdaptiveResponseInput, type GenerateAdaptiveResponseOutput } from "@/ai/flows/generate-adaptive-response";
import { generateAvatarFromPhoto, type GenerateAvatarFromPhotoInput, type GenerateAvatarFromPhotoOutput } from "@/ai/flows/generate-avatar-from-photo";
import { generateTalkingAvatar, type GenerateTalkingAvatarInput, type GenerateTalkingAvatarOutput } from "@/ai/flows/generate-talking-avatar";

export { analyzeVoiceTone, type AnalyzeVoiceToneInput, type AnalyzeVoiceToneOutput };
export { generateAdaptiveResponse, type GenerateAdaptiveResponseInput, type GenerateAdaptiveResponseOutput };
export { generateAvatarFromPhoto as generateAvatar, type GenerateAvatarFromPhotoInput, type GenerateAvatarFromPhotoOutput };
export { generateTalkingAvatar as generateTalkingVideo, type GenerateTalkingAvatarInput, type GenerateTalkingAvatarOutput };

    