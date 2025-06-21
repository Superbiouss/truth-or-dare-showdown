"use client";

import { useState, useRef, useEffect } from "react";
import type { Player, GameCategory, Prompt } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Icons, AvatarIconKey } from "@/components/icons";
import { triggerVibration, playTick, playTimesUp } from "@/lib/utils";
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
  isTtsEnabled: boolean;
  setIsTtsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

export function GameScreen({ players, currentPlayer, category, intensity, onTurnComplete, onEndGame, rounds, currentRound, isTtsEnabled, setIsTtsEnabled }: GameScreenProps) {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [turnInProgress, setTurnInProgress] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([]);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    // Initialize AudioContext on the client for timer sounds
    if (typeof window !== 'undefined') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const getTruthOrDare = async (type: 'truth' | 'dare') => {
    triggerVibration();
    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
    setIsLoading(true);
    try {
        const otherPlayers = players
          .filter(p => p.id !== currentPlayer.id)
          .map(({name, gender}) => ({name, gender}));

        const promptPromise = generatePrompt({
            player: { name: currentPlayer.name, gender: currentPlayer.gender },
            category,
            intensity,
            promptType: type,
            players: otherPlayers,
            previousPrompts: generatedPrompts.slice(-25),
        });

        let speechPromise = null;
        if (isTtsEnabled) {
          speechPromise = promptPromise.then(result =>
            generateSpeech({ text: result.prompt, gender: currentPlayer.gender })
          ).catch(e => {
            console.error("TTS generation failed:", e);
            if (e instanceof Error && (e.message.includes('429') || e.message.includes('quota'))) {
                toast({
                    title: "AI Announcer Limit Reached",
                    description: "The free daily limit for the AI voice has been reached. It will be available again tomorrow.",
                    variant: "destructive"
                });
                setIsTtsEnabled(false);
            } else {
                toast({
                    title: "AI Announcer Error",
                    description: "Could not generate the voice prompt.",
                    variant: "destructive"
                });
            }
            return null; // Return null on speech failure
          });
        }
        
        const [result, speechResult] = await Promise.all([promptPromise, speechPromise]);
        
        const promptText = result.prompt;
        const points = type === 'truth' ? 5 : 10;
        
        if (isTtsEnabled && speechResult && audioPlayerRef.current) {
            audioPlayerRef.current.src = speechResult.audioDataUri;
            audioPlayerRef.current.play().catch(error => {
                console.error("Audio playback failed:", error);
                toast({
                  title: "Audio Error",
                  description: "Could not play announcer audio. Your browser might be blocking it.",
                  variant: "destructive"
                })
            });
        }

        setPrompt({ type, text: promptText, points, timerInSeconds: result.timerInSeconds });
        if (result.timerInSeconds) {
            setTimeLeft(result.timerInSeconds);
        }
        setGeneratedPrompts(prev => [...prev, promptText]);
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
    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
    setIsLoading(true);
    try {
        const otherPlayers = players
          .filter(p => p.id !== currentPlayer.id)
          .map(({name, gender}) => ({name, gender}));
        
        const wildcardPromise = generateWildcard({
            player: { name: currentPlayer.name, gender: currentPlayer.gender },
            category,
            intensity,
            players: otherPlayers,
            previousPrompts: generatedPrompts.slice(-25),
        });
        
        let speechPromise = null;
        if (isTtsEnabled) {
          speechPromise = wildcardPromise.then(result =>
            generateSpeech({ text: result.challenge, gender: currentPlayer.gender })
          ).catch(e => {
            console.error("TTS generation failed:", e);
            if (e instanceof Error && (e.message.includes('429') || e.message.includes('quota'))) {
                toast({
                    title: "AI Announcer Limit Reached",
                    description: "The free daily limit for the AI voice has been reached. It will be available again tomorrow.",
                    variant: "destructive"
                });
                setIsTtsEnabled(false);
            } else {
                toast({
                    title: "AI Announcer Error",
                    description: "Could not generate the voice prompt.",
                    variant: "destructive"
                });
            }
            return null; // Return null on speech failure
          });
        }
        
        const [result, speechResult] = await Promise.all([wildcardPromise, speechPromise]);

        const challengeText = result.challenge;

        if (isTtsEnabled && speechResult && audioPlayerRef.current) {
            audioPlayerRef.current.src = speechResult.audioDataUri;
            audioPlayerRef.current.play().catch(error => {
                console.error("Audio playback failed:", error);
                toast({
                  title: "Audio Error",
                  description: "Could not play announcer audio. Your browser might be blocking it.",
                  variant: "destructive"
                })
            });
        }

        setPrompt({ type: 'wildcard', text: challengeText, points: result.points, timerInSeconds: result.timerInSeconds });
        if (result.timerInSeconds) {
            setTimeLeft(result.timerInSeconds);
        }
        setGeneratedPrompts(prev => [...prev, challengeText]);
        setTurnInProgress(true);
    } catch (e) {
        console.error(e);
        toast({ title: "Oh no!", description: "The AI is sleeping on the job. Please try again.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const clearTurnState = () => {
    setPrompt(null);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = "";
    }
    setTurnInProgress(false);
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
  
  const PlayerAvatar = Icons[currentPlayer.avatar as AvatarIconKey];
  const TtsIcon = isTtsEnabled ? Icons.Volume2 : Icons.VolumeX;

  return (
    <div className="w-full max-w-2xl text-center animate-in fade-in-0 duration-500">
        <audio ref={audioPlayerRef} className="hidden" />
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
                            <Button onClick={handleComplete} size="lg" className="transition-transform transform-gpu hover:scale-105 active:scale-95">
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
