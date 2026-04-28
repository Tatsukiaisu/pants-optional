import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore, computeTotalSPS } from '../store';
import { fmt } from '../utils';
import styles from './RushModal.module.css';

interface Props {
  onClose: () => void;
  onLog: (html: string) => void;
  onToast: (msg: string) => void;
  greveActive: boolean;
}

const DURATION = 15;
const N_TARGETS = 18;

interface Target {
  id: number;
  x: number;
  y: number;
  caught: boolean;
  golden: boolean;
}

export default function RushModal({ onClose, onLog, onToast, greveActive }: Props) {
  const { state, patchState, save } = useStore();
  const sps = computeTotalSPS(state, greveActive);
  const [phase, setPhase] = useState<'play' | 'result'>('play');
  const [targets, setTargets] = useState<Target[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [resultText, setResultText] = useState('');
  const nextId = useRef(0);
  const catchedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRef = useRef(true);

  const spawnTargets = useCallback(() => {
    const ts: Target[] = Array.from({ length: N_TARGETS }, (_, i) => ({
      id: nextId.current++,
      x: 3 + Math.random() * 87,
      y: 3 + Math.random() * 82,
      caught: false,
      golden: i === 0,
    }));
    setTargets(ts);
  }, []);

  const respawnTarget = (id: number) => {
    setTargets((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, caught: false, x: 3 + Math.random() * 87, y: 3 + Math.random() * 82 }
          : t
      )
    );
  };

  const endRush = useCallback((finalScore: number) => {
    if (!activeRef.current) return;
    activeRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    const b = Math.floor(Math.max(500, finalScore * Math.max(50, sps * 3)));
    patchState({
      socks: state.socks + b,
      totalSocks: state.totalSocks + b,
      allTimeSocks: state.allTimeSocks + b,
    });
    save();
    const grade =
      finalScore >= 30 ? '🏆 Légendaire !' :
      finalScore >= 20 ? '⭐ Excellent !' :
      finalScore >= 10 ? '👍 Bien joué !' : '🙂 Pas mal…';
    setResultText(`${grade}\n${finalScore} caleçons attrapés\nBonus : +${fmt(b)} 🩲`);
    setPhase('result');
    onLog(`🚀 <span>Caleçon Rush !</span> ${finalScore} attrapés — +${fmt(b)} 🩲`);
    onToast(`🚀 Rush terminé ! +${fmt(b)} 🩲`);
  }, [sps, state, patchState, save, onLog, onToast]);

  useEffect(() => {
    spawnTargets();
    let t = DURATION;
    timerRef.current = setInterval(() => {
      t--;
      setTimeLeft(t);
      if (t <= 0) {
        endRush(catchedRef.current);
      }
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const catchTarget = (id: number, golden: boolean) => {
    if (phase !== 'play') return;
    const worth = golden ? 5 : 1;
    catchedRef.current += worth;
    setScore((s) => s + worth);
    setTargets((prev) => prev.map((t) => t.id === id ? { ...t, caught: true } : t));
    setTimeout(() => respawnTarget(id), 380);
  };

  const timerPct = (timeLeft / DURATION) * 100;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="rushModalTitle">
      <div className={styles.modal}>
        <h2 id="rushModalTitle" className={styles.title}>🚀 Caleçon Rush !</h2>
        <div className={styles.timerBar}>
          <div className={styles.timerFill} style={{ width: timerPct + '%' }} />
        </div>
        <div className={styles.info}>
          Attrapez un maximum de caleçons en <strong style={{ color: 'var(--accent2)' }}>{timeLeft}s</strong> !
        </div>
        <div className={styles.area}>
          {targets.map((t) => (
            <div
              key={t.id}
              className={`${styles.target} ${t.golden ? styles.golden : ''} ${t.caught ? styles.caught : ''}`}
              style={{ left: t.x + '%', top: t.y + '%' }}
              onClick={() => !t.caught && catchTarget(t.id, t.golden)}
            >
              🩲
            </div>
          ))}
        </div>
        <div className={styles.caught}>{score} attrapés</div>
        {phase === 'result' && (
          <div className={styles.resultPanel}>
            <div style={{ fontSize: '2.2rem' }}>🎉</div>
            <div className={styles.resultText}>
              {resultText.split('\n').map((line, i) => <div key={i}>{line}</div>)}
            </div>
            <button className={styles.resultBtn} onClick={onClose}>Fermer</button>
          </div>
        )}
      </div>
    </div>
  );
}
