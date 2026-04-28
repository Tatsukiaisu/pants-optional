// ─── Core game types ──────────────────────────────────────────────────────────

export interface GameState {
  socks: number;
  totalSocks: number;
  allTimeSocks: number;
  buildings: Record<string, number>;
  upgradesBought: string[];
  prestigeCount: number;
  bestSPS: number;
  milestonesSeen: string[];
  goldenBoxersCaught: number;
  caughtBoxers: string[];
  bredBoxers: BreedEntry[];
  stockPortfolio: Record<string, StockPosition>;
  lastSaveTime: number;
  // ── Minigame stats ────────────────────────────────────────────────────────
  battlesWon: number;
  bestRhythmScore: number;
  bestRhythmGrade: string;
  rhythmPlays: number;
  bourseProfit: number;
}

export interface Building {
  id: string;
  name: string;
  icon: string;
  desc: string;
  baseCost: number;
  baseRate: number;
}

export interface Upgrade {
  id: string;
  name: string;
  icon: string;
  desc: string;
  cost: number;
  clickMult?: number;
  buildingId?: string;
  buildingMult?: number;
  globalMult?: number;
  luckyMult?: number;
  req: () => boolean;
  bought?: boolean;
}

export interface Milestone {
  id: string;
  label: string;
  req: number;
  reqFn?: (s: GameState) => boolean;
}

export interface Boxer {
  id: string;
  name: string;
  icon: string;
  rarity: Rarity;
  lore: string;
  req: (s: GameState) => boolean;
}

export interface BabyRecipe {
  id: string;
  parents: [string, string];
  name: string;
  icon: string;
  rarity: Rarity;
  lore: string;
}

export interface BreedEntry {
  id: string;
  p1: string;
  p2: string;
  date: number;
}

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface BoxerSection {
  label: string;
  rarity: Rarity;
}

// ─── Stock market ──────────────────────────────────────────────────────────────

export interface Stock {
  id: string;
  name: string;
  icon: string;
  ticker: string;
  basePrice: number;
  vol: number;
  trend: number;
  desc: string;
}

export interface StockRuntimeState {
  price: number;
  history: { t: number; p: number }[];
  open: number;
  high: number;
  low: number;
}

export interface StockPosition {
  qty: number;
  avgCost: number;
}

// ─── Battle ────────────────────────────────────────────────────────────────────

export interface Enemy {
  name: string;
  icon: string;
  level: number;
  hp: number;
  atk: number;
  def: number;
  color: number;
  reward: number;
}

export interface PlayerMove {
  name: string;
  icon: string;
  type: 'physical' | 'special' | 'status';
  baseDmg: number;
  acc: number;
  desc: string;
  statFn: ((bs: BattleState) => string) | null;
}

export interface EnemyMove {
  name: string;
  type: string;
  baseDmg: number;
}

export interface BattleState {
  enemy: Enemy;
  playerHp: number;
  playerMaxHp: number;
  enemyHp: number;
  enemyMaxHp: number;
  playerDef: number;
  enemyDef: number;
  playerLv: number;
  turn: 'player' | 'enemy' | 'anim';
  over: boolean;
}
