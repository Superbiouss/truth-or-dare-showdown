"use client";

import { useState } from "react";
import type { Player } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Users } from "lucide-react";
import { triggerVibration } from "@/lib/utils";

interface PlayerSetupProps {
  onStart: (players: Player[]) => void;
}

export function PlayerSetup({ onStart }: PlayerSetupProps) {
  const [numPlayers, setNumPlayers] = useState<number | null>(null);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const { toast } = useToast();

  const handleNumPlayerSelect = (num: number) => {
    triggerVibration();
    setNumPlayers(num);
    setPlayerNames(Array(num).fill(""));
  };

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handleStartGame = () => {
    triggerVibration();
    if (playerNames.some((name) => name.trim() === "")) {
      toast({
        title: "Incomplete Setup",
        description: "Please enter a name for every player.",
        variant: "destructive",
      });
      return;
    }

    const newPlayers: Player[] = playerNames.map((name, index) => ({
      id: index,
      name: name.trim(),
      score: 0,
    }));
    onStart(newPlayers);
  };
  
  const playerCounts = [2, 3, 4];

  return (
    <Card className="w-full max-w-md bg-card/30 backdrop-blur-lg border border-primary/20 shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Player Setup</CardTitle>
        <CardDescription>
          {numPlayers === null
            ? "Choose the number of players."
            : "Enter player names."}
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-[200px]">
        {numPlayers === null ? (
          <div className="flex justify-around items-center pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {playerCounts.map((num) => (
                <Button
                    key={num}
                    variant="outline"
                    className="w-24 h-24 flex-col gap-2 text-lg transition-transform transform-gpu hover:scale-105 active:scale-95"
                    onClick={() => handleNumPlayerSelect(num)}
                >
                    <Users />
                    {num} Players
                </Button>
             ))}
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in-0 duration-500">
            {playerNames.map((name, index) => (
              <div key={index} className="space-y-2">
                <Label htmlFor={`player-${index}`}>Player {index + 1}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id={`player-${index}`}
                    placeholder={`Enter Player ${index + 1}'s Name`}
                    value={name}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            ))}
             <Button variant="link" onClick={() => { triggerVibration(); setNumPlayers(null); }}>
                Back
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleStartGame}
          disabled={numPlayers === null}
          className="w-full"
          size="lg"
        >
          Start Game
        </Button>
      </CardFooter>
    </Card>
  );
}
