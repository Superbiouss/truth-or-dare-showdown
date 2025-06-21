"use client";

import { useState } from "react";
import type { Player, GameCategory, Prompt } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Icons, AvatarIconKey } from "@/components/icons";
import { triggerVibration } from "@/lib/utils";
import { generatePrompt } from "@/ai/flows/generatePromptFlow";
import { generateWildcard } from "@/ai/flows/generateWildcardFlow";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GameScreenProps {
  players: Player[];
  currentPlayer: Player;
  category: GameCategory;
  intensity: number;
  onTurnComplete: (points: number) => void;
  onEndGame: () => void;
  rounds: number;
  currentRound: number;
}

export function GameScreen({ players, currentPlayer, category, intensity, onTurnComplete, onEndGame, rounds, currentRound }: GameScreenProps) {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [turnInProgress, setTurnInProgress] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([]);
  const { toast } = useToast();

  const getTruthOrDare = async (type: 'truth' | 'dare') => {
    triggerVibration();
    setIsLoading(true);
    try {
        const otherPlayers = players
          .filter(p => p.id !== currentPlayer.id)
          .map(({name, gender}) => ({name, gender}));

        const result = await generatePrompt({
            player: { name: currentPlayer.name, gender: currentPlayer.gender },
            category,
            intensity,
            promptType: type,
            players: otherPlayers,
            previousPrompts: generatedPrompts,
        });

        const points = type === 'truth' ? 5 : 10;
        setPrompt({ type, text: result.prompt, points });
        setGeneratedPrompts(prev => [...prev, result.prompt]);
        setTurnInProgress(true);
    } catch (e) {
        console.error(e);
        toast({ title: "Oh no!", description: "The AI is sleeping on the job. Please try again.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };
  
  const getWildcard = async () => {
    triggerVibration();
    setIsLoading(true);
    try {
        const otherPlayers = players
          .filter(p => p.id !== currentPlayer.id)
          .map(({name, gender}) => ({name, gender}));
        
        const result = await generateWildcard({
            player: { name: currentPlayer.name, gender: currentPlayer.gender },
            category,
            intensity,
            players: otherPlayers,
            previousPrompts: generatedPrompts,
        });

        setPrompt({ type: 'wildcard', text: result.challenge, points: result.points });
        setGeneratedPrompts(prev => [...prev, result.challenge]);
        setTurnInProgress(true);
    } catch (e) {
        console.error(e);
        toast({ title: "Oh no!", description: "The AI is sleeping on the job. Please try again.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleComplete = () => {
    triggerVibration();
    if (prompt) {
      onTurnComplete(prompt.points);
    }
    setPrompt(null);
    setTurnInProgress(false);
  };

  const handleEndGame = () => {
    triggerVibration();
    onEndGame();
  };
  
  const PlayerAvatar = Icons[currentPlayer.avatar as AvatarIconKey];

  return (
    <div className="w-full max-w-2xl text-center animate-in fade-in-0 duration-500">
        <Card className="w-full shadow-xl">
            <CardHeader>
                <CardTitle className="text-3xl font-bold text-primary flex items-center justify-center gap-3">
                    <PlayerAvatar className="w-10 h-10" />
                    {currentPlayer.name}'s Turn
                </CardTitle>
                <CardDescription>Round {currentRound} of {rounds}</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[250px] flex flex-col items-center justify-center p-6 space-y-6">
                {!turnInProgress ? (
                  isLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[176px] gap-4">
                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                        <p className="text-muted-foreground">The AI is thinking...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Button onClick={() => getTruthOrDare('truth')} className="w-full sm:w-48 h-24 text-2xl flex-col gap-2 transition-transform transform-gpu hover:scale-105 active:scale-95">
                            <Icons.Truth className="w-8 h-8"/>
                            Truth
                        </Button>
                        <Button onClick={getWildcard} className="w-full sm:w-48 h-24 text-2xl flex-col gap-2 transition-transform transform-gpu hover:scale-105 active:scale-95 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600">
                            <Icons.Wildcard className="w-8 h-8"/>
                            Wildcard
                        </Button>
                        <Button onClick={() => getTruthOrDare('dare')} variant="destructive" className="w-full sm:w-48 h-24 text-2xl flex-col gap-2 transition-transform transform-gpu hover:scale-105 active:scale-95">
                            <Icons.Dare className="w-8 h-8" />
                            Dare
                        </Button>
                    </div>
                  )
                ) : (
                    <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
                        <h3 className="text-xl font-semibold capitalize text-primary">{prompt?.type}</h3>
                        <p className="text-2xl font-medium">{prompt?.text}</p>
                        {prompt && (
                           <Badge variant="secondary" className="text-base">+{prompt.points} Points</Badge>
                        )}
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
