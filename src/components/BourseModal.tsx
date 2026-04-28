import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { STOCKS } from '../data';
import type { StockRuntimeState } from '../types';
import { fmt, fmtPrice } from '../utils';
import styles from './BourseModal.module.css';

interface Props {
  onClose: () => void;
  onLog: (html: string) => void;
  onToast: (msg: string) => void;
  stockState: Record<string, StockRuntimeState>;
}

export default function BourseModal({ onClose, onLog, onToast, stockState }: Props) {
  const { state, patchState, save } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const sparklineRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  const pf = state.stockPortfolio || {};

  const portfolioTotal = Object.entries(pf).reduce((sum, [id, pos]) => {
    const st = stockState[id];
    return sum + (st ? pos.qty * st.price : 0);
  }, 0);

  const selectedStock = selectedId ? STOCKS.find((s) => s.id === selectedId) : null;
  const selectedSt = selectedId ? stockState[selectedId] : null;

  const tradeCost = selectedSt ? qty * selectedSt.price : 0;
  const heldQty = selectedId && pf[selectedId] ? pf[selectedId].qty : 0;
  const canBuy = qty > 0 && tradeCost <= state.socks;
  const canSell = qty > 0 && qty <= heldQty;

  const changeClass = (pct: number) => pct > 0.001 ? styles.up : pct < -0.001 ? styles.down : styles.flat;

  const drawChart = () => {
    if (!chartRef.current || !selectedSt || selectedSt.history.length < 2) return;
    const canvas = chartRef.current;
    const W = canvas.offsetWidth || 760;
    const H = 160;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    const prices = selectedSt.history.map((h) => h.p);
    const mn = Math.min(...prices), mx = Math.max(...prices);
    const range = mx - mn || 1;
    const pad = { t: 18, b: 24, l: 14, r: 14 };
    const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
    const pct = (selectedSt.price - selectedSt.open) / selectedSt.open;
    const color = pct > 0.001 ? '#4caf50' : pct < -0.001 ? '#ef5350' : '#8899aa';
    ctx.clearRect(0, 0, W, H);
    // grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (i / 4) * iH;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '9px Segoe UI';
      ctx.fillText(fmtPrice(mx - (i / 4) * range), pad.l, y - 2);
    }
    const gradient = ctx.createLinearGradient(0, pad.t, 0, H - pad.b);
    gradient.addColorStop(0, color + '55'); gradient.addColorStop(1, color + '00');
    ctx.beginPath();
    prices.forEach((p, i) => {
      const x = pad.l + (i / (prices.length - 1)) * iW;
      const y = pad.t + iH - ((p - mn) / range) * iH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    const lastX = pad.l + iW;
    const lastY = pad.t + iH - ((prices[prices.length - 1] - mn) / range) * iH;
    ctx.lineTo(lastX, pad.t + iH); ctx.lineTo(pad.l, pad.t + iH); ctx.closePath();
    ctx.fillStyle = gradient; ctx.fill();
    ctx.beginPath();
    prices.forEach((p, i) => {
      const x = pad.l + (i / (prices.length - 1)) * iW;
      const y = pad.t + iH - ((p - mn) / range) * iH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(lastX, lastY, 4, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
  };

  useEffect(() => { drawChart(); }, [selectedId, stockState]);

  useEffect(() => {
    STOCKS.forEach((s) => {
      const canvas = sparklineRefs.current[s.id];
      const st = stockState[s.id];
      if (!canvas || !st || st.history.length < 2) return;
      const W = 80, H = 36;
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d')!;
      const prices = st.history.map((h) => h.p);
      const mn = Math.min(...prices), mx = Math.max(...prices);
      const range = mx - mn || 1;
      const pct = (st.price - st.open) / st.open;
      const color = pct > 0.001 ? '#4caf50' : pct < -0.001 ? '#ef5350' : '#8899aa';
      ctx.clearRect(0, 0, W, H);
      ctx.beginPath();
      prices.forEach((p, i) => {
        const x = (i / (prices.length - 1)) * W;
        const y = H - ((p - mn) / range) * H;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
    });
  }, [stockState]);

  const doBuy = () => {
    if (!selectedId || !selectedSt || !canBuy) return;
    const cost = qty * selectedSt.price;
    const newPf = { ...pf };
    if (!newPf[selectedId]) newPf[selectedId] = { qty: 0, avgCost: 0 };
    const pos = newPf[selectedId];
    pos.avgCost = (pos.avgCost * pos.qty + selectedSt.price * qty) / (pos.qty + qty);
    pos.qty += qty;
    patchState({ socks: state.socks - cost, stockPortfolio: newPf });
    save();
    onLog(`📈 <span>Achat</span> ${qty}× ${selectedStock?.name} à ${fmtPrice(selectedSt.price)} 🩲`);
    onToast(`📈 Achat ${qty}× ${selectedStock?.name}`);
  };

  const doSell = () => {
    if (!selectedId || !selectedSt || !canSell) return;
    const revenue = qty * selectedSt.price;
    const profit = revenue - qty * (pf[selectedId]?.avgCost || 0);
    const newPf = { ...pf };
    const pos = { ...newPf[selectedId] };
    pos.qty -= qty;
    if (pos.qty <= 0) delete newPf[selectedId]; else newPf[selectedId] = pos;
    patchState({ socks: state.socks + revenue, totalSocks: state.totalSocks + revenue, allTimeSocks: state.allTimeSocks + revenue, stockPortfolio: newPf, bourseProfit: (state.bourseProfit || 0) + Math.max(0, profit) });
    save();
    onLog(`📉 <span>Vente</span> ${qty}× ${selectedStock?.name} à ${fmtPrice(selectedSt.price)} 🩲`);
  };

  const sellAll = (id: string) => {
    const st = stockState[id];
    if (!st || !pf[id]) return;
    const revenue = pf[id].qty * st.price;
    const profit = revenue - pf[id].qty * pf[id].avgCost;
    const newPf = { ...pf };
    delete newPf[id];
    patchState({ socks: state.socks + revenue, totalSocks: state.totalSocks + revenue, allTimeSocks: state.allTimeSocks + revenue, stockPortfolio: newPf, bourseProfit: (state.bourseProfit || 0) + Math.max(0, profit) });
    save();
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="bourseModalTitle" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.headerRow}>
          <h2 id="bourseModalTitle">📈 Bourse du Caleçon</h2>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div>
              <div className={styles.wallet}>Solde : <strong>{fmt(state.socks)} 🩲</strong></div>
              <div className={styles.portfolioValue}>Portefeuille : <strong>{fmt(portfolioTotal)} 🩲</strong></div>
            </div>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer la Bourse">✕</button>
          </div>
        </div>

        <div className={styles.stockList}>
          {STOCKS.map((s) => {
            const st = stockState[s.id];
            if (!st) return null;
            const pct = (st.price - st.open) / st.open;
            const cc = changeClass(pct);
            const sign = pct >= 0 ? '+' : '';
            const held = pf[s.id]?.qty || 0;
            return (
              <div key={s.id} className={`${styles.stockRow} ${selectedId === s.id ? styles.selected : ''}`} onClick={() => { setSelectedId(s.id); setQty(1); }} tabIndex={0} role="button">
                <div><div className={styles.stockName}>{s.icon} {s.name}</div><div className={styles.stockTicker}>{s.ticker} — {s.desc}</div></div>
                <div className={styles.stockPrice}>{fmtPrice(st.price)} 🩲</div>
                <div className={`${styles.stockChange} ${cc}`}>{sign}{(pct * 100).toFixed(2)}%</div>
                <div className={styles.stockHeld}>{held > 0 ? <strong>{held}</strong> : <span style={{ color: 'var(--muted)' }}>—</span>}</div>
                <canvas ref={(el) => { sparklineRefs.current[s.id] = el; }} className={styles.sparkline} width={80} height={36} />
              </div>
            );
          })}
        </div>

        {selectedStock && selectedSt && (
          <div className={styles.detail}>
            <div className={styles.detailTop}>
              <div><div className={styles.detailName}>{selectedStock.icon} {selectedStock.name}</div><div className={styles.detailTicker}>{selectedStock.ticker}</div></div>
              <div className={styles.detailPrice}>{fmtPrice(selectedSt.price)} 🩲</div>
              <div className={styles.detailStats}>
                <div>Ouv. <span>{fmtPrice(selectedSt.open)}</span></div>
                <div>Haut <span>{fmtPrice(selectedSt.high)}</span></div>
                <div>Bas <span>{fmtPrice(selectedSt.low)}</span></div>
              </div>
            </div>
            <canvas ref={chartRef} className={styles.chart} height={160} />
            <div className={styles.tradeRow}>
              <input type="number" className={styles.qtyInput} min={1} value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} />
              <button className={styles.quickBtn} onClick={() => setQty(1)}>×1</button>
              <button className={styles.quickBtn} onClick={() => setQty(10)}>×10</button>
              <button className={styles.quickBtn} onClick={() => setQty(100)}>×100</button>
              <button className={styles.quickBtn} onClick={() => setQty(Math.max(0, Math.floor(state.socks / selectedSt.price)))}>Max</button>
              <div className={styles.tradeCost}>Coût : <strong>{fmtPrice(tradeCost)} 🩲</strong></div>
              <button className={styles.buyBtn} disabled={!canBuy} onClick={doBuy}>Acheter</button>
              <button className={styles.sellBtn} disabled={!canSell} onClick={doSell}>Vendre</button>
            </div>
          </div>
        )}

        <div className={styles.portfolioSection}>
          <h3>💼 Mon portefeuille</h3>
          {Object.keys(pf).length === 0 ? (
            <div className={styles.portfolioEmpty}>Aucune position ouverte.</div>
          ) : (
            <div className={styles.portfolioGrid}>
              {Object.entries(pf).filter(([, pos]) => pos.qty > 0).map(([id, pos]) => {
                const s = STOCKS.find((x) => x.id === id);
                const st = stockState[id];
                if (!s || !st) return null;
                const gain = (st.price - pos.avgCost) * pos.qty;
                const pct = (((st.price - pos.avgCost) / pos.avgCost) * 100).toFixed(1);
                return (
                  <div key={id} className={styles.portfolioRow}>
                    <div className={styles.pfName}>{s.icon} {s.name}</div>
                    <div className={styles.pfQty}>{pos.qty}</div>
                    <div className={styles.pfAvg}>{fmtPrice(pos.avgCost)}</div>
                    <div>{fmtPrice(st.price)}</div>
                    <div className={`${styles.pfGain} ${gain >= 0 ? styles.pos : styles.neg}`}>{gain >= 0 ? '+' : ''}{fmtPrice(gain)} ({gain >= 0 ? '+' : ''}{pct}%)</div>
                    <button className={styles.pfSellBtn} onClick={() => sellAll(id)}>Tout vendre</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
