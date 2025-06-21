"use client";

import { useState, useEffect } from "react";
import type { Player, GameCategory, Prompt } from "@/lib/types";
import { prompts } from "@/lib/prompts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Icons } from "@/components/icons";

interface GameScreenProps {
  players: Player[];
  category: GameCategory;
  intensity: number;
  onTurnComplete: (playerId: number, points: number) => void;
  onEndGame: () => void;
}

export function GameScreen({ players, category, intensity, onTurnComplete, onEndGame }: GameScreenProps) {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [turnInProgress, setTurnInProgress] = useState(false);

  const currentPlayer = players[currentPlayerIndex];

  const getPrompt = (type: 'truth' | 'dare') => {
    let availablePrompts: string[] = [];
    if (category === '18+') {
      availablePrompts = prompts[category][type][intensity as keyof typeof prompts['18+']['truth']];
    } else {
      availablePrompts = prompts[category][type];
    }
    const randomIndex = Math.floor(Math.random() * availablePrompts.length);
    const promptText = availablePrompts[randomIndex];
    setPrompt({ type, text: promptText });
    setTurnInProgress(true);
  };

  const handleComplete = () => {
    const points = prompt?.type === 'truth' ? 5 : 10;
    onTurnComplete(currentPlayer.id, points);
    setPrompt(null);
    setTurnInProgress(false);
    setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % players.length);
  };
  
  // Pre-load background image based on category
  useEffect(() => {
    let bgUrl = '';
    switch(category) {
      case 'kids': bgUrl = '/bg-kids.svg'; break;
      case 'teens': bgUrl = '/bg-teens.svg'; break;
      case '18+': bgUrl = '/bg-adult.svg'; break;
    }
    document.body.style.backgroundImage = `url(${bgUrl})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';

    return () => {
      document.body.style.backgroundImage = '';
    }
  }, [category]);


  return (
    <div className="w-full max-w-2xl text-center">
        <Card className="w-full bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-3xl font-bold text-primary">
                    {currentPlayer.name}'s Turn
                </CardTitle>
                <CardDescription>What will it be?</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[250px] flex flex-col items-center justify-center p-6 space-y-6">
                {!turnInProgress ? (
                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center animate-in fade-in duration-500">
                        <Button onClick={() => getPrompt('truth')} className="w-full sm:w-48 h-24 text-2xl flex-col gap-2">
                            <Icons.Truth className="w-8 h-8"/>
                            Truth
                        </Button>
                        <Button onClick={() => getPrompt('dare')} variant="destructive" className="bg-red-500 hover:bg-red-600 w-full sm:w-48 h-24 text-2xl flex-col gap-2">
                            <Icons.Dare className="w-8 h-8" />
                            Dare
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6 text-center animate-in fade-in duration-500">
                        <h3 className="text-xl font-semibold capitalize text-accent-foreground">{prompt?.type}</h3>
                        <p className="text-2xl font-medium">{prompt?.text}</p>
                        <Button onClick={handleComplete} size="lg" className="mt-4">
                            Completed
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
        <Button onClick={onEndGame} variant="ghost" className="mt-8">
            End Game
        </Button>
    </div>
  );
}
