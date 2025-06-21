"use client";

import { useState, useEffect, useCallback } from "react";
import type { Player, GameCategory, Screen, GameResult } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const GAME_STATE_KEY = 'truthOrDareGameState';
const HISTORY_KEY = 'truthOrDareGameHistory';

type GameState = {
  screen: Screen;
  players: Player[];
  category: GameCategory;
  intensity: number;
  rounds: number;
  currentRound: number;
  currentPlayerIndex: number;
  isTtsEnabled: boolean;
  isSuddenDeath: boolean;
};

export function useGame() {
  const [screen, setScreen] = useState<Screen>('player-setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [category, setCategory] = useState<GameCategory>('kids');
  const [intensity, setIntensity] = useState(1);
  const [rounds, setRounds] = useState(5);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const [isSuddenDeath, setIsSuddenDeath] = useState(false);
  const { toast } = useToast();

  const currentPlayer = players[currentPlayerIndex];

  // Load state from localStorage on initial mount
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      if (storedHistory) {
        setGameHistory(JSON.parse(storedHistory));
      }

      const storedGameState = localStorage.getItem(GAME_STATE_KEY);
      if (storedGameState) {
        const savedState: GameState = JSON.parse(storedGameState);
        if (savedState.screen === 'game') {
            setScreen(savedState.screen);
            setPlayers(savedState.players);
            setCategory(savedState.category);
            setIntensity(savedState.intensity);
            setRounds(savedState.rounds);
            setCurrentRound(savedState.currentRound);
            setCurrentPlayerIndex(savedState.currentPlayerIndex);
            setIsTtsEnabled(savedState.isTtsEnabled);
            setIsSuddenDeath(savedState.isSuddenDeath);
            toast({
                title: "Game Resumed",
                description: "We've picked up where you left off!",
            })
        }
      }
    } catch (error) {
      console.error("Failed to parse state from localStorage", error);
    }
  }, [toast]);

  // Save game state to localStorage whenever it changes
  useEffect(() => {
    if (screen === 'game' && players.length > 0) {
      const gameState: GameState = {
        screen,
        players,
        category,
        intensity,
        rounds,
        currentRound,
        currentPlayerIndex,
        isTtsEnabled,
        isSuddenDeath,
      };
      localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
    }
  }, [screen, players, category, intensity, rounds, currentRound, currentPlayerIndex, isTtsEnabled, isSuddenDeath]);

  const clearGameState = useCallback(() => {
    localStorage.removeItem(GAME_STATE_KEY);
  }, []);

  const handleStartGame = useCallback((newPlayers: Player[]) => {
    setPlayers(newPlayers.map(p => ({ ...p, score: 0 }))); // Reset scores
    setScreen('category-selection');
  }, []);

  const handleCategorySelect = useCallback((selectedCategory: GameCategory, selectedIntensity: number, selectedRounds: number, ttsEnabled: boolean) => {
    setCategory(selectedCategory);
    setIntensity(selectedIntensity);
    setRounds(selectedRounds);
    setIsTtsEnabled(ttsEnabled);
    setCurrentRound(1);
    setCurrentPlayerIndex(0);
    setScreen('game');
  }, []);

  const handleEndGame = useCallback((finalPlayers: Player[] = players) => {
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
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
        console.error("Failed to save game history to localStorage", error);
    }
    clearGameState();
    setScreen('leaderboard');
  }, [players, gameHistory, clearGameState]);

  const handleTurnComplete = useCallback((points: number) => {
    const currentPlayerId = players[currentPlayerIndex].id;
    const updatedPlayers = players.map(p =>
      p.id === currentPlayerId ? { ...p, score: p.score + points } : p
    );
    setPlayers(updatedPlayers);

    const isRoundOver = (currentPlayerIndex + 1) >= players.length;

    if (isRoundOver) {
      const isFinalRound = currentRound >= rounds;
      if (isFinalRound) {
        const sortedPlayers = [...updatedPlayers].sort((a, b) => b.score - a.score);
        const topScore = sortedPlayers[0].score;
        const potentialWinners = sortedPlayers.filter(p => p.score === topScore && p.score > 0);

        if (potentialWinners.length > 1) {
          const tiedPlayerNames = potentialWinners.map(p => p.name).join(' and ');
          toast({
            title: "Sudden Death!",
            description: `A tie between ${tiedPlayerNames}! One more round to decide the champion.`,
          });
          
          setPlayers(potentialWinners);
          setRounds(prev => prev + 1);
          setCurrentRound(prev => prev + 1);
          setCurrentPlayerIndex(0);
          setIsSuddenDeath(true);
        } else {
          handleEndGame(updatedPlayers);
        }
      } else {
        setCurrentRound(prev => prev + 1);
        setCurrentPlayerIndex(0);
      }
    } else {
      setCurrentPlayerIndex(prevIndex => prevIndex + 1);
    }
  }, [players, currentPlayerIndex, currentRound, rounds, handleEndGame, toast]);

  const handlePlayAgain = useCallback(() => {
    clearGameState();
    setPlayers([]);
    setCategory('kids');
    setIntensity(1);
    setRounds(5);
    setCurrentRound(1);
    setCurrentPlayerIndex(0);
    setIsSuddenDeath(false);
    setScreen('player-setup');
  }, [clearGameState]);
  
  const handleShowHistory = useCallback(() => {
    setScreen('history');
  }, []);

  const handleBackToSetup = useCallback(() => {
    setScreen('player-setup');
  }, []);

  return {
    screen,
    players,
    category,
    intensity,
    rounds,
    currentRound,
    currentPlayer,
    isTtsEnabled,
    gameHistory,
    isSuddenDeath,
    handleStartGame,
    handleCategorySelect,
    handleTurnComplete,
    handleEndGame,
    handlePlayAgain,
    handleShowHistory,
    handleBackToSetup,
    setIsTtsEnabled,
  };
}
