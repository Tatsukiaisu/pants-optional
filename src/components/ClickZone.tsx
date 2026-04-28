import { useEffect, useRef, useCallback } from 'react';
import { useStore, computeTotalSPS, computeClickValue, computeLuckyChance, computeLuckyMult } from '../store';
import { UPGRADES, MILESTONES, BOXERS } from '../data';
import { fmt, fmtFull } from '../utils';
import styles from './ClickZone.module.css';

interface Props {
  greveActive: boolean;
  comboCount: number;
  onComboUpdate: (n: number) => void;
  onLog: (html: string) => void;
  onToast: (msg: string) => void;
  rushReady: boolean;
  onOpenRush: () => void;
}

export default function ClickZone({ greveActive, comboCount, onComboUpdate, onLog, onToast, rushReady, onOpenRush }: Props) {
  const { state, patchState } = useStore();
  const lastClickTimeRef = useRef(0);

  const sps = computeTotalSPS(state, greveActive);
  const cv = computeClickValue(state, greveActive);
  const luckyChance = computeLuckyChance();

  // Check milestones
  const checkMilestones = useCallback(() => {
    let anyNew = false;
    MILESTONES.forEach((m) => {
      const unlocked = m.reqFn ? m.reqFn(state) : state.totalSocks >= m.req;
      if (unlocked && !state.milestonesSeen.includes(m.id)) {
        anyNew = true;
        onToast(`🏆 Étape : ${m.label} !`);
        onLog(`<span>🏆 Étape atteinte : ${m.label}</span>`);
        patchState({ milestonesSeen: [...state.milestonesSeen, m.id] });
      }
    });
    return anyNew;
  }, [state, patchState, onToast, onLog]);

  // Check boxers
  const checkBoxers = useCallback(() => {
    const newCaught: string[] = [];
    BOXERS.forEach((bx) => {
      if (state.caughtBoxers.includes(bx.id)) return;
      if (bx.req(state)) {
        newCaught.push(bx.id);
        const rarityLabel = { common:'Commun', uncommon:'Peu commun', rare:'Rare', epic:'Épique', legendary:'Légendaire', mythic:'MYTHIQUE' }[bx.rarity] || bx.rarity;
        onLog(`📖 <span>Caleçondex !</span> ${bx.icon} <strong>${bx.name}</strong> attrapé (${rarityLabel})`);
        onToast(`📖 ${bx.icon} ${bx.name} — ${rarityLabel} attrapé !`);
      }
    });
    if (newCaught.length > 0) {
      patchState({ caughtBoxers: [...state.caughtBoxers, ...newCaught] });
    }
  }, [state, patchState, onLog, onToast]);

  useEffect(() => { checkMilestones(); checkBoxers(); }, [state.totalSocks, state.buildings]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const base = cv;
    const isLucky = Math.random() < luckyChance;
    const luckyBonus = isLucky ? 7 * computeLuckyMult() : 1;
    const now = Date.now();
    const newCombo = now - lastClickTimeRef.current < 1500 ? comboCount + 1 : 0;
    lastClickTimeRef.current = now;
    onComboUpdate(newCombo);
    const comboMult = newCombo < 4 ? 1 : newCombo < 7 ? 1.5 : newCombo < 10 ? 2 : newCombo < 15 ? 3 : 4;
    const val = Math.ceil(base * luckyBonus * comboMult);

    patchState({
      socks: state.socks + val,
      totalSocks: state.totalSocks + val,
      allTimeSocks: state.allTimeSocks + val,
    });

    // Floaty
    const floaty = document.createElement('div');
    floaty.className = 'floaty' + (isLucky ? ' lucky' : '');
    const comboTag = newCombo >= 4 ? ` 🔥×${newCombo}` : '';
    floaty.textContent = (isLucky ? '🍀 ×' + 7 * computeLuckyMult() + ' ' : '') + '+' + fmt(val) + ' 🩲' + comboTag;
    floaty.style.left = e.clientX - 30 + 'px';
    floaty.style.top = e.clientY - 10 + 'px';
    document.body.appendChild(floaty);
    setTimeout(() => floaty.remove(), 900);

    if (isLucky) onLog(`🍀 <span>Clic chanceux !</span> +${fmt(val)} 🩲`);
  }, [cv, luckyChance, comboCount, state, patchState, onComboUpdate, onLog]);

  const handlePrestige = () => {
    if (state.totalSocks < 1_000_000_000) return;
    if (!confirm('Recommencer à zéro ? Vous gardez les prestiges (bonus ×1,5 permanent par prestige).')) return;
    const nextPrestige = state.prestigeCount + 1;
    const kept = { bestSPS: state.bestSPS, allTimeSocks: state.allTimeSocks, goldenBoxersCaught: state.goldenBoxersCaught };
    UPGRADES.forEach((u) => { u.bought = false; });
    patchState({ socks: 0, totalSocks: 0, buildings: {}, upgradesBought: [], prestigeCount: nextPrestige, milestonesSeen: [], caughtBoxers: [], bredBoxers: [], stockPortfolio: {}, lastSaveTime: Date.now(), ...kept });
    const gm = Math.pow(1.5, nextPrestige);
    onLog(`<span>✨ Prestige #${nextPrestige} !</span> Bonus permanent ×${gm.toFixed(1)}`);
    onToast(`✨ Prestige #${nextPrestige} ! Bonus ×${gm.toFixed(1)}`);
  };

  // Combo display
  const comboMult = comboCount < 4 ? 1 : comboCount < 7 ? 1.5 : comboCount < 10 ? 2 : comboCount < 15 ? 3 : 4;
  const comboTier = comboCount < 4 ? '' : comboCount < 7 ? styles.comboX2 : comboCount < 10 ? styles.comboX3 : comboCount < 15 ? styles.comboX4 : styles.comboMax;

  return (
    <div className={styles.clickZone} role="region" aria-label="Production">
      <div className={styles.sockCount} aria-label="Inventaire">
        <div className={styles.value} aria-live="off">{fmtFull(state.socks)}</div>
        <div className={styles.label}>caleçons</div>
        <div className={styles.sps} aria-live="off">{fmtFull(sps)}/s</div>
      </div>

      <button
        className={styles.clickBtn}
        aria-label="Coudre un caleçon"
        title="Coudre un caleçon !"
        onClick={handleClick}
      >
        🩲
      </button>

      <div className={styles.clickPower}>+{fmt(cv)} par clic</div>
      <div className={styles.luckyLabel}>🍀 {Math.round(luckyChance * 100)}% chance ×{7 * computeLuckyMult()}</div>

      {comboCount >= 4 && (
        <div className={`${styles.comboDisplay} ${comboTier}`} aria-live="polite" aria-atomic="true">
          🔥 COMBO ×{comboCount} (+×{comboMult})
        </div>
      )}

      {rushReady && (
        <button className={styles.rushBtn} onClick={onOpenRush}>
          🚀 Caleçon Rush !
        </button>
      )}

      <div className={styles.milestones} role="region" aria-label="Jalons de production">
        <h3>📍 Jalons</h3>
        {MILESTONES.map((m) => {
          const unlocked = m.reqFn ? m.reqFn(state) : state.totalSocks >= m.req;
          return (
            <div key={m.id} className={`${styles.milestone} ${unlocked ? styles.unlocked : ''}`}>
              {unlocked ? '✅ ' : '🔒 '}{m.label}
            </div>
          );
        })}
      </div>

      {state.totalSocks >= 1_000_000_000 && (
        <button className={styles.prestigeBtn} onClick={handlePrestige}>
          ✨ Prestige — Recommencer
        </button>
      )}
    </div>
  );
}
