import { BABY_RECIPES, BOXERS, BOXER_SECTIONS } from "../data";
import { useStore } from "../store";
import styles from "./DexModal.module.css";

interface Props {
  onClose: () => void;
  newQueue: string[];
}

export default function DexModal({ onClose, newQueue }: Props) {
  const { state } = useStore();
  const allBoxers = [...BOXERS, ...BABY_RECIPES];

  const caughtCount = state.caughtBoxers.length;
  const bredCount = (state.bredBoxers || []).length;
  const total = BOXERS.length + BABY_RECIPES.length;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dexModalTitle"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Fermer le Caleçondex"
        >
          ✕
        </button>
        <h2 id="dexModalTitle">📖 Caleçondex</h2>
        <div className={styles.subtitle}>
          Collectés : <span>{caughtCount + bredCount}</span> /{" "}
          <span>{total}</span>
        </div>

        {BOXER_SECTIONS.map((section) => {
          const sectionBoxers = BOXERS.filter(
            (b) => b.rarity === section.rarity,
          );
          if (!sectionBoxers.length) return null;
          const caughtInSection = sectionBoxers.filter((b) =>
            state.caughtBoxers.includes(b.id),
          ).length;
          return (
            <div key={section.rarity}>
              <div className={styles.sectionTitle}>
                {section.label} — {caughtInSection}/{sectionBoxers.length}
              </div>
              <div className={styles.grid}>
                {sectionBoxers.map((bx) => {
                  const isCaught = state.caughtBoxers.includes(bx.id);
                  const isNew = newQueue.includes(bx.id);
                  return (
                    <div
                      key={bx.id}
                      className={`${styles.card} ${styles[`rarity_${bx.rarity}`]} ${isCaught ? styles.caught : styles.locked}`}
                    >
                      {isNew && <span className={styles.newTag}>NEW</span>}
                      <div className={styles.icon}>
                        {isCaught ? bx.icon : "❓"}
                      </div>
                      <div className={styles.name}>
                        {isCaught ? bx.name : "???"}
                      </div>
                      <div className={styles.rarityLabel}>{section.label}</div>
                      {isCaught && (
                        <div className={styles.tooltip}>
                          <div className={styles.tooltipName}>
                            {bx.icon} {bx.name}
                          </div>
                          <div className={styles.tooltipLore}>{bx.lore}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {bredCount > 0 && (
          <div>
            <div className={styles.sectionTitle}>
              🧬 Bébés élevés — {bredCount}/{BABY_RECIPES.length}
            </div>
            <div className={styles.grid}>
              {BABY_RECIPES.map((bx) => {
                const entry = (state.bredBoxers || []).find(
                  (b) => b.id === bx.id,
                );
                const isNew = newQueue.includes(bx.id);
                const p1 = entry
                  ? allBoxers.find((b) => b.id === entry.p1)
                  : null;
                const p2 = entry
                  ? allBoxers.find((b) => b.id === entry.p2)
                  : null;
                return (
                  <div
                    key={bx.id}
                    className={`${styles.card} ${styles[`rarity_${bx.rarity}`]} ${entry ? styles.caught : styles.locked}`}
                  >
                    <span className={styles.babyTag}>🧬</span>
                    {isNew && <span className={styles.newTag}>NEW</span>}
                    <div className={styles.icon}>{entry ? bx.icon : "❓"}</div>
                    <div className={styles.name}>{entry ? bx.name : "???"}</div>
                    <div className={styles.rarityLabel}>{bx.rarity}</div>
                    {entry && (
                      <div className={styles.tooltip}>
                        <div className={styles.tooltipName}>
                          {bx.icon} {bx.name}
                        </div>
                        <div className={styles.tooltipLore}>{bx.lore}</div>
                        <div className={styles.tooltipParents}>
                          🧬 {p1 ? p1.icon + " " + p1.name : "?"} ×{" "}
                          {p2 ? p2.icon + " " + p2.name : "?"}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
