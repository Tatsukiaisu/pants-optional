import { useStore, computeGlobalMult } from '../store';
import { fmt, fmtRate } from '../utils';
import styles from './Header.module.css';

interface Props {
  offlineLabel: string | null;
  onShare: () => void;
  onOpenSave: () => void;
  onOpenBreed: () => void;
  onOpenDex: () => void;
  onOpenBourse: () => void;
  onOpenBattle: () => void;
  onOpenRhythm: () => void;
  onOpenExploits: () => void;
  onOpenChangelog: () => void;
  dexNewBadge: boolean;
  battleNewBadge: boolean;
}

export default function Header({
  offlineLabel, onShare, onOpenSave, onOpenBreed, onOpenDex,
  onOpenBourse, onOpenBattle, onOpenRhythm, onOpenExploits, onOpenChangelog, dexNewBadge, battleNewBadge
}: Props) {
  const { state } = useStore();
  const globalMult = computeGlobalMult(state);

  return (
    <header className={styles.header} role="banner">
      <h1>
        🩲 Manufacture du Caleçon
        {state.prestigeCount > 0 && (
          <span className="prestige-badge">✨ P{state.prestigeCount} ×{globalMult.toFixed(1)}</span>
        )}
        <button className={styles.versionBadge} onClick={onOpenChangelog} aria-label="Ouvrir le journal des modifications v1.6.0">
          v1.6.0
        </button>
      </h1>
      <nav role="navigation" aria-label="Actions du jeu" className={styles.nav}>
        <div className={styles.stats} aria-label="Statistiques" role="status">
          Total : <span>{fmt(state.allTimeSocks || state.totalSocks)}</span> &nbsp;|&nbsp;
          Record : <span>{fmtRate(state.bestSPS)}</span>/s &nbsp;|&nbsp;
          Hors-ligne: <span style={{ color: 'var(--green)' }}>{offlineLabel || '—'}</span>
        </div>
        <button className={styles.shareBtn} onClick={onShare}>📋 Partager score</button>
        <button className={styles.shareBtn} onClick={onOpenSave}>💾 Sauvegarde</button>
        <button className={styles.shareBtn} onClick={onOpenBreed}>🧬 Élevage</button>
        <button className={styles.dexBtn} onClick={onOpenDex} aria-haspopup="dialog">
          📖 Caleçondex{dexNewBadge && <span className={styles.badge} aria-hidden="true">NEW</span>}
        </button>
        <button className={styles.dexBtn} onClick={onOpenBourse} aria-haspopup="dialog">📈 Bourse</button>
        <button className={styles.dexBtn} onClick={onOpenBattle} aria-haspopup="dialog">
          ⚔️ Combat{battleNewBadge && <span className={styles.badge} aria-hidden="true">!</span>}
        </button>
        <button className={styles.dexBtn} onClick={onOpenRhythm} aria-haspopup="dialog">🎵 Rythme</button>
        <button className={styles.dexBtn} onClick={onOpenExploits} aria-haspopup="dialog">🎖️ Exploits</button>
      </nav>
    </header>
  );
}
