import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore, computeTotalSPS } from './store';
import { STOCKS } from './data';
import type { StockRuntimeState } from './types';

import Header from './components/Header';
import ClickZone from './components/ClickZone';
import { BuildingsPanel, UpgradesPanel, LogPanel } from './components/GamePanels';
import NewsTicker from './components/NewsTicker';
import GoldenBoxer from './components/GoldenBoxer';
import GreveEvent from './components/GreveEvent';
import Toast from './components/Toast';

import SaveModal from './components/SaveModal';
import ChangelogModal from './components/ChangelogModal';
import DexModal from './components/DexModal';
import BreedModal from './components/BreedModal';
import BourseModal from './components/BourseModal';
import BattleModal from './components/BattleModal';
import RushModal from './components/RushModal';
import RhythmModal from './components/RhythmModal';
import ExploitsModal from './components/ExploitsModal';

function initStockState(): Record<string, StockRuntimeState> {
  const out: Record<string, StockRuntimeState> = {};
  for (const s of STOCKS) {
    const price = s.basePrice * (0.8 + Math.random() * 0.4);
    out[s.id] = { price, open: price, high: price, low: price, history: [{ t: Date.now(), p: price }] };
  }
  return out;
}

function tickStocks(prev: Record<string, StockRuntimeState>): Record<string, StockRuntimeState> {
  const next: Record<string, StockRuntimeState> = {};
  for (const [id, st] of Object.entries(prev)) {
    const stk = STOCKS.find((x) => x.id === id)!;
    const z = (Math.random() + Math.random() + Math.random() - 1.5) * 1.155;
    const newPrice = Math.max(stk.basePrice * 0.1, st.price * Math.exp((stk.trend * 0.0001 - 0.5 * stk.vol * stk.vol) + stk.vol * z));
    const history = [...st.history, { t: Date.now(), p: newPrice }].slice(-120);
    next[id] = { price: newPrice, open: st.open, high: Math.max(st.high, newPrice), low: Math.min(st.low, newPrice), history };
  }
  return next;
}

const GREVE_MIN = 5 * 60 * 1000;
const GREVE_MAX = 12 * 60 * 1000;
const GREVE_DURATION = 60 * 1000;

