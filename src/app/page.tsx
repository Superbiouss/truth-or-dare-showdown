"use client";

import { useGame } from "@/hooks/use-game";
import { WelcomeScreen } from "@/components/welcome-screen";
import { PlayerSetup } from "@/components/player-setup";
import { CategorySelection } from "@/components/category-selection";
import { GameScreen } from "@/components/game-screen";
import { Leaderboard } from "@/components/leaderboard";
import { GameHistory } from "@/components/game-history";
import { Icons } from "@/components/icons";

export default function Home() {
  const {
    screen,
    players,
    category,
    intensity,
    rounds,
    currentRound,
    currentPlayer,
    isTtsEnabled,
    gameHistory,
    handleGetStarted,
    handleStartGame,
    handleCategorySelect,
    handleTurnComplete,
    handleEndGame,
    handlePlayAgain,
    handleShowHistory,
    handleBackToSetup,
    handleBackToWelcome,
    setIsTtsEnabled,
  } = useGame();

  const renderScreen = () => {
    switch (screen) {
      case 'welcome':
        return <WelcomeScreen onGetStarted={handleGetStarted} onShowHistory={handleShowHistory} history={gameHistory} />;
      case 'player-setup':
        return <PlayerSetup onStart={handleStartGame} />;
      case 'category-selection':
        return <CategorySelection onSelect={handleCategorySelect} onBack={handleBackToSetup} />;
      case 'game':
        return (
          <GameScreen
            players={players}
            currentPlayer={currentPlayer!}
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
        return <GameHistory history={gameHistory} onBack={handleBackToWelcome} />;
      default:
        return <WelcomeScreen onGetStarted={handleGetStarted} onShowHistory={handleShowHistory} history={gameHistory} />;
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <header className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex justify-start items-center w-full">
        <div className="flex items-center gap-2 text-foreground/80">
          <Icons.Logo />
          <h1 className="font-bold text-lg hidden sm:block">Truth or Dare Showdown</h1>
        </div>
      </header>
      <div
        key={screen}
        className="w-full flex items-center justify-center animate-in fade-in-0 zoom-in-95 duration-500"
      >
        {renderScreen()}
      </div>
    </main>
  );
}
