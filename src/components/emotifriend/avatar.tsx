
import { cn } from '@/lib/utils';
import type { Emotion } from '@/lib/types';
import { Bot, Upload } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type AvatarProps = {
  emotion?: Emotion;
  avatarUrl?: string | null;
  onAvatarUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const emotionEmojis: Record<Exclude<Emotion, 'thinking' | 'listening' | 'neutral'>, string> = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
};

export function Avatar({ emotion = 'neutral', avatarUrl, onAvatarUpload }: AvatarProps) {
  const animationClass = emotion === 'listening' ? 'nod-animation' : 'breathing-animation';
  const emoji = (emotion && emotion !== 'neutral' && emotion !== 'thinking' && emotion !== 'listening') ? emotionEmojis[emotion] : null;

  if (emotion === 'thinking') {
    return (
        <div className="w-48 h-48 rounded-full bg-primary/20 flex items-center justify-center shadow-lg breathing-animation">
            <Bot className="w-24 h-24 text-primary animate-pulse" />
        </div>
    )
  }

  return (
    <div className={cn("relative w-48 h-48 transition-transform duration-500", animationClass)}>
        <Image
          src={avatarUrl || "https://placehold.co/200x200.png"}
          alt="EmotiFriend Avatar"
          width={192}
          height={192}
          className="rounded-full object-cover shadow-lg border-4 border-primary/50"
          data-ai-hint={avatarUrl ? "" : "portrait person"}
        />
        {emoji && (
          <div className="absolute bottom-0 right-0 text-4xl bg-background/50 rounded-full p-1">
            {emoji}
          </div>
        )}
        <div className="absolute top-0 right-0">
          <Label htmlFor="avatar-upload">
            <Button asChild size="icon" variant="ghost" className="rounded-full bg-background/50 hover:bg-background/80 cursor-pointer">
                <span>
                    <Upload className="w-5 h-5 text-primary" />
                    <span className="sr-only">Upload Avatar</span>
                </span>
            </Button>
          </Label>
          <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={onAvatarUpload} />
        </div>
    </div>
  );
}
