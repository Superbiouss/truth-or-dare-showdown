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
}

type PrefetchedPrompts = {
  truth: Prompt | null;
  dare: Prompt | null;
  wildcard: Prompt | null;
};

export function GameScreen({ players, currentPlayer, category, intensity, onTurnComplete, onEndGame, rounds, currentRound, isTtsEnabled, setIsTtsEnabled }: GameScreenProps) {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [turnInProgress, setTurnInProgress] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([]);
  const [prefetchedPrompts, setPrefetchedPrompts] = useState<PrefetchedPrompts>({ truth: null, dare: null, wildcard: null });

  // Timer state
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Web Speech API state
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    // Initialize AudioContext on the client for timer sounds
    if (typeof window !== 'undefined') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Load voices for Web Speech API
    const loadVoices = () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
                setVoices(availableVoices);
            }
        }
    };
    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            window.speechSynthesis.onvoiceschanged = null;
        }
    }
  }, []);

  // Pre-fetch all prompts when the turn starts
  useEffect(() => {
    const prefetchPrompts = async () => {
      // Reset state for the new turn and show loader
      setIsLoading(true);
      setTurnInProgress(false);
      setPrompt(null);
      setPrefetchedPrompts({ truth: null, dare: null, wildcard: null });

      try {
        const otherPlayers = players
          .filter(p => p.id !== currentPlayer.id)
          .map(({name, gender}) => ({name, gender}));
        
        const commonInput = {
            player: { name: currentPlayer.name, gender: currentPlayer.gender },
            category,
            intensity,
            players: otherPlayers,
            previousPrompts: generatedPrompts.slice(-50), // Send more history to AI
        };

        // Fetch all three prompts in parallel
        const [truthResult, dareResult, wildcardResult] = await Promise.all([
          generatePrompt({ ...commonInput, promptType: 'truth' }),
          generatePrompt({ ...commonInput, promptType: 'dare' }),
          generateWildcard({ player: commonInput.player, category, intensity, players: commonInput.players, previousPrompts: commonInput.previousPrompts }),
        ]);

        const newPrefetchedPrompts = {
          truth: { type: 'truth' as const, text: truthResult.prompt, points: 5, timerInSeconds: truthResult.timerInSeconds },
          dare: { type: 'dare' as const, text: dareResult.prompt, points: 10, timerInSeconds: dareResult.timerInSeconds },
          wildcard: { type: 'wildcard' as const, text: wildcardResult.challenge, points: wildcardResult.points, timerInSeconds: wildcardResult.timerInSeconds },
        };
        
        setPrefetchedPrompts(newPrefetchedPrompts);

      } catch (e) {
        console.error(e);
        toast({ title: "Oh no!", description: "The AI is having trouble coming up with ideas. Please try again later.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    prefetchPrompts();
    // This effect runs only when a new player's turn starts.
  }, [currentPlayer.id, players, category, intensity, toast, generatedPrompts]);

  const speak = (text: string, gender: 'male' | 'female') => {
    if (!isTtsEnabled || typeof window === 'undefined' || !window.speechSynthesis || voices.length === 0) {
        return;
    }
    
    window.speechSynthesis.cancel(); // Stop any previous speech
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    let selectedVoice = null;
    // We want the opposite gender voice for the announcer
    if (gender === 'female') { // Find a male voice
        selectedVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google US English')) || 
                        voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('male'));
    } else { // Find a female voice
        selectedVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google UK English Female')) ||
                        voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'));
    }

    utterance.voice = selectedVoice || voices.find(v => v.default && v.lang.startsWith('en')) || voices[0];
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
  }
  
  const handlePromptSelection = (selectedPrompt: Prompt | null) => {
    if (!selectedPrompt) return;

    triggerVibration();
    speak(selectedPrompt.text, currentPlayer.gender);
    setPrompt(selectedPrompt);
    
    if (selectedPrompt.timerInSeconds) {
        setTimeLeft(selectedPrompt.timerInSeconds);
    }
    
    setTurnInProgress(true);
  };
  
  const clearTurnState = () => {
    setPrompt(null);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
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
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[176px] gap-4">
                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                        <p className="text-muted-foreground">The AI is thinking...</p>
                    </div>
                ) : !turnInProgress ? (
                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Button onClick={() => handlePromptSelection(prefetchedPrompts.truth)} disabled={!prefetchedPrompts.truth} className="w-full sm:w-48 h-24 text-2xl flex-col gap-2 transition-transform transform-gpu hover:scale-105 active:scale-95 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600">
                            <Icons.Truth className="w-8 h-8"/>
                            Truth
                        </Button>
                        <Button onClick={() => handlePromptSelection(prefetchedPrompts.wildcard)} disabled={!prefetchedPrompts.wildcard} className="w-full sm:w-48 h-24 text-2xl flex-col gap-2 transition-transform transform-gpu hover:scale-105 active:scale-95 bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-600">
                            <Icons.Wildcard className="w-8 h-8"/>
                            Wildcard
                        </Button>
                        <Button onClick={() => handlePromptSelection(prefetchedPrompts.dare)} disabled={!prefetchedPrompts.dare} variant="destructive" className="w-full sm:w-48 h-24 text-2xl flex-col gap-2 transition-transform transform-gpu hover:scale-105 active:scale-95">
                            <Icons.Dare className="w-8 h-8" />
                            Dare
                        </Button>
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
