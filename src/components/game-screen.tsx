"use client";

import { useState } from "react";
import type { Player, GameCategory, Prompt } from "@/lib/types";
import { prompts } from "@/lib/prompts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { triggerVibration } from "@/lib/utils";

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
    triggerVibration();
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
    triggerVibration();
    const points = prompt?.type === 'truth' ? 5 : 10;
    onTurnComplete(currentPlayer.id, points);
    setPrompt(null);
    setTurnInProgress(false);
    setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % players.length);
  };

  const handleEndGame = () => {
    triggerVibration();
    onEndGame();
  };

  return (
    <div className="w-full max-w-2xl text-center animate-in fade-in-0 duration-500">
        <Card className="w-full shadow-xl">
            <CardHeader>
                <CardTitle className="text-3xl font-bold text-primary">
                    {currentPlayer.name}'s Turn
                </CardTitle>
                <CardDescription>What will it be?</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[250px] flex flex-col items-center justify-center p-6 space-y-6">
                {!turnInProgress ? (
                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Button onClick={() => getPrompt('truth')} className="w-full sm:w-48 h-24 text-2xl flex-col gap-2 transition-transform transform-gpu hover:scale-105 active:scale-95">
                            <Icons.Truth className="w-8 h-8"/>
                            Truth
                        </Button>
                        <Button onClick={() => getPrompt('dare')} variant="destructive" className="w-full sm:w-48 h-24 text-2xl flex-col gap-2 transition-transform transform-gpu hover:scale-105 active:scale-95">
                            <Icons.Dare className="w-8 h-8" />
                            Dare
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
                        <h3 className="text-xl font-semibold capitalize text-primary">{prompt?.type}</h3>
                        <p className="text-2xl font-medium">{prompt?.text}</p>
                        <Button onClick={handleComplete} size="lg" className="mt-4 transition-transform transform-gpu hover:scale-105 active:scale-95">
                            Completed
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>

        <Button onClick={handleEndGame} variant="ghost" className="mt-8">
            End Game
        </Button>
    </div>
  );
}
