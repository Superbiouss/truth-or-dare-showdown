
"use client";

import { useState } from "react";
import type { GameCategory } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Icons } from "@/components/icons";
import { triggerVibration } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";

interface CategorySelectionProps {
  onSelect: (category: GameCategory, intensity: number, rounds: number, isTtsEnabled: boolean) => void;
  onBack: () => void;
}

function AdultCategoryDialog({ onConfirm, onCancel, children }: { onConfirm: () => void, onCancel: () => void, children: React.ReactNode }) {
    const [isConfirmed, setIsConfirmed] = useState(false);

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {children}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This category contains mature themes. Please confirm that all players are 18 years of age or older and consent to playing.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex items-center space-x-2 my-2">
                    <Checkbox id="terms" checked={isConfirmed} onCheckedChange={(checked) => setIsConfirmed(checked as boolean)} />
                    <label
                        htmlFor="terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        I confirm all players are 18+ and consent to potentially extreme content.
                    </label>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => { triggerVibration(); onCancel(); }}>Go Back</AlertDialogCancel>
                    <AlertDialogAction 
                        disabled={!isConfirmed}
                        onClick={() => { triggerVibration(); onConfirm(); }}
                    >
                        I Confirm
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export function CategorySelection({ onSelect, onBack }: CategorySelectionProps) {
  const [category, setCategory] = useState<GameCategory | null>(null);
  const [intensity, setIntensity] = useState(1);
  const [rounds, setRounds] = useState(5);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);

  const handleCategorySelect = (selectedCategory: GameCategory) => {
    triggerVibration();
    setCategory(selectedCategory);
  };

  const handleStart = () => {
    if (category) {
      triggerVibration([100, 50, 100]);
      onSelect(category, intensity, rounds, isTtsEnabled);
    }
  };

  const categories: { name: GameCategory, icon: React.ElementType }[] = [
    { name: 'kids', icon: Icons.Kids },
    { name: 'teens', icon: Icons.Teens },
    { name: '18+', icon: Icons.Adult },
  ];

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Choose Your Flavor</CardTitle>
        <CardDescription>Select a category and game length to begin.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-sm font-medium">Category</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {categories.map((cat) => {
              if (cat.name === '18+') {
                return (
                  <AdultCategoryDialog 
                    key={cat.name} 
                    onConfirm={() => handleCategorySelect(cat.name)}
                    onCancel={() => setCategory(null)}
                  >
                    <Button
                      variant={category === cat.name ? "default" : "outline"}
                      className="w-full h-24 flex flex-col gap-2 transition-transform transform-gpu hover:scale-105 active:scale-95"
                      onClick={() => {
                        // The dialog trigger handles the click, but we can pre-emptively set the category
                        // This ensures the button style updates immediately.
                        handleCategorySelect(cat.name)
                      }}
                    >
                      <cat.icon className="w-8 h-8"/>
                      <span className="capitalize">{cat.name}</span>
                    </Button>
                  </AdultCategoryDialog>
                );
              }
              return (
                <Button
                  key={cat.name}
                  variant={category === cat.name ? "default" : "outline"}
                  className="w-full h-24 flex flex-col gap-2 transition-transform transform-gpu hover:scale-105 active:scale-95"
                  onClick={() => handleCategorySelect(cat.name)}
                >
                  <cat.icon className="w-8 h-8"/>
                  <span className="capitalize">{cat.name}</span>
                </Button>
              );
            })}
          </div>
        </div>
        
        <div className="space-y-4 pt-2">
            <Label htmlFor="rounds" className="text-center block">Number of Rounds: {rounds}</Label>
            <Slider
                id="rounds"
                min={3}
                max={15}
                step={1}
                value={[rounds]}
                onValueChange={(value) => setRounds(value[0])}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>Quick Game</span>
                <span>Marathon</span>
            </div>
        </div>

        {category === '18+' && (
          <div className="space-y-4 pt-2 animate-in fade-in duration-300">
            <Label htmlFor="intensity" className="text-center block">Intensity Level: {intensity}</Label>
            <Slider
              id="intensity"
              min={1}
              max={5}
              step={1}
              value={[intensity]}
              onValueChange={(value) => setIntensity(value[0])}
            />
             <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tame</span>
                <span>Wild</span>
            </div>
          </div>
        )}

        <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                    <Label htmlFor="tts-mode">AI Announcer</Label>
                    <p className="text-[0.8rem] text-muted-foreground">
                        Hear prompts read aloud.
                    </p>
                </div>
                <Switch
                    id="tts-mode"
                    checked={isTtsEnabled}
                    onCheckedChange={setIsTtsEnabled}
                />
            </div>
        </div>

      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-4">
        <Button
          onClick={handleStart}
          disabled={!category}
          className="w-full"
          size="lg"
        >
          Let's Play!
        </Button>
        <Button onClick={onBack} variant="outline" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Players
        </Button>
      </CardFooter>
    </Card>
  );
}
