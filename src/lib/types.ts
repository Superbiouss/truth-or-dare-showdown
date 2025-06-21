export type Player = {
  id: number;
  name: string;
  score: number;
};

export type GameCategory = 'kids' | 'teens' | '18+';

export type Screen = 'player-setup' | 'category-selection' | 'game' | 'leaderboard';

export type Prompt = {
  type: 'truth' | 'dare';
  text: string;
};
