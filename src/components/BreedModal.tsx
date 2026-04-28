import { useState } from 'react';
import { useStore } from '../store';
import { BOXERS, BABY_RECIPES, RARITY_BREED_COST } from '../data';
import { fmt } from '../utils';
import type { BabyRecipe } from '../types';
import styles from './BreedModal.module.css';

interface Props {
  onClose: () => void;
  onToast: (msg: string) => void;
  onLog: (html: string) => void;
  onDexNew: (id: string) => void;
}

export default function BreedModal({ onClose, onToast, onLog, onDexNew }: Props) {
  const { state, patchState, save } = useStore();
  const [parent1, setParent1] = useState<string | null>(null);
  const [parent2, setParent2] = useState<string | null>(null);
  const [pickerSlot, setPickerSlot] = useState<1 | 2 | null>(null);

  const allBoxers = [
    ...BOXERS.filter((b) => state.caughtBoxers.includes(b.id)),
    ...BABY_RECIPES.filter((b) => (state.bredBoxers || []).some((bb) => bb.id === b.id)),
  ];
  const allBoxerMap = [...BOXERS, ...BABY_RECIPES];

  const getResult = (): BabyRecipe | null => {
    if (!parent1 || !parent2) return null;
    const pair = [parent1, parent2].sort();
    return BABY_RECIPES.find((r) => {
      const rp = [...r.parents].sort();
      return rp[0] === pair[0] && rp[1] === pair[1];
    }) || null;
  };

  const calcCost = () => {
    if (!parent1 || !parent2) return 0;
    const bx1 = allBoxerMap.find((b) => b.id === parent1);
    const bx2 = allBoxerMap.find((b) => b.id === parent2);
    return (RARITY_BREED_COST[bx1?.rarity || 'common'] || 500) + (RARITY_BREED_COST[bx2?.rarity || 'common'] || 500);
  };

  const result = getResult();
  const cost = calcCost();
  const canAfford = state.socks >= cost;
  const alreadyBred = result ? (state.bredBoxers || []).some((bb) => bb.id === result.id) : false;

  const doBreed = () => {
    if (!parent1 || !parent2) return;
    if (state.socks < cost) { onToast('❌ Pas assez de caleçons !'); return; }

    let baby: BabyRecipe;
    if (result) {
      if (alreadyBred) { onToast('⚠️ Ce bébé existe déjà !'); return; }
      baby = result;
    } else {
      const unborn = BABY_RECIPES.filter((r) => !(state.bredBoxers || []).some((bb) => bb.id === r.id));
      if (unborn.length === 0) { onToast('🧬 Tous les bébés ont déjà été élevés !'); return; }
      baby = unborn[Math.floor(Math.random() * unborn.length)];
    }

    const newBred = [...(state.bredBoxers || []), { id: baby.id, p1: parent1, p2: parent2, date: Date.now() }];
    patchState({ socks: state.socks - cost, bredBoxers: newBred });
    onDexNew(baby.id);
    onLog(`🧬 <span>Bébé Caleçon !</span> ${baby.icon} <strong>${baby.name}</strong> est né !`);
    onToast(`🧬 ${baby.icon} ${baby.name} est né !`);
    save();
    onClose();
  };

  const getBoxer = (id: string | null) => id ? allBoxerMap.find((b) => b.id === id) : null;
  const p1bx = getBoxer(parent1);
  const p2bx = getBoxer(parent2);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="breedModalTitle" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer l'élevage">✕</button>
        <h2 id="breedModalTitle">🧬 Élevage de Caleçons</h2>
        <div className={styles.subtitle}>Accouplez deux caleçons capturés pour créer un bébé unique.</div>

        <div className={styles.parents}>
          <div className={`${styles.slot} ${parent1 ? styles.filled : ''}`} onClick={() => setPickerSlot(1)}>
            {p1bx ? <><div className={styles.slotIcon}>{p1bx.icon}</div><div className={styles.slotName}>{p1bx.name}</div></> : <div className={styles.slotEmpty}>Choisir parent 1</div>}
          </div>
          <div className={styles.plus}>×</div>
          <div className={`${styles.slot} ${parent2 ? styles.filled : ''}`} onClick={() => setPickerSlot(2)}>
            {p2bx ? <><div className={styles.slotIcon}>{p2bx.icon}</div><div className={styles.slotName}>{p2bx.name}</div></> : <div className={styles.slotEmpty}>Choisir parent 2</div>}
          </div>
        </div>

        <div className={styles.result}>
          {parent1 && parent2 ? (
            result ? (
              <><div className={styles.resultIcon}>{alreadyBred ? result.icon : '🥚'}</div>
              <div className={styles.resultLabel} style={{ color: alreadyBred ? 'var(--muted)' : 'var(--accent2)' }}>
                {alreadyBred ? `${result.icon} ${result.name} — déjà élevé` : '✨ Combinaison connue — résultat garanti !'}
              </div></>
            ) : (
              <><div className={styles.resultIcon}>❓</div><div className={styles.resultLabel}>Combinaison inconnue — résultat surprise !</div></>
            )
          ) : (
            <><div className={styles.resultIcon}>🥚</div><div className={styles.resultLabel}>Sélectionnez deux parents</div></>
          )}
        </div>

        {parent1 && parent2 && <div className={styles.cost} style={{ color: canAfford ? 'var(--accent2)' : 'var(--accent)' }}>Coût : {fmt(cost)} 🩲</div>}

        <div className={styles.actions}>
          <button className={`${styles.btn} ${styles.secondary}`} onClick={onClose}>Fermer</button>
          <button className={`${styles.btn} ${styles.primary}`} onClick={doBreed} disabled={!parent1 || !parent2 || !canAfford || alreadyBred}>
            🧬 Accoupler !
          </button>
        </div>

        {(state.bredBoxers || []).length > 0 && (
          <div className={styles.genealogy}>
            <div className={styles.genealogyTitle}>🧬 Bébés élevés</div>
            <div className={styles.genealogyGrid}>
              {(state.bredBoxers || []).map((entry) => {
                const bx = BABY_RECIPES.find((b) => b.id === entry.id);
                if (!bx) return null;
                return (
                  <div key={entry.id} className={styles.genealogyCard}>
                    <span className={styles.babyTag}>🧬</span>
                    <div>{bx.icon}</div>
                    <div className={styles.genealogyName}>{bx.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {pickerSlot && (
          <div className={styles.pickerOverlay}>
            <div className={styles.pickerTitle}>Choisir parent {pickerSlot}</div>
            <div className={styles.pickerGrid}>
              {allBoxers.map((bx) => {
                const otherParent = pickerSlot === 1 ? parent2 : parent1;
                const isSelf = bx.id === otherParent;
                return (
                  <div key={bx.id} className={`${styles.pickerCard} ${isSelf ? styles.alreadySelected : ''}`}
                    onClick={() => { if (isSelf) return; if (pickerSlot === 1) setParent1(bx.id); else setParent2(bx.id); setPickerSlot(null); }}>
                    <div>{bx.icon}</div>
                    <div className={styles.pickerName}>{bx.name}</div>
                  </div>
                );
              })}
              {allBoxers.length === 0 && <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Aucun caleçon capturé.</div>}
            </div>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button className={`${styles.btn} ${styles.secondary}`} onClick={() => setPickerSlot(null)}>Annuler</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
