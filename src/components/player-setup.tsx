"use client";

import { useState } from "react";
import type { Player } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Trash2 } from "lucide-react";

interface PlayerSetupProps {
  onStart: (players: Player[]) => void;
}

export function PlayerSetup({ onStart }: PlayerSetupProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<'male' | 'female' | 'other'>("other");
  const { toast } = useToast();

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === "") {
      toast({
        title: "Oops!",
        description: "Player name can't be empty.",
        variant: "destructive",
      });
      return;
    }
    if (players.length >= 10) {
      toast({
        title: "Max Players Reached",
        description: "You can't add more than 10 players.",
        variant: "destructive",
      });
      return;
    }
    setPlayers([...players, { id: Date.now(), name, gender, score: 0 }]);
    setName("");
  };

  const removePlayer = (id: number) => {
    setPlayers(players.filter((p) => p.id !== id));
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Player Setup</CardTitle>
        <CardDescription>Add at least 2 players to start the showdown!</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddPlayer} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Player Name</Label>
            <Input
              id="name"
              placeholder="Enter a nickname"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Gender (Optional)</Label>
            <RadioGroup
              defaultValue="other"
              onValueChange={(value: 'male' | 'female' | 'other') => setGender(value)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male">Male</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female">Female</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">Other</Label>
              </div>
            </RadioGroup>
          </div>
          <Button type="submit" className="w-full">Add Player</Button>
        </form>
        <div className="mt-6 space-y-2">
          <h3 className="font-medium">Players Joined:</h3>
          <ul className="space-y-2">
            {players.map((player) => (
              <li key={player.id} className="flex items-center justify-between p-2 rounded-md bg-secondary">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{player.name}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removePlayer(player.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => onStart(players)}
          disabled={players.length < 2}
          className="w-full"
          size="lg"
        >
          Start Game
        </Button>
      </CardFooter>
    </Card>
  );
}