export default function App() {
  const { save, load } = useStore();
  const state = useStore((s) => s.state);

  const [showSave, setShowSave] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showDex, setShowDex] = useState(false);
  const [showBreed, setShowBreed] = useState(false);
  const [showBourse, setShowBourse] = useState(false);
  const [showBattle, setShowBattle] = useState(false);
  const [showRush, setShowRush] = useState(false);
  const [rushReady, setRushReady] = useState(false);
  const [showRhythm, setShowRhythm] = useState(false);
  const [showExploits, setShowExploits] = useState(false);

  const [greveActive, setGreveActive] = useState(false);
  const [battleNewBadge, setBattleNewBadge] = useState(false);
  const [dexNewQueue, setDexNewQueue] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastKey, setToastKey] = useState(0);
  const [logEntries, setLogEntries] = useState<{ time: string; html: string }[]>([]);
  const [offlineLabel, setOfflineLabel] = useState<string | null>(null);
  const [comboCount, setComboCount] = useState(0);
  const [stockState, setStockState] = useState<Record<string, StockRuntimeState>>(initStockState);

  const comboLastUpdateRef = useRef(0);
  const greveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const greveEndRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stockTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const battleBadgeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastKey((k) => k + 1);
  }, []);

  const addLog = useCallback((html: string) => {
    const now = new Date();
    const time = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogEntries((prev) => [{ time, html }, ...prev].slice(0, 60));
  }, []);

  const addDexNew = useCallback((id: string) => {
    setDexNewQueue((prev) => [...prev, id]);
  }, []);

  const scheduleGreve = useCallback(() => {
    if (greveTimerRef.current) clearTimeout(greveTimerRef.current);
    const delay = GREVE_MIN + Math.random() * (GREVE_MAX - GREVE_MIN);
    greveTimerRef.current = setTimeout(() => {
      setGreveActive(true);
      greveEndRef.current = setTimeout(() => {
        setGreveActive(false);
        scheduleGreve();
      }, GREVE_DURATION);
    }, delay);
  }, []);

  const resolveGreve = useCallback(() => {
    setGreveActive(false);
    if (greveEndRef.current) clearTimeout(greveEndRef.current);
    addLog('\uD83E\uDD1D <span>Accord trouv\u00e9 !</span> La gr\u00e8ve est termin\u00e9e.');
    toast('\uD83E\uDD1D Gr\u00e8ve r\u00e9solue !');
    scheduleGreve();
  }, [addLog, toast, scheduleGreve]);

  const rushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRush = useCallback((delay: number) => {
    if (rushTimerRef.current) clearTimeout(rushTimerRef.current);
    rushTimerRef.current = setTimeout(() => { setRushReady(true); }, delay);
  }, []);

  const handleOpenRush = useCallback(() => { setRushReady(false); setShowRush(true); }, []);

  const handleComboUpdate = useCallback((n: number) => {
    comboLastUpdateRef.current = Date.now();
    setComboCount(n);
  }, []);

  useEffect(() => {
    const result = load();
    if (result) {
      const { offlineEarned, offlineTime } = result;
      if (offlineEarned > 0) {
        const mins = Math.floor(offlineTime / 60);
        const label = '\uD83C\uDF19 Absent ' + mins + 'min \u2014 +' + Math.floor(offlineEarned) + ' \uD83E\uDE72';
        setOfflineLabel(label);
        addLog('\uD83C\uDF19 <span>Bienvenue !</span> ' + label);
        setTimeout(() => setOfflineLabel(null), 6000);
      }
    }
    scheduleGreve();
    scheduleRush(30_000); // First Rush available after 30s
    battleBadgeRef.current = setTimeout(() => setBattleNewBadge(true), 60000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSave(false);
        setShowChangelog(false);
        setShowDex(false);
        setShowBreed(false);
        setShowBourse(false);
        setShowBattle(false);
        setShowRush(false);
        setShowRhythm(false);
        setShowExploits(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (greveTimerRef.current) clearTimeout(greveTimerRef.current);
      if (greveEndRef.current) clearTimeout(greveEndRef.current);
      if (battleBadgeRef.current) clearTimeout(battleBadgeRef.current);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    gameLoopRef.current = setInterval(() => {
      const store = useStore.getState();
      const sps = computeTotalSPS(store.state, greveActive);
      const gain = sps / 10;
      if (gain > 0) {
        store.patchState({
          socks: store.state.socks + gain,
          totalSocks: store.state.totalSocks + gain,
          allTimeSocks: store.state.allTimeSocks + gain,
          bestSPS: Math.max(store.state.bestSPS || 0, sps),
        });
      }
      // Combo decay: reset after 2s of no clicks
      if (comboLastUpdateRef.current > 0 && Date.now() - comboLastUpdateRef.current > 2000) {
        comboLastUpdateRef.current = 0;
        setComboCount(0);
      }
    }, 100);
  }, [greveActive]);

  useEffect(() => {
    saveTimerRef.current = setInterval(() => { save(); }, 10000);
  }, [save]);

  useEffect(() => {
    stockTickRef.current = setInterval(() => { setStockState((prev) => tickStocks(prev)); }, 1000);
  }, []);

  const handleOpenBattle = () => { setShowBattle(true); setBattleNewBadge(false); };

  return (
    <div id="main-content" style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <Header
        offlineLabel={offlineLabel}
        onShare={() => {
          const { battlesWon = 0, bestRhythmGrade = '', bestRhythmScore = 0, rhythmPlays = 0, bourseProfit = 0 } = state;
          const lines = [
            `\uD83E\uDE72 J'ai produit ${(state.allTimeSocks || 0).toLocaleString('fr-FR')} cale\u00E7ons !`,
            `\u2694\uFE0F Combat\u00A0: ${battlesWon} victoire${battlesWon !== 1 ? 's' : ''}`,
            `\uD83C\uDFB5 Rythme\u00A0: ${rhythmPlays} partie${rhythmPlays !== 1 ? 's' : ''}${bestRhythmGrade ? ` \u2014 Grade\u00A0${bestRhythmGrade} (${bestRhythmScore.toLocaleString('fr-FR')}\u00A0pts)` : ''}`,
            `\uD83D\uDCC8 Bourse\u00A0: ${bourseProfit > 0 ? `${Math.floor(bourseProfit).toLocaleString('fr-FR')} \uD83E\uDE72 b\u00E9n\u00E9fices` : 'pas encore investi'}`,
            '#ManufactureDuCale\u00E7on',
          ];
          navigator.clipboard?.writeText(lines.join('\n')).then(() => toast('\uD83D\uDCCB Copi\u00E9 dans le presse-papier !'));
        }}
        onOpenSave={() => setShowSave(true)}
        onOpenBreed={() => setShowBreed(true)}
        onOpenDex={() => { setShowDex(true); setDexNewQueue([]); }}
        onOpenBourse={() => setShowBourse(true)}
        onOpenBattle={handleOpenBattle}
        onOpenRhythm={() => setShowRhythm(true)}
        onOpenExploits={() => setShowExploits(true)}
        onOpenChangelog={() => setShowChangelog(true)}
        dexNewBadge={dexNewQueue.length > 0}
        battleNewBadge={battleNewBadge}
      />
      <GreveEvent active={greveActive} onResolve={resolveGreve} />
      <main style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <ClickZone
          greveActive={greveActive}
          comboCount={comboCount}
          onComboUpdate={handleComboUpdate}
          onLog={addLog}
          onToast={toast}
          rushReady={rushReady}
          onOpenRush={handleOpenRush}
        />
        <div className="middle" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "2px solid var(--border)" }}>
          <UpgradesPanel onLog={addLog} onToast={toast} />
          <LogPanel entries={logEntries} />
        </div>
        <BuildingsPanel onLog={addLog} />
      </main>
      <NewsTicker />
      <GoldenBoxer onToast={toast} onLog={addLog} greveActive={greveActive} />
      <Toast key={toastKey} message={toastMsg} />
      {showSave && <SaveModal onClose={() => setShowSave(false)} onToast={toast} />}
      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
      {showDex && <DexModal onClose={() => setShowDex(false)} newQueue={dexNewQueue} />}
      {showBreed && <BreedModal onClose={() => setShowBreed(false)} onToast={toast} onLog={addLog} onDexNew={addDexNew} />}
      {showBourse && <BourseModal onClose={() => setShowBourse(false)} onLog={addLog} onToast={toast} stockState={stockState} />}
      {showBattle && <BattleModal onClose={() => setShowBattle(false)} onLog={addLog} onToast={toast} greveActive={greveActive} />}
      {showRush && <RushModal onClose={() => { setShowRush(false); scheduleRush(3 * 60_000 + Math.random() * 60_000); }} onLog={addLog} onToast={toast} greveActive={greveActive} />}
      {showRhythm && <RhythmModal onClose={() => setShowRhythm(false)} onLog={addLog} onToast={toast} greveActive={greveActive} />}
      {showExploits && <ExploitsModal onClose={() => setShowExploits(false)} />}
    </div>
  );
}
