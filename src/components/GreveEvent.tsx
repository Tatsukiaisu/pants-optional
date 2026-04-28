
import { useEffect, useRef, useState } from 'react';
import { useStore, computeTotalSPS } from '../store';
import { fmt } from '../utils';
import styles from './GreveEvent.module.css';

interface Props {
  active: boolean;
  onResolve: () => void;
}

export default function GreveEvent({ active, onResolve }: Props) {
  const { state, patchState } = useStore();
  const sps = computeTotalSPS(state, false);
  const cost = Math.ceil(Math.max(100, sps * 30));
  const [timeLeft, setTimeLeft] = useState(60);
  const [hidden, setHidden] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) {
      setTimeLeft(60);
      setHidden(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    setTimeLeft(60);
    setHidden(false);
    let t = 60;
    intervalRef.current = setInterval(() => {
      t--;
      setTimeLeft(t);
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [active]);

  const handlePay = () => {
    if (state.socks < cost) return;
    patchState({ socks: state.socks - cost });
    onResolve();
  };

  if (!active || hidden) return null;

  return (
    <div className={styles.banner} role="alertdialog" aria-modal="false" aria-labelledby="greveBannerTitle" aria-describedby="greveDesc">
      <div className={styles.greveTitle} id="greveBannerTitle">⚠️ GRÈVE OUVRIÈRE !</div>
      <div className={styles.greveDesc} id="greveDesc">
        Les ouvriers font grève ! Production réduite de <strong>50%</strong> jusqu'à résolution.
      </div>
      <div className={styles.greveBtns}>
        <button
          className={styles.grevePayBtn}
          onClick={handlePay}
          disabled={state.socks < cost}
        >
          💰 Payer ({fmt(cost)} 🩲)
        </button>
        <button className={styles.greveWaitBtn} onClick={() => setHidden(true)}>
          ✖ Masquer
        </button>
      </div>
      <div className={styles.greveCountdown}>Résolution automatique dans {timeLeft}s</div>
    </div>
  );
}
