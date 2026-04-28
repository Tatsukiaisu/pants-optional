import { create } from 'zustand';
import type { GameState } from './types';
import { UPGRADES, BUILDINGS } from './data';

const SAVE_KEY = 'caleconnerie_v2';

export function defaultState(): GameState {
  return {
    socks: 0,
    totalSocks: 0,
    allTimeSocks: 0,
    buildings: {},
    upgradesBought: [],
    prestigeCount: 0,
    bestSPS: 0,
    milestonesSeen: [],
    goldenBoxersCaught: 0,
    caughtBoxers: [],
    bredBoxers: [],
    stockPortfolio: {},
    lastSaveTime: Date.now(),
    battlesWon: 0,
    bestRhythmScore: 0,
    bestRhythmGrade: '',
    rhythmPlays: 0,
    bourseProfit: 0,
  };
}

// ─── Zustand store ────────────────────────────────────────────────────────────

interface Store {
  state: GameState;
  buyMode: number;
  setBuyMode: (n: number) => void;
  setState: (updater: (s: GameState) => GameState) => void;
  patchState: (patch: Partial<GameState>) => void;
  save: () => void;
  load: () => { offlineEarned: number; offlineTime: number } | null;
  reset: () => void;
}

export const useStore = create<Store>((set, get) => ({
  state: defaultState(),
  buyMode: 1,

  setBuyMode: (n) => set({ buyMode: n }),

  setState: (updater) =>
    set((store) => ({ state: updater(store.state) })),

  patchState: (patch) =>
    set((store) => ({ state: { ...store.state, ...patch } })),

  save: () => {
    const { state } = get();
    const toSave: GameState = { ...state, lastSaveTime: Date.now() };
    localStorage.setItem(SAVE_KEY, JSON.stringify(toSave));
  },

  load: () => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    try {
      const saved = JSON.parse(raw) as Partial<GameState>;
      const merged: GameState = { ...defaultState(), ...saved };
      // Sync upgrades bought flag
      UPGRADES.forEach((u) => {
        u.bought = merged.upgradesBought.includes(u.id);
      });
      // Compute offline earnings (max 8h)
      const elapsed = Math.min((Date.now() - (merged.lastSaveTime || Date.now())) / 1000, 8 * 3600);
      let offlineEarned = 0;
      if (elapsed > 10) {
        const sps = computeTotalSPS(merged, false);
        offlineEarned = sps * elapsed;
        if (offlineEarned > 0) {
          merged.socks += offlineEarned;
          merged.totalSocks += offlineEarned;
          merged.allTimeSocks += offlineEarned;
        }
      }
      set({ state: merged });
      return elapsed > 10 && offlineEarned > 0 ? { offlineEarned, offlineTime: elapsed } : null;
    } catch (e) {
      console.warn('Save corrompue.', e);
      return null;
    }
  },

  reset: () => {
    localStorage.removeItem(SAVE_KEY);
    UPGRADES.forEach((u) => { u.bought = false; });
    set({ state: defaultState(), buyMode: 1 });
  },
}));

// ─── Exposed getter for use in data.ts req() functions ────────────────────────
export function getState(): GameState {
  return useStore.getState().state;
}

// ─── Pure computation helpers (no React dependency) ──────────────────────────

export function computeClickMult(): number {
  return UPGRADES.filter((u) => u.bought && u.clickMult).reduce((m, u) => m * (u.clickMult!), 1);
}

export function computeLuckyMult(): number {
  return UPGRADES.filter((u) => u.bought && u.luckyMult).reduce((m, u) => m * (u.luckyMult!), 1);
}

export function computeLuckyChance(): number {
  const count = UPGRADES.filter((u) => u.bought && u.luckyMult).length;
  return 0.02 + count * 0.02;
}

export function computeBuildingMult(id: string): number {
  return UPGRADES.filter((u) => u.bought && u.buildingId === id).reduce((m, u) => m * (u.buildingMult!), 1);
}

export function computeGlobalMult(state: GameState): number {
  const prestigeBonus = Math.pow(1.5, state.prestigeCount);
  return UPGRADES.filter((u) => u.bought && u.globalMult).reduce((m, u) => m * (u.globalMult!), prestigeBonus);
}

export function computeBuildingCost(state: GameState, id: string, qty = 1): number {
  const b = BUILDINGS.find((x) => x.id === id)!;
  const owned = state.buildings[id] || 0;
  let total = 0;
  for (let i = 0; i < qty; i++) total += b.baseCost * Math.pow(1.15, owned + i);
  return Math.ceil(total);
}

export function computeBuildingRate(state: GameState, id: string): number {
  const b = BUILDINGS.find((x) => x.id === id)!;
  const owned = state.buildings[id] || 0;
  return b.baseRate * owned * computeBuildingMult(id) * computeGlobalMult(state);
}

export function computeTotalSPS(state: GameState, greveActive: boolean): number {
  const base = BUILDINGS.reduce((sum, b) => sum + computeBuildingRate(state, b.id), 0);
  return greveActive ? base * 0.5 : base;
}

export function computeClickValue(state: GameState, greveActive: boolean): number {
  const sps = computeTotalSPS(state, greveActive);
  const base = Math.max(1, sps * 0.01);
  return Math.ceil(base * computeClickMult());
}
