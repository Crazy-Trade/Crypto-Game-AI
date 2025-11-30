export type LanguageCode = 'en' | 'fa' | 'ru' | 'zh';

export interface GameSettings {
  projectName: string;
  ticker: string;
  founderName: string; // New field for the player's character name
  language: LanguageCode;
}

export interface GameStats {
  funds: number;       // USD value
  users: number;       // Number of holders/users
  security: number;    // 0-100% integrity
  hype: number;        // 0-100% market sentiment
  techLevel: number;   // 0-100 codebase quality
  decentralization: number; // 0-100
  era: number;         // Current game cycle/generation
}

export interface GameEvent {
  id: string;
  turn: number;
  narrative: string;
  choices?: string[];
  type: 'narrative' | 'choice' | 'alert' | 'success' | 'failure';
}

// --- Infrastructure Types ---
export type ModuleType = 'miner' | 'validator' | 'rpc' | 'firewall';

export interface InfrastructureModule {
  id: string;
  type: ModuleType;
  name: string;
  cost: number;
  maintenance: number;
  description: string;
  statsEffect: Partial<GameStats>;
}

export interface GridSlot {
  id: number;
  module: InfrastructureModule | null;
}

export interface GameState {
  isStarted: boolean;
  isLoading: boolean;
  turnCount: number;
  settings: GameSettings;
  stats: GameStats;
  history: GameEvent[];
  gameOver: boolean;
  gameWon: boolean;
  lastSaved?: string;
  infrastructure: GridSlot[]; // Array of 12 slots (3x4 grid)
}

export interface GeminiResponse {
  narrative: string;
  choices: string[];
  stats_update: {
    funds_change?: number;
    users_change?: number;
    security_change?: number;
    hype_change?: number;
    tech_level_change?: number;
    decentralization_change?: number;
  };
  event_type: 'normal' | 'crisis' | 'opportunity' | 'game_over' | 'victory';
}