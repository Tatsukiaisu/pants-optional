import { useState } from 'react';
import { useStore } from '../store';
import { fmt } from '../utils';
import styles from './SaveModal.module.css';

interface Props {
  onClose: () => void;
  onToast: (msg: string) => void;
}

export default function SaveModal({ onClose, onToast }: Props) {
  const { reset } = useStore();
  const [exportText, setExportText] = useState('');
  const [importText, setImportText] = useState('');

  const doExport = () => {
    const { save } = useStore.getState();
    save();
    const raw = localStorage.getItem('caleconnerie_v2') || '{}';
    setExportText(JSON.stringify(JSON.parse(raw), null, 2));
  };

  const copyExport = () => {
    if (!exportText) { onToast("⚠️ Cliquez sur Exporter d'abord !"); return; }
    navigator.clipboard?.writeText(exportText).then(() => onToast('📋 Sauvegarde copiée !'));
  };

  const doImport = () => {
    const text = importText.trim();
    if (!text) { onToast('⚠️ Collez une sauvegarde JSON à importer.'); return; }
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed.socks !== 'number' && typeof parsed.totalSocks !== 'number') throw new Error('Format invalide');
      localStorage.setItem('caleconnerie_v2', JSON.stringify(parsed));
      onToast('✅ Sauvegarde importée — rechargement…');
      onClose();
      setTimeout(() => window.location.reload(), 1000);
    } catch (e: unknown) {
      onToast('❌ JSON invalide : ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const doReset = () => {
    if (!confirm('Effacer toute la progression ? Cette action est irréversible.')) return;
    reset();
    window.location.reload();
  };

  const cheatAdd = (amount: number) => {
    const { patchState } = useStore.getState();
    const s = useStore.getState().state;
    patchState({ socks: s.socks + amount, totalSocks: s.totalSocks + amount, allTimeSocks: s.allTimeSocks + amount });
    useStore.getState().save();
    onToast(`🛠️ +${fmt(amount)} caleçons ajoutés !`);
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="saveModalTitle" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer la sauvegarde">✕</button>
        <h2 id="saveModalTitle">💾 Sauvegarde</h2>

        <div className={styles.section}>
          <h3>📤 Exporter</h3>
          <textarea className={styles.textarea} value={exportText} readOnly placeholder="Cliquez sur Exporter…" />
          <div className={styles.row}>
            <button className={`${styles.btn} ${styles.primary}`} onClick={doExport}>Exporter la sauvegarde</button>
            <button className={`${styles.btn} ${styles.secondary}`} onClick={copyExport}>Copier</button>
          </div>
        </div>

        <div className={styles.section}>
          <h3>📥 Importer</h3>
          <textarea className={styles.textarea} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Collez votre sauvegarde JSON ici…" />
          <div className={styles.row}>
            <button className={`${styles.btn} ${styles.primary}`} onClick={doImport}>Importer &amp; charger</button>
          </div>
          <div className={styles.note}>⚠️ L'import écrase la partie en cours. Exportez d'abord si nécessaire.</div>
        </div>

        <div className={styles.section}>
          <h3>🗑️ Réinitialiser</h3>
          <div className={styles.row}>
            <button className={`${styles.btn} ${styles.danger}`} onClick={doReset}>Effacer toute la progression</button>
          </div>
        </div>

        <div className={styles.devSection}>
          <h3 style={{ color: 'var(--muted)' }}>🛠️ Développeur</h3>
          <div className={styles.row} style={{ marginTop: 8 }}>
            <button className={`${styles.btn} ${styles.secondary}`} onClick={() => cheatAdd(1e6)}>+1 Million 🩲</button>
            <button className={`${styles.btn} ${styles.secondary}`} onClick={() => cheatAdd(1e9)}>+1 Milliard 🩲</button>
            <button className={`${styles.btn} ${styles.secondary}`} onClick={() => cheatAdd(1e12)}>+1 Trillion 🩲</button>
          </div>
        </div>
      </div>
    </div>
  );
}
