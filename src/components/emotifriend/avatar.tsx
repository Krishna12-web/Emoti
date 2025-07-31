import { cn } from '@/lib/utils';
import type { Emotion } from '@/lib/types';
import { Bot } from 'lucide-react';

type AvatarProps = {
  emotion?: Emotion;
};

const Eye = ({ side }: { side: 'left' | 'right' }) => (
  <circle cx={side === 'left' ? 70 : 130} cy="80" r="8" fill="hsl(var(--foreground))" />
);

const HappyEyes = () => (
  <>
    <path d="M 60 80 A 10 10 0 0 1 80 80" stroke="hsl(var(--foreground))" strokeWidth="4" fill="none" />
    <path d="M 120 80 A 10 10 0 0 1 140 80" stroke="hsl(var(--foreground))" strokeWidth="4" fill="none" />
  </>
);

const SadEyes = () => (
  <>
    <path d="M 60 85 A 10 10 0 0 0 80 85" stroke="hsl(var(--foreground))" strokeWidth="4" fill="none" />
    <path d="M 120 85 A 10 10 0 0 0 140 85" stroke="hsl(var(--foreground))" strokeWidth="4" fill="none" />
  </>
);


const Mouth = ({ emotion }: AvatarProps) => {
  switch (emotion) {
    case 'happy':
      return <path d="M 80 120 A 25 25 0 0 1 120 120" stroke="hsl(var(--foreground))" strokeWidth="4" fill="none" />;
    case 'sad':
      return <path d="M 80 130 A 25 20 0 0 0 120 130" stroke="hsl(var(--foreground))" strokeWidth="4" fill="none" />;
    case 'listening':
      return <circle cx="100" cy="125" r="5" fill="hsl(var(--foreground))" />;
    case 'angry':
       return <path d="M 80 130 L 120 130" stroke="hsl(var(--foreground))" strokeWidth="4" fill="none" />;
    default:
      return <line x1="85" y1="125" x2="115" y2="125" stroke="hsl(var(--foreground))" strokeWidth="4" />;
  }
};

const Eyes = ({ emotion }: AvatarProps) => {
  switch (emotion) {
    case 'happy':
      return <HappyEyes />;
    case 'sad':
       return <SadEyes />;
    case 'listening':
        return <>
            <Eye side="left" />
            <Eye side="right" />
        </>;
    default:
      return <>
        <Eye side="left" />
        <Eye side="right" />
      </>;
  }
}

export function Avatar({ emotion = 'neutral' }: AvatarProps) {
  const animationClass = emotion === 'listening' ? 'nod-animation' : 'breathing-animation';

  if (emotion === 'thinking') {
    return (
        <div className="w-48 h-48 rounded-full bg-primary/20 flex items-center justify-center shadow-lg breathing-animation">
            <Bot className="w-24 h-24 text-primary animate-pulse" />
        </div>
    )
  }


  return (
    <div className={cn("relative w-48 h-48 transition-transform duration-500", animationClass)}>
      <svg viewBox="0 0 200 200" width="100%" height="100%">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="hsl(var(--primary))" floodOpacity="0.3" />
          </filter>
        </defs>
        <circle cx="100" cy="100" r="90" fill="hsl(var(--primary) / 0.5)" filter="url(#shadow)" />
        <circle cx="100" cy="100" r="90" fill="hsl(var(--primary) / 0.5)" stroke="hsl(var(--primary))" strokeWidth="4" />
        
        <g className="transition-all duration-500 ease-in-out">
            <Eyes emotion={emotion} />
            <Mouth emotion={emotion} />
        </g>
      </svg>
    </div>
  );
}
