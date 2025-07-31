"use client";

import { Button } from '@/components/ui/button';
import { Phone, Music } from 'lucide-react';

export function SupportLinks() {
  return (
    <div className="flex justify-center items-center gap-4 mt-4">
      <Button asChild variant="outline" className="rounded-full bg-white/50 hover:bg-white">
        <a href="tel:988" target="_blank" rel="noopener noreferrer">
          <Phone className="mr-2 h-4 w-4" />
          Call a Real Therapist
        </a>
      </Button>
      <Button asChild variant="outline" className="rounded-full bg-white/50 hover:bg-white">
        <a href="https://www.youtube.com/watch?v=l7DVd3nwdaw" target="_blank" rel="noopener noreferrer">
          <Music className="mr-2 h-4 w-4" />
          Play Calming Music
        </a>
      </Button>
    </div>
  );
}
