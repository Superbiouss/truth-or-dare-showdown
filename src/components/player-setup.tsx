"use client";

import { useState } from "react";
import type { Player } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, X, PlusCircle, ArrowLeft } from "lucide-react";
import { triggerVibration } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Icons, avatarIconKeys, AvatarIconKey } from "@/components/icons";

interface PlayerSetupProps {
  onStart: (players: Player[]) => void;
  onShowHistory: () => void;
  onBack: () => void;
}

export function PlayerSetup({ onStart, onShowHistory, onBack }: PlayerSetupProps) {
  const [players, setPlayers] = useState<{ name: string; gender: 'male' | 'female'; avatar: AvatarIconKey }[]>([
    { name: "", gender: 'male', avatar: 'Cat' },
    { name: "", gender: 'male', avatar: 'Dog' },
  ]);
  const { toast } = useToast();

  const handleNameChange = (index: number, name: string) => {
    const newPlayers = [...players];
    newPlayers[index].name = name;
    setPlayers(newPlayers);
  };

  const handleGenderChange = (index: number, gender: 'male' | 'female') => {
    const newPlayers = [...players];
    newPlayers[index].gender = gender;
    setPlayers(newPlayers);
  };
  
  const handleAvatarChange = (index: number, avatar: AvatarIconKey) => {
    const newPlayers = [...players];
    newPlayers[index].avatar = avatar;
    setPlayers(newPlayers);
  };

  const addPlayer = () => {
    triggerVibration();
    if (players.length < 8) {
      const usedAvatars = new Set(players.map(p => p.avatar));
      const nextAvatar = avatarIconKeys.find(key => !usedAvatars.has(key));
      
      if (nextAvatar) {
        setPlayers([...players, { name: "", gender: 'male', avatar: nextAvatar }]);
      } else {
        toast({
            title: "No available avatars",
            description: "All avatars are currently in use.",
            variant: "destructive"
        })
      }
    } else {
        toast({
            title: "Max players reached",
            description: "You can have a maximum of 8 players.",
            variant: "destructive"
        })
    }
  };

  const removePlayer = (index: number) => {
    triggerVibration();
    if (players.length > 2) {
      const newPlayers = players.filter((_, i) => i !== index);
      setPlayers(newPlayers);
    }
  };

  const handleStartGame = () => {
    triggerVibration([100, 50, 100]);
    if (players.some((p) => p.name.trim() === "")) {
      toast({
        title: "Incomplete Setup",
        description: "Please enter a name for every player.",
        variant: "destructive",
      });
      return;
    }

    const newPlayers: Player[] = players.map((p, index) => ({
      id: index,
      name: p.name.trim(),
      score: 0,
      gender: p.gender,
      avatar: p.avatar,
    }));
    onStart(newPlayers);
  };

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Player Setup</CardTitle>
        <CardDescription>Add up to 8 players to start the game.</CardDescription>
      </CardHeader>
      <CardContent className="min-h-[200px] space-y-4">
        {players.map((player, index) => (
          <div key={index} className="space-y-3 p-3 border rounded-lg animate-in fade-in-0 duration-500">
            <div className="flex items-center gap-2">
              <Label htmlFor={`player-${index}`} className="sr-only">Player {index + 1}</Label>
              <div className="relative flex-grow">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id={`player-${index}`}
                  placeholder={`Player ${index + 1}'s Name`}
                  value={player.name}
                  onChange={(e) => handleNameChange(index, e.target.value)}
                  className="pl-10"
                />
              </div>
              {players.length > 2 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removePlayer(index)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Remove player"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center justify-between">
              <RadioGroup
                value={player.gender}
                onValueChange={(value) => handleGenderChange(index, value as 'male' | 'female')}
                className="flex gap-4 pt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id={`male-${index}`} />
                  <Label htmlFor={`male-${index}`}>Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id={`female-${index}`} />
                  <Label htmlFor={`female-${index}`}>Female</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
                {avatarIconKeys.map((iconKey) => {
                    const Icon = Icons[iconKey];
                    const isTaken = players.some((p, i) => i !== index && p.avatar === iconKey);
                    return (
                        <Button key={iconKey} variant={player.avatar === iconKey ? 'default' : 'outline'} size="icon" onClick={() => handleAvatarChange(index, iconKey)} className="rounded-full" disabled={isTaken}>
                            <Icon className="w-5 h-5" />
                        </Button>
                    )
                })}
            </div>
          </div>
        ))}
        {players.length < 8 && (
          <div className="pt-2 animate-in fade-in-0 duration-500">
            <Button
              variant="outline"
              className="w-full"
              onClick={addPlayer}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Player
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-4">
        <Button
          onClick={handleStartGame}
          disabled={players.some(p => p.name.trim() === "")}
          className="w-full"
          size="lg"
        >
          Start Game
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={onShowHistory}
        >
          <Icons.History className="mr-2 h-4 w-4" />
          Game History
        </Button>
        <Button onClick={onBack} variant="ghost" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Welcome
        </Button>
      </CardFooter>
    </Card>
  );
}
