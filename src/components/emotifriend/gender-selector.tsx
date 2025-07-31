
"use client";

import { Button } from '@/components/ui/button';
import type { Gender } from '@/lib/types';
import { cn } from '@/lib/utils';
import { User, Users } from 'lucide-react';

type GenderSelectorProps = {
  gender: Gender;
  onGenderChange: (gender: Gender) => void;
};

export function GenderSelector({ gender, onGenderChange }: GenderSelectorProps) {
  return (
    <div className="flex justify-center items-center gap-2 mt-4">
      <Button 
        variant={gender === 'female' ? "secondary" : "ghost"}
        onClick={() => onGenderChange('female')}
        className={cn("rounded-full", gender === 'female' && "ring-2 ring-primary")}
      >
        <User className="mr-2 h-4 w-4"/>
        Female
      </Button>
      <Button 
        variant={gender === 'male' ? "secondary" : "ghost"}
        onClick={() => onGenderChange('male')}
        className={cn("rounded-full", gender === 'male' && "ring-2 ring-primary")}
      >
        <User className="mr-2 h-4 w-4"/>
        Male
      </Button>
    </div>
  );
}
