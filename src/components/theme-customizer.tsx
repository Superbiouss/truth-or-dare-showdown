"use client";

import { useAccentTheme } from '@/contexts/accent-theme-provider';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const themes = [
  { name: 'zinc', color: 'hsl(240 5.9% 10%)' },
  { name: 'rose', color: 'hsl(346.8 77.2% 49.8%)' },
  { name: 'blue', color: 'hsl(221.2 83.2% 53.3%)' },
  { name: 'green', color: 'hsl(142.1 76.2% 36.3%)' },
  { name: 'orange', color: 'hsl(24.6 95% 53.1%)' },
] as const;

export function ThemeCustomizer() {
  const { theme: activeTheme, setTheme } = useAccentTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="fixed top-6 right-20 z-50">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Customize Theme</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="end">
        <div className="space-y-2">
          <h4 className="font-medium">Accent Color</h4>
          <div className="flex items-center gap-2">
            {themes.map((theme) => (
              <Button
                key={theme.name}
                variant={'outline'}
                size="icon"
                className={cn('rounded-full h-8 w-8 justify-center', {
                  'border-2 border-primary': activeTheme === theme.name,
                })}
                style={{ backgroundColor: theme.color }}
                onClick={() => setTheme(theme.name)}
              >
                 {activeTheme === theme.name && <Check className="h-4 w-4 text-white" />}
                 <span className="sr-only">{theme.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
