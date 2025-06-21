"use client";

import { useState, useRef, useEffect } from "react";
import type { Player, GameCategory, Prompt } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Icons, AvatarIconKey } from "@/components/icons";
import { triggerVibration, playTick, playTimesUp } from "@/lib/utils";
import { generatePrompt } from "@/ai/flows/generatePromptFlow";
import { generateWildcard } from "@/ai/flows/generateWildcardFlow";
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
  isTtsEnabled: boolean;
  setIsTtsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  isSuddenDeath: boolean;
}

// Use the browser's built-in speech synthesis for a reliable, free TTS experience
const speak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
        return;
    }
    window.speechSynthesis.cancel(); // Stop any previous speech
    const utterance = new SpeechSynthesisUtterance(text);
    // Using the default browser voice is the most reliable cross-platform approach
    window.speechSynthesis.speak(utterance);
};

export function GameScreen({ players, currentPlayer, category, intensity, onTurnComplete, onEndGame, rounds, currentRound, isTtsEnabled, setIsTtsEnabled, isSuddenDeath }: GameScreenProps) {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [turnInProgress, setTurnInProgress] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([]);

  // Timer state
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    // Initialize AudioContext on the client for timer sounds
    if (typeof window !== 'undefined' && !audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Reset turn state when player changes
    clearTurnState();
  }, [currentPlayer?.id]);


  const handlePromptSelection = async (type: 'truth' | 'dare' | 'wildcard') => {
    triggerVibration();
    setTurnInProgress(true);
    setIsLoading(true);

    try {
      const otherPlayers = players
        .filter(p => p.id !== currentPlayer.id)
        .map(({ name, gender }) => ({ name, gender }));

      const commonInput = {
        player: { name: currentPlayer.name, gender: currentPlayer.gender },
        category,
        intensity,
        players: otherPlayers,
        previousPrompts: generatedPrompts.slice(-20), // Send recent history to AI
      };

      let selectedPrompt: Prompt | null = null;

      if (type === 'truth' || type === 'dare') {
        const result = await generatePrompt({ ...commonInput, promptType: type });
        if (!result?.prompt) throw new Error("AI failed to generate a prompt.");
        const points = type === 'truth' ? 5 : 10;
        selectedPrompt = { type, text: result.prompt, points, timerInSeconds: result.timerInSeconds };
      } else if (type === 'wildcard') {
        const result = await generateWildcard({ player: commonInput.player, category, intensity, players: commonInput.players, previousPrompts: commonInput.previousPrompts });
        if (!result?.challenge) throw new Error("AI failed to generate a challenge.");
        selectedPrompt = { type, text: result.challenge, points: result.points, timerInSeconds: result.timerInSeconds };
      }

      if (!selectedPrompt) return;

      if (isTtsEnabled) {
        speak(selectedPrompt.text);
      }

      setPrompt(selectedPrompt);
      if (selectedPrompt.timerInSeconds) {
        setTimeLeft(selectedPrompt.timerInSeconds);
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: "Oh no!", description: "The AI is having trouble coming up with ideas. Please try again.", variant: "destructive" });
      setTurnInProgress(false); // Go back to selection screen
    } finally {
      setIsLoading(false);
    }
  };
  
  const clearTurnState = () => {
    setPrompt(null);
    setTurnInProgress(false);
    setIsLoading(false);
    // Clear timer state
    setIsTimerRunning(false);
    setTimeLeft(null);
    if (timerRef.current) {
        clearInterval(timerRef.current);
    }
  }

  const handleComplete = () => {
    triggerVibration();
    if (prompt) {
      onTurnComplete(prompt.points);
      setGeneratedPrompts(prev => [...prev, prompt.text]); // Add used prompt to history
    }
    clearTurnState();
  };
  
  const handleSkip = () => {
    triggerVibration();
    const penalty = -5;
    onTurnComplete(penalty);
     if (prompt) {
        setGeneratedPrompts(prev => [...prev, prompt.text]); // Also add skipped prompt to history
     }
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

  const handleStartTimer = () => {
    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
    }
    setIsTimerRunning(true);
  }

  // Timer countdown effect
  useEffect(() => {
    if (isTimerRunning && timeLeft !== null && timeLeft > 0) {
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => (prev !== null ? prev - 1 : 0));
            if (audioContextRef.current) {
                playTick(audioContextRef.current);
            }
        }, 1000);
    } else if (isTimerRunning && timeLeft === 0) {
        setIsTimerRunning(false);
        if (audioContextRef.current) {
            playTimesUp(audioContextRef.current);
        }
        triggerVibration([100, 50, 100]);
    }

    return () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };
  }, [isTimerRunning, timeLeft]);
  
  if (!currentPlayer) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[176px] gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading next round...</p>
        </div>
    );
  }

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
                        {isSuddenDeath ? (
                          <Badge className="mt-2 text-base" variant="destructive">SUDDEN DEATH</Badge>
                        ) : (
                          <CardDescription>Round {currentRound} of {rounds}</CardDescription>
                        )}
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
                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Button onClick={() => handlePromptSelection('truth')} className="w-full sm:w-48 h-24 text-2xl flex-col gap-2 transition-transform transform-gpu hover:scale-105 active:scale-95 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600">
                            <Icons.Truth className="w-8 h-8"/>
                            Truth
                        </Button>
                        <Button onClick={() => handlePromptSelection('wildcard')} className="w-full sm:w-48 h-24 text-2xl flex-col gap-2 transition-transform transform-gpu hover:scale-105 active:scale-95 bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-600">
                            <Icons.Wildcard className="w-8 h-8"/>
                            Wildcard
                        </Button>
                        <Button onClick={() => handlePromptSelection('dare')} variant="destructive" className="w-full sm:w-48 h-24 text-2xl flex-col gap-2 transition-transform transform-gpu hover:scale-105 active:scale-95">
                            <Icons.Dare className="w-8 h-8" />
                            Dare
                        </Button>
                    </div>
                ) : isLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[176px] gap-4">
                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                        <p className="text-muted-foreground">The AI is thinking...</p>
                    </div>
                ) : (
                    <div className="space-y-4 text-center animate-in fade-in zoom-in-95 duration-500 w-full">
                        <h3 className="text-xl font-semibold capitalize text-primary">{prompt?.type}</h3>
                        <p className="text-2xl font-medium">{prompt?.text}</p>
                        {prompt && (
                           <Badge variant="secondary" className="text-base">+{prompt.points} Points</Badge>
                        )}
                        
                        {/* Timer Section */}
                        {prompt?.timerInSeconds && timeLeft !== null && (
                            <div className="mt-6 space-y-4">
                                <div className="text-6xl font-bold font-mono text-primary tabular-nums">
                                    {timeLeft}s
                                </div>
                                {!isTimerRunning && timeLeft > 0 ? (
                                    <Button onClick={handleStartTimer} size="lg" className="bg-green-600 hover:bg-green-700">
                                        <Icons.Play className="mr-2" /> Start Timer
                                    </Button>
                                ) : timeLeft === 0 ? (
                                    <p className="text-lg font-semibold text-green-600 animate-pulse">Time's up!</p>
                                ) : (
                                    <p className="text-muted-foreground">Timer running...</p>
                                )}
                            </div>
                        )}

                        <div className="flex justify-center items-center gap-4 pt-4">
                            <Button onClick={handleSkip} size="lg" variant="outline" className="transition-transform transform-gpu hover:scale-105 active:scale-95">
                                Skip (-5 Pts)
                            </Button>
                            <Button onClick={handleComplete} size="lg" className="transition-transform transform-gpu hover:scale-105 active:scale-95" disabled={isTimerRunning}>
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
