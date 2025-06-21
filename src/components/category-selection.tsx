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

interface CategorySelectionProps {
  onSelect: (category: GameCategory, intensity: number, rounds: number) => void;
}

export function CategorySelection({ onSelect }: CategorySelectionProps) {
  const [category, setCategory] = useState<GameCategory | null>(null);
  const [intensity, setIntensity] = useState(1);
  const [rounds, setRounds] = useState(5);

  const handleCategorySelect = (selectedCategory: GameCategory) => {
    triggerVibration();
    setCategory(selectedCategory);
  };

  const handleStart = () => {
    if (category) {
      triggerVibration([100, 50, 100]);
      onSelect(category, intensity, rounds);
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
                  <AlertDialog key={cat.name}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant={category === cat.name ? "default" : "outline"}
                        className="w-full h-24 flex flex-col gap-2 transition-transform transform-gpu hover:scale-105 active:scale-95"
                        onClick={() => handleCategorySelect(cat.name)}
                      >
                        <cat.icon className="w-8 h-8"/>
                        <span className="capitalize">{cat.name}</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This category contains mature themes. Please ensure all players are 18 years of age or older.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { triggerVibration(); setCategory(null); }}>Go Back</AlertDialogCancel>
                        <AlertDialogAction onClick={() => triggerVibration()}>I Confirm</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleStart}
          disabled={!category}
          className="w-full"
          size="lg"
        >
          Let's Play!
        </Button>
      </CardFooter>
    </Card>
  );
}
