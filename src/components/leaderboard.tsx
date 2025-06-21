"use client";

import type { Player } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Icons } from "@/components/icons";
import { triggerVibration } from "@/lib/utils";

interface LeaderboardProps {
  players: Player[];
  onPlayAgain: () => void;
}

export function Leaderboard({ players, onPlayAgain }: LeaderboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const handlePlayAgainClick = () => {
    triggerVibration([100, 50, 100]);
    onPlayAgain();
  }

  return (
    <Card className="w-full max-w-md bg-card/30 backdrop-blur-lg border border-primary/20 shadow-xl">
      <CardHeader className="text-center">
        <div className="flex justify-center animate-in zoom-in-75 duration-500">
            <Icons.Award className="w-16 h-16 text-yellow-400" />
        </div>
        <CardTitle className="text-3xl">Game Over!</CardTitle>
        <CardDescription>Here are the final scores.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPlayers.map((player, index) => (
              <TableRow 
                key={player.id} 
                className={`animate-in fade-in slide-in-from-bottom-4 ${index === 0 ? "bg-yellow-400/20" : ""}`}
                style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'backwards' }}
              >
                <TableCell className="font-medium text-center">
                  {index === 0 ? <Icons.Crown className="w-5 h-5 inline text-yellow-500 animate-in zoom-in-150 duration-500 delay-500" /> : index + 1}
                </TableCell>
                <TableCell>{player.name}</TableCell>
                <TableCell className="text-right">{player.score}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <Button onClick={handlePlayAgainClick} className="w-full" size="lg">
          Play Again
        </Button>
      </CardFooter>
    </Card>
  );
}
