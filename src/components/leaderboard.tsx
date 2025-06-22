"use client";

import { useState, useEffect } from "react";
import type { Player } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Icons, AvatarIconKey } from "@/components/icons";
import { triggerVibration } from "@/lib/utils";
import Confetti from 'react-confetti';

interface LeaderboardProps {
  players: Player[];
  onPlayAgain: () => void;
}

export function Leaderboard({ players, onPlayAgain }: LeaderboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const [showConfetti, setShowConfetti] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const topScore = sortedPlayers.length > 0 && sortedPlayers[0].score > 0 ? sortedPlayers[0].score : 0;

  useEffect(() => {
    // This hook runs only on the client side
    const { innerWidth, innerHeight } = window;
    setDimensions({
        width: innerWidth,
        height: innerHeight,
    });
    setShowConfetti(true);

    // Stop confetti after a few seconds to save performance
    const timer = setTimeout(() => setShowConfetti(false), 8000); // 8 seconds
    
    // Fun vibration pattern for the winner!
    triggerVibration([200, 50, 200]);

    // Cleanup timer on component unmount
    return () => clearTimeout(timer);
  }, []);

  const handlePlayAgainClick = () => {
    triggerVibration([100, 50, 100]);
    onPlayAgain();
  }

  return (
    <>
      {showConfetti && (
        <Confetti
          width={dimensions.width}
          height={dimensions.height}
          recycle={false}
          numberOfPieces={500}
          tweenDuration={6000}
          gravity={0.15}
        />
      )}
      <Card className="w-full max-w-md shadow-xl z-10 relative">
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
              {sortedPlayers.map((player, index) => {
                const AvatarIcon = Icons[player.avatar as AvatarIconKey];
                const isWinner = player.score === topScore;
                return (
                <TableRow 
                  key={player.id} 
                  className={`animate-in fade-in slide-in-from-bottom-4 ${isWinner ? "bg-yellow-400/20" : ""}`}
                  style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'backwards' }}
                >
                  <TableCell className="font-medium text-center">
                    {isWinner ? <Icons.Crown className="w-5 h-5 inline text-yellow-500 animate-in zoom-in-150 duration-500 delay-500" /> : index + 1}
                  </TableCell>
                  <TableCell className="flex items-center gap-3">
                    <AvatarIcon className="w-6 h-6" />
                    {player.name}
                  </TableCell>
                  <TableCell className="text-right">{player.score}</TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <Button onClick={handlePlayAgainClick} className="w-full" size="lg">
            Play Again
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
