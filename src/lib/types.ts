export type Player = {
  id: number;
  name: string;
  score: number;
  gender: 'male' | 'female';
  avatar: string;
};

export type GameCategory = 'kids' | 'teens' | '18+';

export type Screen = 'player-setup' | 'category-selection' | 'game' | 'leaderboard' | 'history';

export type Prompt = {
  type: 'truth' | 'dare' | 'wildcard';
  text: string;
  points: number;
  timerInSeconds?: number;
};

export type GameResult = {
  id: number;
  date: string;
  players: Pick<Player, 'name' | 'score' | 'avatar'>[];
  winnerName: string;
};
