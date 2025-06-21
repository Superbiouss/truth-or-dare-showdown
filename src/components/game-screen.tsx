"use client";

import { useState } from "react";
import type { Player, GameCategory, Prompt } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Icons, AvatarIconKey } from "@/components/icons";
import { triggerVibration } from "@/lib/utils";
import { generatePrompt } from "@/ai/flows/generatePromptFlow";
import { generateWildcard } from "@/ai/flows/generateWildcardFlow";
import { generateSpeech } from "@/ai/flows/generateSpeechFlow";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const getAudio = async (text: string) => {
    if (!isTtsEnabled) return;
    try {
        const result = await generateSpeech({
            text,
            gender: currentPlayer.gender,
        });
        setAudioUrl(result.audioDataUri);
    } catch (e) {
        console.error("TTS generation failed:", e);
        // Don't show a toast for this, as it's a non-critical feature
    }
  }

  const getTruthOrDare = async (type: 'truth' | 'dare') => {
    triggerVibration();
    setIsLoading(true);
    setAudioUrl(null);
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
            previousPrompts: generatedPrompts.slice(-25),
        });

        const points = type === 'truth' ? 5 : 10;
        setPrompt({ type, text: result.prompt, points });
        setGeneratedPrompts(prev => [...prev, result.prompt]);
        setTurnInProgress(true);
        getAudio(result.prompt);
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
    setAudioUrl(null);
    try {
        const otherPlayers = players
          .filter(p => p.id !== currentPlayer.id)
          .map(({name, gender}) => ({name, gender}));
        
        const result = await generateWildcard({
            player: { name: currentPlayer.name, gender: currentPlayer.gender },
            category,
            intensity,
            players: otherPlayers,
            previousPrompts: generatedPrompts.slice(-25),
        });

        setPrompt({ type: 'wildcard', text: result.challenge, points: result.points });
        setGeneratedPrompts(prev => [...prev, result.challenge]);
        setTurnInProgress(true);
        getAudio(result.challenge);
    } catch (e) {
        console.error(e);
        toast({ title: "Oh no!", description: "The AI is sleeping on the job. Please try again.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const clearTurnState = () => {
    setPrompt(null);
    setAudioUrl(null);
    setTurnInProgress(false);
  }

  const handleComplete = () => {
    triggerVibration();
    if (prompt) {
      onTurnComplete(prompt.points);
    }
    clearTurnState();
  };
  
  const handleSkip = () => {
    triggerVibration();
    const penalty = -5;
    onTurnComplete(penalty);
    toast({
        title: "Task Skipped",
        description: `You lost 5 points.`,
        variant: "destructive",
    });
    clearTurnState();
  };

  const handleEndGame = () => {
    triggerVibration();
    onEndGame();
  };
  
  const PlayerAvatar = Icons[currentPlayer.avatar as AvatarIconKey];
  const TtsIcon = isTtsEnabled ? Icons.Volume2 : Icons.VolumeX;

  return (
    <div className="w-full max-w-2xl text-center animate-in fade-in-0 duration-500">
        <Card className="w-full shadow-xl">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="text-left">
                        <CardTitle className="text-3xl font-bold text-primary flex items-center gap-3">
                            <PlayerAvatar className="w-10 h-10" />
                            {currentPlayer.name}'s Turn
                        </CardTitle>
                        <CardDescription>Round {currentRound} of {rounds}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                        <TtsIcon className="w-5 h-5 text-muted-foreground" />
                        <Switch
                            id="tts-switch"
                            checked={isTtsEnabled}
                            onCheckedChange={setIsTtsEnabled}
                        />
                        <Label htmlFor="tts-switch" className="sr-only">Toggle Voice</Label>
                    </div>
                </div>
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
                        {audioUrl && <audio src={audioUrl} autoPlay />}
                        {prompt && (
                           <Badge variant="secondary" className="text-base">+{prompt.points} Points</Badge>
                        )}
                        <div className="flex justify-center items-center gap-4">
                            <Button onClick={handleSkip} size="lg" variant="outline" className="mt-4 transition-transform transform-gpu hover:scale-105 active:scale-95">
                                Skip (-5 Pts)
                            </Button>
                            <Button onClick={handleComplete} size="lg" className="mt-4 transition-transform transform-gpu hover:scale-105 active:scale-95">
                                Completed
                            </Button>
                        </div>
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
