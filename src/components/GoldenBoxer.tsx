import { useEffect, useRef, useState } from 'react';
import { useStore, computeTotalSPS } from '../store';
import styles from './GoldenBoxer.module.css';

interface Props {
  onToast: (msg: string) => void;
  onLog: (html: string) => void;
  greveActive: boolean;
}

export default function GoldenBoxer({ onToast, onLog, greveActive }: Props) {
  const { state, patchState, save } = useStore();
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 20, y: 20 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lifeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sps = computeTotalSPS(state, greveActive);

  const schedule = () => {
    const delay = (30 + Math.random() * 90) * 1000;
    timerRef.current = setTimeout(() => {
      const x = 60 + Math.random() * (window.innerWidth - 120);
      const y = 80 + Math.random() * (window.innerHeight - 160);
      setPos({ x, y });
      setVisible(true);
      lifeRef.current = setTimeout(() => { setVisible(false); schedule(); }, 8000);
    }, delay);
  };

  useEffect(() => {
    schedule();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (lifeRef.current) clearTimeout(lifeRef.current);
    };
  }, []);

  const handleClick = () => {
    if (lifeRef.current) clearTimeout(lifeRef.current);
    setVisible(false);
    const reward = Math.max(1000, Math.floor(sps * 60));
    patchState({ socks: state.socks + reward, totalSocks: state.totalSocks + reward, allTimeSocks: state.allTimeSocks + reward, goldenBoxersCaught: (state.goldenBoxersCaught || 0) + 1 });
    save();
    onLog(`🩳 <span>Caleçon Doré !</span> +${reward} 🩲 ×60s production`);
    onToast(`🩳 Caleçon Doré ! +${reward} 🩲`);
    schedule();
  };

  if (!visible) return null;

  return (
    <button
      className={styles.goldenBoxer}
      style={{ left: pos.x + 'px', top: pos.y + 'px' }}
      onClick={handleClick}
      aria-label="Attraper le Caleçon Doré !"
    >
      🩳
    </button>
  );
}
