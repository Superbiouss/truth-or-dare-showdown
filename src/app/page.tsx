"use client";

import { useState, useEffect } from "react";
import type { Player, GameCategory, Screen, GameResult } from "@/lib/types";
import { PlayerSetup } from "@/components/player-setup";
import { CategorySelection } from "@/components/category-selection";
import { GameScreen } from "@/components/game-screen";
import { Leaderboard } from "@/components/leaderboard";
import { GameHistory } from "@/components/game-history";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [screen, setScreen] = useState<Screen>('player-setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [category, setCategory] = useState<GameCategory>('kids');
  const [intensity, setIntensity] = useState(1);
  const [rounds, setRounds] = useState(5);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('gameHistory');
      if (storedHistory) {
        setGameHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to parse game history from localStorage", error);
      setGameHistory([]);
    }
  }, []);

  const handleStartGame = (newPlayers: Player[]) => {
    setPlayers(newPlayers);
    setScreen('category-selection');
  };

  const handleCategorySelect = (selectedCategory: GameCategory, selectedIntensity: number, selectedRounds: number, ttsEnabled: boolean) => {
    setCategory(selectedCategory);
    setIntensity(selectedIntensity);
    setRounds(selectedRounds);
    setIsTtsEnabled(ttsEnabled);
    setCurrentRound(1);
    setCurrentPlayerIndex(0);
    setScreen('game');
  };

  const handleTurnComplete = (points: number) => {
    const currentPlayerId = players[currentPlayerIndex].id;
    const updatedPlayers = players.map(p =>
      p.id === currentPlayerId ? { ...p, score: p.score + points } : p
    );
    setPlayers(updatedPlayers);

    const nextPlayerIndex = (currentPlayerIndex + 1);
    if (nextPlayerIndex >= players.length) { // Last player just finished their turn
        if (currentRound >= rounds) {
            const sortedPlayers = [...updatedPlayers].sort((a, b) => b.score - a.score);
            const isTie = sortedPlayers.length > 1 && sortedPlayers[0].score > 0 && sortedPlayers[0].score === sortedPlayers[1].score;

            if (isTie) {
                toast({
                    title: "It's a Tie!",
                    description: "3 tie-breaker rounds have been added to determine the winner.",
                });
                setRounds(prev => prev + 3);
                setCurrentRound(prev => prev + 1);
                setCurrentPlayerIndex(0);
            } else {
                handleEndGame(updatedPlayers);
            }
        } else {
            setCurrentRound(prev => prev + 1);
            setCurrentPlayerIndex(0);
        }
    } else {
        setCurrentPlayerIndex(nextPlayerIndex);
    }
  };

  const handleEndGame = (finalPlayers: Player[] = players) => {
    const sortedPlayers = [...finalPlayers].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];
    const newGameResult: GameResult = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      players: finalPlayers.map(({ name, score, avatar }) => ({ name, score, avatar })),
      winnerName: winner && winner.score > 0 ? winner.name : "No one",
    };

    const updatedHistory = [newGameResult, ...gameHistory].slice(0, 20); // Keep last 20 games
    setGameHistory(updatedHistory);
    try {
        localStorage.setItem('gameHistory', JSON.stringify(updatedHistory));
    } catch (error) {
        console.error("Failed to save game history to localStorage", error);
    }
    setScreen('leaderboard');
  };

  const handlePlayAgain = () => {
    setPlayers([]);
    setCategory('kids');
    setIntensity(1);
    setRounds(5);
    setCurrentRound(1);
    setCurrentPlayerIndex(0);
    setScreen('player-setup');
  };
  
  const handleShowHistory = () => {
    setScreen('history');
  };

  const handleBackToSetup = () => {
    setScreen('player-setup');
  };

  const renderScreen = () => {
    switch (screen) {
      case 'player-setup':
        return <PlayerSetup onStart={handleStartGame} onShowHistory={handleShowHistory} />;
      case 'category-selection':
        return <CategorySelection onSelect={handleCategorySelect} />;
      case 'game':
        return (
          <GameScreen
            players={players}
            currentPlayer={players[currentPlayerIndex]}
            category={category}
            intensity={intensity}
            onTurnComplete={handleTurnComplete}
            onEndGame={() => handleEndGame()}
            rounds={rounds}
            currentRound={currentRound}
            isTtsEnabled={isTtsEnabled}
            setIsTtsEnabled={setIsTtsEnabled}
          />
        );
      case 'leaderboard':
        return <Leaderboard players={players} onPlayAgain={handlePlayAgain} />;
      case 'history':
        return <GameHistory history={gameHistory} onBack={handleBackToSetup} />;
      default:
        return <PlayerSetup onStart={handleStartGame} onShowHistory={handleShowHistory} />;
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
