"use client";

import { useState } from "react";
import type { Player, GameCategory, Screen } from "@/lib/types";
import { PlayerSetup } from "@/components/player-setup";
import { CategorySelection } from "@/components/category-selection";
import { GameScreen } from "@/components/game-screen";
import { Leaderboard } from "@/components/leaderboard";
import { Icons } from "@/components/icons";

export default function Home() {
  const [screen, setScreen] = useState<Screen>('player-setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [category, setCategory] = useState<GameCategory>('kids');
  const [intensity, setIntensity] = useState(1);

  const handleStartGame = (newPlayers: Player[]) => {
    setPlayers(newPlayers);
    setScreen('category-selection');
  };

  const handleCategorySelect = (selectedCategory: GameCategory, selectedIntensity: number) => {
    setCategory(selectedCategory);
    setIntensity(selectedIntensity);
    setScreen('game');
  };

  const handleTurnComplete = (playerId: number, points: number) => {
    setPlayers(prevPlayers =>
      prevPlayers.map(p =>
        p.id === playerId ? { ...p, score: p.score + points } : p
      )
    );
  };

  const handleEndGame = () => {
    setScreen('leaderboard');
  };

  const handlePlayAgain = () => {
    setPlayers([]);
    setCategory('kids');
    setIntensity(1);
    setScreen('player-setup');
  };

  const renderScreen = () => {
    switch (screen) {
      case 'player-setup':
        return <PlayerSetup onStart={handleStartGame} />;
      case 'category-selection':
        return <CategorySelection onSelect={handleCategorySelect} />;
      case 'game':
        return (
          <GameScreen
            players={players}
            category={category}
            intensity={intensity}
            onTurnComplete={handleTurnComplete}
            onEndGame={handleEndGame}
          />
        );
      case 'leaderboard':
        return <Leaderboard players={players} onPlayAgain={handlePlayAgain} />;
      default:
        return <PlayerSetup onStart={handleStartGame} />;
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <div className="absolute top-6 left-6 flex items-center gap-2 text-foreground/80">
        <Icons.Logo />
        <h1 className="font-bold text-lg">Truth or Dare Showdown</h1>
      </div>
      <div
        key={screen}
        className="w-full flex items-center justify-center animate-in fade-in-0 zoom-in-95 duration-500"
      >
        {renderScreen()}
      </div>
    </main>
  );
}
