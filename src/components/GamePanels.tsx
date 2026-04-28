import { useStore, computeBuildingCost, computeBuildingRate } from '../store';
import { BUILDINGS, UPGRADES } from '../data';
import { fmt, fmtRate } from '../utils';
import styles from './GamePanels.module.css';

interface BuildingsPanelProps {
  onLog: (html: string) => void;
}

export function BuildingsPanel({ onLog }: BuildingsPanelProps) {
  const { state, patchState, buyMode, setBuyMode } = useStore();

  const buyBuilding = (id: string) => {
    const qty = buyMode;
    const cost = computeBuildingCost(state, id, qty);
    if (state.socks < cost) return;
    const b = BUILDINGS.find((x) => x.id === id)!;
    patchState({
      socks: state.socks - cost,
      buildings: { ...state.buildings, [id]: (state.buildings[id] || 0) + qty },
    });
    onLog(`Acheté : <span>${b.icon} ${b.name}</span> ×${qty} (${(state.buildings[id] || 0) + qty} total)`);
  };

  return (
    <div className={styles.buildingsPanel} role="region" aria-label="Bâtiments">
      <div className={styles.buildingsHeader}>
        <h2 id="buildingsHeading">🏭 Bâtiments</h2>
        <div className={styles.bulkBtns} role="group" aria-label="Quantité d'achat">
          {[1, 10, 100].map((n) => (
            <button
              key={n}
              className={`${styles.bulkBtn} ${buyMode === n ? styles.active : ''}`}
              onClick={() => setBuyMode(n)}
              aria-pressed={buyMode === n}
            >×{n}</button>
          ))}
        </div>
      </div>
      <div role="list" aria-labelledby="buildingsHeading">
        {BUILDINGS.map((b) => {
          const owned = state.buildings[b.id] || 0;
          const cost = computeBuildingCost(state, b.id, buyMode);
          const affordable = state.socks >= cost;
          const rate = computeBuildingRate(state, b.id);
          const costLabel = buyMode > 1 ? `${fmt(cost)} 🩲 ×${buyMode}` : `${fmt(cost)} 🩲`;
          return (
            <div
              key={b.id}
              role="listitem"
              className={`${styles.buildingCard} ${affordable ? styles.affordable : styles.disabled}`}
              onClick={() => affordable && buyBuilding(b.id)}
              tabIndex={affordable ? 0 : undefined}
              onKeyDown={(e) => { if (affordable && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); buyBuilding(b.id); } }}
              aria-label={`${b.name}. ${b.desc} Coût : ${costLabel}. Possédé : ${owned}.`}
            >
              <div className={styles.bIcon} aria-hidden="true">{b.icon}</div>
              <div className={styles.bInfo}>
                <div className={styles.bName}>{b.name}</div>
                <div className={styles.bDesc}>{b.desc}</div>
                <div className={styles.bCost}>{costLabel}</div>
                {owned > 0 && <div className={styles.bRate}>{fmtRate(rate)}/s</div>}
              </div>
              <div className={styles.bCount} aria-hidden="true">{owned}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface UpgradesPanelProps {
  onLog: (html: string) => void;
  onToast: (msg: string) => void;
}

export function UpgradesPanel({ onLog, onToast }: UpgradesPanelProps) {
  const { state, patchState } = useStore();
  const visible = UPGRADES.filter((u) => !u.bought && u.req());

  const buyUpgrade = (id: string) => {
    const u = UPGRADES.find((x) => x.id === id)!;
    if (u.bought || state.socks < u.cost) return;
    u.bought = true;
    patchState({
      socks: state.socks - u.cost,
      upgradesBought: [...state.upgradesBought, id],
    });
    onLog(`Amélioration : <span>${u.icon} ${u.name}</span>`);
    onToast(`✨ ${u.name} — ${u.desc}`);
  };

  return (
    <div className={styles.upgradesPanel}>
      <h2>⬆️ Améliorations</h2>
      <div className={styles.upgradesGrid}>
        {visible.length === 0
          ? <span className={styles.upgEmpty}>Achetez des bâtiments pour débloquer des améliorations.</span>
          : visible.map((u) => {
              const affordable = state.socks >= u.cost;
              return (
                <button
                  key={u.id}
                  className={`${styles.upgradeBtn} ${affordable ? styles.affordable : styles.locked}`}
                  disabled={!affordable}
                  onClick={() => affordable && buyUpgrade(u.id)}
                >
                  <span className={styles.upgIcon}>{u.icon}</span>
                  <span className={styles.upgName}>{u.name}</span>
                  <span className={styles.upgDesc}>{u.desc}</span>
                  <span className={styles.upgCost}>{fmt(u.cost)} 🩲</span>
                </button>
              );
            })
        }
      </div>
    </div>
  );
}

interface LogPanelProps {
  entries: { time: string; html: string }[];
}

export function LogPanel({ entries }: LogPanelProps) {
  return (
    <div className={styles.logPanel}>
      <h2 id="logPanelHeading">📜 Journal</h2>
      <div className={styles.logEntries} role="log" aria-live="polite" aria-labelledby="logPanelHeading" aria-relevant="additions">
        {entries.map((e, i) => (
          <div key={i} className={styles.logEntry}>
            <span style={{ color: 'var(--muted)', marginRight: 6 }}>{e.time}</span>
            <span dangerouslySetInnerHTML={{ __html: e.html }} />
          </div>
        ))}
      </div>
    </div>
  );
}
