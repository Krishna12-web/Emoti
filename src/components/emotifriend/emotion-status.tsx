"use client";

import type { AnalysisResult } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

type EmotionStatusProps = {
  result: AnalysisResult;
};

export function EmotionStatus({ result }: EmotionStatusProps) {
  const hasResult = result.face || result.text || result.voice;

  if (!hasResult) return null;

  return (
    <div className="flex justify-center items-center gap-2 flex-wrap mb-4 font-body">
        {result.text && <Badge variant="secondary">Text: {result.text}</Badge>}
        {result.voice && <Badge variant="secondary">Voice: {result.voice}</Badge>}
        {result.face && <Badge variant="secondary">Face: {result.face}</Badge>}
    </div>
  );
}
