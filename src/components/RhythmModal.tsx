import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore, computeTotalSPS } from '../store';
import { fmt } from '../utils';
import * as THREE from 'three';
import styles from './RhythmModal.module.css';

interface Props {
  onClose: () => void;
  onLog: (html: string) => void;
  onToast: (msg: string) => void;
  greveActive: boolean;
}

// ── Difficulty system ────────────────────────────────────────────────────────
type DifficultyKey = 'facile' | 'normal' | 'difficile' | 'expert';

interface DifficultyConfig {
  label: string; emoji: string; color: string;
  bpm: number; noteSpeed: number; travelTime: number;
  perfectWindow: number; goodWindow: number;
  density: number; maxSimultaneous: number; songBeats: number;
}

const DIFFICULTIES: Record<DifficultyKey, DifficultyConfig> = {
  facile:    { label: 'Facile',    emoji: '🟢', color: '#4caf50', bpm: 85,  noteSpeed: 8,  travelTime: 2.2, perfectWindow: 0.130, goodWindow: 0.28, density: 0.40, maxSimultaneous: 1, songBeats: 28 },
  normal:    { label: 'Normal',    emoji: '🟡', color: '#f5a623', bpm: 118, noteSpeed: 10, travelTime: 2.2, perfectWindow: 0.090, goodWindow: 0.20, density: 0.75, maxSimultaneous: 2, songBeats: 36 },
  difficile: { label: 'Difficile', emoji: '🟠', color: '#ff6800', bpm: 148, noteSpeed: 12, travelTime: 2.0, perfectWindow: 0.065, goodWindow: 0.14, density: 1.15, maxSimultaneous: 2, songBeats: 44 },
  expert:    { label: 'Expert',    emoji: '🔴', color: '#e94560', bpm: 180, noteSpeed: 15, travelTime: 1.8, perfectWindow: 0.045, goodWindow: 0.10, density: 1.70, maxSimultaneous: 3, songBeats: 52 },
};

interface GameConfig {
  beat: number; noteSpeed: number; spawnZ: number; travelTime: number;
  perfectWindow: number; goodWindow: number;
  missThreshold: number; songDuration: number;
  difficultyKey: DifficultyKey;
}

function makeConfig(d: DifficultyConfig, key: DifficultyKey): GameConfig {
  const beat = 60 / d.bpm;
  return {
    beat, noteSpeed: d.noteSpeed, spawnZ: -(d.noteSpeed * d.travelTime),
    travelTime: d.travelTime, perfectWindow: d.perfectWindow, goodWindow: d.goodWindow,
    missThreshold: -0.8,
    songDuration: (d.songBeats + 2) * beat + d.travelTime + 0.5,
    difficultyKey: key,
  };
}

function generateChart(d: DifficultyConfig): [number, number][] {
  const chart: [number, number][] = [];
  const { density, maxSimultaneous, songBeats, bpm } = d;
  const resolution = bpm >= 150 ? 8 : 4;
  let lastLane = -1;
  let lastSlot = -99;
  const minGap = density <= 0.5 ? 2 : density <= 0.9 ? 1 : 0;
  for (let slot = 0; slot < songBeats * resolution; slot++) {
    const beat = slot / resolution;
    if (slot - lastSlot < minGap) continue;
    const chance = density / resolution;
    if (Math.random() >= chance) continue;
    const numNotes =
      maxSimultaneous >= 2 && Math.random() < 0.12 * (maxSimultaneous - 1)
        ? (maxSimultaneous >= 3 && Math.random() < 0.06 ? 3 : 2)
        : 1;
    const lanes = new Set<number>();
    let lane = Math.floor(Math.random() * 4);
    if (numNotes === 1 && lane === lastLane && Math.random() > 0.15) {
      lane = (lane + 1 + Math.floor(Math.random() * 3)) % 4;
    }
    lanes.add(lane);
    while (lanes.size < numNotes) lanes.add(Math.floor(Math.random() * 4));
    lanes.forEach((l) => chart.push([beat, l]));
    lastLane = lane;
    lastSlot = slot;
  }
  return chart.sort((a, b) => a[0] - b[0]);
}

const HIT_Z = 0.0;
const LANE_X = [-3, -1, 1, 3];
const LANE_HEX = [0xe91e63, 0x2196f3, 0x4caf50, 0xff9800];
const LANE_CSS = ['#e91e63', '#2196f3', '#4caf50', '#ff9800'];
const LANE_KEYS = ['A', 'Z', 'E', 'R'];
const LANE_KEY_CHARS = ['a', 'z', 'e', 'r'];
const LANE_ICONS = ['🪡', '✂️', '🧵', '🩲'];
const LANE_LABELS = ['Fil', 'Ciseaux', 'Aiguille', 'Caleçon'];

// ── Helpers ───────────────────────────────────────────────────────────────────
interface ActiveNote {
  id: number;
  lane: number;
  targetTime: number; // game-time when note should be hit
  mesh: THREE.Mesh;
  hit: boolean;
  missed: boolean;
}

interface JudgmentDisplay {
  id: number;
  lane: number;
  text: string;
  color: string;
  expires: number; // performance.now()
}

function buildScene(canvas: HTMLCanvasElement) {
  const W = canvas.clientWidth || canvas.width;
  const H = canvas.clientHeight || canvas.height;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d0d1e);
  scene.fog = new THREE.Fog(0x0d0d1e, 18, 32);

  // Camera: angled from behind the hit zone looking down the lanes
  const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
  camera.position.set(0, 5.5, 8);
  camera.lookAt(0, 0, -5);

  // ── Lights ──────────────────────────────────────────────────────────────────
  const ambient = new THREE.AmbientLight(0x222244, 1.2);
  scene.add(ambient);

  const spotLight = new THREE.SpotLight(0xffffff, 2.5, 50, Math.PI / 5, 0.3);
  spotLight.position.set(0, 15, 5);
  spotLight.target.position.set(0, 0, -5);
  spotLight.castShadow = true;
  scene.add(spotLight);
  scene.add(spotLight.target);

  // Colored lane rim lights
  const laneColors = [0xe91e63, 0x2196f3, 0x4caf50, 0xff9800];
  laneColors.forEach((col, i) => {
    const pl = new THREE.PointLight(col, 0.6, 8);
    pl.position.set(LANE_X[i], 0.5, 2);
    scene.add(pl);
  });

  // ── Highway floor ────────────────────────────────────────────────────────────
  const floorGeo = new THREE.PlaneGeometry(8, 30, 8, 30);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a1a,
    roughness: 0.9,
    metalness: 0.1,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.05, -7);
  floor.receiveShadow = true;
  scene.add(floor);

  // Grid lines along the highway
  const gridMat = new THREE.LineBasicMaterial({ color: 0x1a1a3a, transparent: true, opacity: 0.7 });
  for (let z = 0; z >= -28; z -= 2) {
    const pts = [new THREE.Vector3(-4, 0, z), new THREE.Vector3(4, 0, z)];
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
  }

  // Lane separator lines
  const sepMat = new THREE.LineBasicMaterial({ color: 0x223366, transparent: true, opacity: 0.6 });
  [-4, -2, 0, 2, 4].forEach((x) => {
    const pts = [new THREE.Vector3(x, 0.01, 2), new THREE.Vector3(x, 0.01, -28)];
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), sepMat));
  });

  // Lane tinted strips
  LANE_X.forEach((x, i) => {
    const stripGeo = new THREE.PlaneGeometry(1.9, 30);
    const stripMat = new THREE.MeshStandardMaterial({
      color: laneColors[i],
      transparent: true,
      opacity: 0.045,
      roughness: 1,
    });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(x, 0, -7);
    scene.add(strip);
  });

  // ── Hit zone bar ─────────────────────────────────────────────────────────────
  const hitBarGeo = new THREE.BoxGeometry(8.2, 0.08, 0.18);
  const hitBarMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x7777ff,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.7,
  });
  const hitBar = new THREE.Mesh(hitBarGeo, hitBarMat);
  hitBar.position.set(0, 0, HIT_Z);
  scene.add(hitBar);

  // ── Lane hit pads (light up on keypress) ─────────────────────────────────────
  const padMeshes: THREE.Mesh[] = [];
  LANE_X.forEach((x, i) => {
    const padGeo = new THREE.BoxGeometry(1.85, 0.06, 1.0);
    const padMat = new THREE.MeshStandardMaterial({
      color: laneColors[i],
      emissive: new THREE.Color(laneColors[i]),
      emissiveIntensity: 0,
      transparent: true,
      opacity: 0.5,
    });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(x, 0, 0.5);
    scene.add(pad);
    padMeshes.push(pad);
  });

  return { renderer, scene, camera, padMeshes, hitBarMat };
}

// ── Particle burst on hit ─────────────────────────────────────────────────────
interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
}

function spawnParticles(scene: THREE.Scene, x: number, color: number): Particle[] {
  const particles: Particle[] = [];
  const count = 14;
  for (let i = 0; i < count; i++) {
    const geo = new THREE.SphereGeometry(0.08, 4, 4);
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: new THREE.Color(color),
      emissiveIntensity: 1.5,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 0.3, HIT_Z);
    scene.add(mesh);
    const angle = (Math.PI * 2 * i) / count;
    particles.push({
      mesh,
      vx: Math.cos(angle) * (0.06 + Math.random() * 0.08),
      vy: 0.05 + Math.random() * 0.12,
      vz: (Math.random() - 0.5) * 0.06,
      life: 1,
    });
  }
  return particles;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RhythmModal({ onClose, onLog, onToast, greveActive }: Props) {
  const { state, patchState, save } = useStore();
  const sps = computeTotalSPS(state, greveActive);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'intro' | 'countdown' | 'play' | 'result'>('intro');
  const [countdown, setCountdown] = useState(3);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [perfects, setPerfects] = useState(0);
  const [goods, setGoods] = useState(0);
  const [misses, setMisses] = useState(0);
  const [judgments, setJudgments] = useState<JudgmentDisplay[]>([]);
  const [lanePressed, setLanePressed] = useState([false, false, false, false]);
  const [resultText, setResultText] = useState('');

  // Refs for animation loop (avoid stale closures)
  const phaseRef = useRef<'intro' | 'countdown' | 'play' | 'result'>('intro');
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const perfectsRef = useRef(0);
  const goodsRef = useRef(0);
  const missesRef = useRef(0);
  const judgeIdRef = useRef(0);

  const sceneRef = useRef<ReturnType<typeof buildScene> | null>(null);
  const notesRef = useRef<ActiveNote[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const noteIdRef = useRef(0);
  const noteIndexRef = useRef(0); // next note in CHART to spawn
  const gameTimeRef = useRef(0);
  const lastFrameRef = useRef(0);
  const rafRef = useRef(0);
  const gameConfigRef = useRef<GameConfig>(makeConfig(DIFFICULTIES.normal, 'normal'));
  const chartRef = useRef<[number, number][]>([]);
  const lastDiffRef = useRef<DifficultyKey>('normal');

  // ── Audio context + music engine ─────────────────────────────────────────
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicStopRef = useRef<(() => void) | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const [musicVol, setMusicVol] = useState(0.5);
  const musicVolRef = useRef(0.5);

  function getAudioCtx() {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    return audioCtxRef.current;
  }

  // ── Procedural chiptune music loop ────────────────────────────────────────
  const startMusic = useCallback((bpm: number) => {
    if (musicStopRef.current) { musicStopRef.current(); musicStopRef.current = null; }
    try {
      const ctx = getAudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const masterGain = ctx.createGain();
      masterGain.gain.value = musicVolRef.current * 0.55;
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // Reverb via convolver (small room)
      const reverbLen = ctx.sampleRate * 0.6;
      const reverbBuf = ctx.createBuffer(2, reverbLen, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = reverbBuf.getChannelData(ch);
        for (let i = 0; i < reverbLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLen, 3);
      }
      const convolver = ctx.createConvolver();
      convolver.buffer = reverbBuf;
      const reverbGain = ctx.createGain();
      reverbGain.gain.value = 0.18;
      convolver.connect(reverbGain);
      reverbGain.connect(masterGain);

      const beat = 60 / bpm;
      const bar = beat * 4;

      // Note frequencies (C minor pentatonic)
      const NOTES: Record<string, number> = {
        C3: 130.81, Eb3: 155.56, F3: 174.61, G3: 196.00, Bb3: 233.08,
        C4: 261.63, Eb4: 311.13, F4: 349.23, G4: 392.00, Bb4: 466.16,
        C5: 523.25, Eb5: 622.25, G5: 783.99,
      };

      // Bass pattern (root + fifth alternating, 1 note per beat)
      const bassLine = ['C3','C3','G3','Bb3', 'C3','Eb3','G3','C3'];
      // Lead melody (plays every 2 bars)
      const melody = [
        ['C5','–','Eb5','–','G4','F4','Eb4','–'],
        ['G4','–','Bb4','–','C5','–','G4','–'],
      ];
      // Chord pads (plays every 4 bars)
      const chords = [
        ['C4','Eb4','G4'], ['F3','Bb3','Eb4'], ['G3','Bb3','D4'], ['C4','Eb4','G4'],
      ];

      let stopped = false;
      const timeouts: ReturnType<typeof setTimeout>[] = [];

      function scheduleOsc(freq: number, start: number, dur: number, type: OscillatorType, vol: number, detune = 0) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(masterGain); osc.connect(convolver);
        osc.type = type;
        osc.frequency.value = freq;
        osc.detune.value = detune;
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(vol, start + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.start(start); osc.stop(start + dur + 0.05);
      }

      function scheduleKick(t: number) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(masterGain);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
        g.gain.setValueAtTime(0.9, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.start(t); osc.stop(t + 0.3);
      }

      function scheduleSnare(t: number) {
        const bufLen = Math.floor(ctx.sampleRate * 0.12);
        const noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = noiseBuf;
        const g = ctx.createGain();
        const bpf = ctx.createBiquadFilter();
        bpf.type = 'bandpass'; bpf.frequency.value = 1800; bpf.Q.value = 0.8;
        src.connect(bpf); bpf.connect(g); g.connect(masterGain);
        g.gain.setValueAtTime(0.45, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        src.start(t); src.stop(t + 0.15);
      }

      function scheduleHihat(t: number, vol = 0.12) {
        const bufLen = Math.floor(ctx.sampleRate * 0.04);
        const noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = noiseBuf;
        const g = ctx.createGain();
        const hpf = ctx.createBiquadFilter();
        hpf.type = 'highpass'; hpf.frequency.value = 8000;
        src.connect(hpf); hpf.connect(g); g.connect(masterGain);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        src.start(t); src.stop(t + 0.06);
      }

      // Schedule one bar at a time, looping
      let loopBar = 0;
      function scheduleBar(startT: number) {
        if (stopped) return;
        const melodyPat = melody[Math.floor(loopBar / 2) % melody.length];
        const chordPat  = chords[Math.floor(loopBar / 4) % chords.length];

        for (let step = 0; step < 8; step++) {
          const t = startT + step * (beat / 2);
          // Drums
          if (step === 0) scheduleKick(t);
          if (step === 2) scheduleKick(t + beat * 0.5 * 0.25); // off-kick
          if (step === 4) scheduleSnare(t);
          if (step === 6) { scheduleSnare(t); scheduleKick(t + beat * 0.1); }
          scheduleHihat(t, step % 2 === 0 ? 0.14 : 0.07);

          // Bass (one note per beat = every 2 steps)
          if (step % 2 === 0) {
            const bNote = bassLine[(loopBar * 4 + step / 2) % bassLine.length];
            if (bNote !== '–') {
              const freq = NOTES[bNote];
              if (freq) scheduleOsc(freq, t, beat * 0.85, 'sawtooth', 0.28, -1200);
            }
          }

          // Lead melody (every half-beat)
          const mNote = melodyPat[step];
          if (mNote && mNote !== '–') {
            const freq = NOTES[mNote];
            if (freq) {
              scheduleOsc(freq, t, beat * 0.42, 'square', 0.12);
              scheduleOsc(freq * 2, t, beat * 0.42, 'square', 0.04, 7); // octave harmony
            }
          }
        }

        // Chord pad (whole bar)
        chordPat.forEach((n) => {
          const freq = NOTES[n];
          if (freq) scheduleOsc(freq, startT, bar * 0.9, 'triangle', 0.06);
        });

        loopBar++;
        const nextStart = startT + bar;
        const msUntilNext = (nextStart - ctx.currentTime - 0.1) * 1000;
        const tid = setTimeout(() => scheduleBar(nextStart), Math.max(0, msUntilNext));
        timeouts.push(tid);
      }

      const firstBar = ctx.currentTime + 0.05;
      scheduleBar(firstBar);

      // Return stop function
      musicStopRef.current = () => {
        stopped = true;
        timeouts.forEach(clearTimeout);
        masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
        masterGainRef.current = null;
      };
    } catch { /* audio not available */ }
  }, []);

  const stopMusic = useCallback(() => {
    if (musicStopRef.current) { musicStopRef.current(); musicStopRef.current = null; }
  }, []);

  const playClick = useCallback((freq = 440, dur = 0.06, vol = 0.15) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + dur);
    } catch { /* AudioContext may be blocked */ }
  }, []);

  // ── Judge a hit on a lane ─────────────────────────────────────────────────
  const judgeHit = useCallback((lane: number) => {
    const scene = sceneRef.current?.scene;
    if (!scene) return;

    const t = gameTimeRef.current;
    const { goodWindow, perfectWindow } = gameConfigRef.current;
    // Find earliest un-hit note in this lane within window
    const candidates = notesRef.current.filter(
      (n) => n.lane === lane && !n.hit && !n.missed &&
        Math.abs(n.targetTime - t) <= goodWindow
    );
    if (candidates.length === 0) return; // no note to hit
    candidates.sort((a, b) => Math.abs(a.targetTime - t) - Math.abs(b.targetTime - t));
    const note = candidates[0];
    const dt = Math.abs(note.targetTime - t);
    const isPerfect = dt <= perfectWindow;

    note.hit = true;
    scene.remove(note.mesh);
    note.mesh.geometry.dispose();
    (note.mesh.material as THREE.Material).dispose();

    // Spawn particles
    const px = LANE_X[lane];
    particlesRef.current.push(...spawnParticles(scene, px, LANE_HEX[lane]));

    // Update score
    const pts = isPerfect ? 300 : 100;
    const newCombo = comboRef.current + 1;
    const comboBonus = Math.floor(newCombo / 10);
    const total = pts + comboBonus * 50;
    scoreRef.current += total;
    setScore(scoreRef.current);
    comboRef.current = newCombo;
    setCombo(newCombo);
    if (newCombo > maxComboRef.current) {
      maxComboRef.current = newCombo;
    }
    if (isPerfect) { perfectsRef.current++; setPerfects(perfectsRef.current); }
    else { goodsRef.current++; setGoods(goodsRef.current); }

    playClick(isPerfect ? 880 : 660, 0.07, isPerfect ? 0.2 : 0.12);

    // Judgment display
    const jid = judgeIdRef.current++;
    const jText = isPerfect ? 'PARFAIT !' : 'BIEN !';
    const jColor = isPerfect ? '#ffd700' : '#4fc3f7';
    const expires = performance.now() + 600;
    setJudgments((prev) => [...prev.slice(-6), { id: jid, lane, text: jText, color: jColor, expires }]);
  }, [playClick]);

  // ── Miss a note ───────────────────────────────────────────────────────────
  const missNote = useCallback((note: ActiveNote) => {
    note.missed = true;
    const scene = sceneRef.current?.scene;
    if (scene) {
      scene.remove(note.mesh);
      note.mesh.geometry.dispose();
      (note.mesh.material as THREE.Material).dispose();
    }
    comboRef.current = 0;
    setCombo(0);
    missesRef.current++;
    setMisses(missesRef.current);

    const jid = judgeIdRef.current++;
    const expires = performance.now() + 500;
    setJudgments((prev) => [...prev.slice(-6), { id: jid, lane: note.lane, text: 'RATÉ', color: '#ff4444', expires }]);
  }, []);

  // ── End game ──────────────────────────────────────────────────────────────
  const endGame = useCallback(() => {
    if (phaseRef.current === 'result') return;
    phaseRef.current = 'result';
    cancelAnimationFrame(rafRef.current);

    const total = perfectsRef.current + goodsRef.current;
    const accuracy = total + missesRef.current > 0
      ? Math.round((total / (total + missesRef.current)) * 100)
      : 0;

    const grade =
      accuracy >= 95 && missesRef.current === 0 ? 'S' :
      accuracy >= 90 ? 'A' :
      accuracy >= 75 ? 'B' :
      accuracy >= 55 ? 'C' : 'D';

    const gradeEmoji = { S: '🌟', A: '⭐', B: '👍', C: '🙂', D: '😅' }[grade] ?? '😅';

    const baseSocks = scoreRef.current * 5;
    const spsMult = Math.max(1, Math.floor(Math.log10(sps + 1) * 2));
    const reward = Math.floor(baseSocks * spsMult);

    patchState({
      socks: state.socks + reward,
      totalSocks: state.totalSocks + reward,
      allTimeSocks: state.allTimeSocks + reward,
      bestRhythmScore: Math.max(state.bestRhythmScore || 0, scoreRef.current),
      bestRhythmGrade: (['S','A','B','C','D'].indexOf(grade) < ['S','A','B','C','D'].indexOf(state.bestRhythmGrade || 'D')) ? grade : (state.bestRhythmGrade || grade),
      rhythmPlays: (state.rhythmPlays || 0) + 1,
    });
    save();

    const diffConf = DIFFICULTIES[gameConfigRef.current.difficultyKey];
    const resultStr = [
      `${diffConf.emoji} ${diffConf.label}  —  ${gradeEmoji} Grade ${grade}`,
      `Score : ${scoreRef.current.toLocaleString('fr-FR')}`,
      `BPM : ${diffConf.bpm}  |  Notes jouées : ${total + missesRef.current}`,
      `Précision : ${accuracy}%`,
      `Parfaits : ${perfectsRef.current}  Biens : ${goodsRef.current}  Ratés : ${missesRef.current}`,
      `Combo max : ×${maxComboRef.current}`,
      `Récompense : +${fmt(reward)} 🩲`,
    ].join('\n');

    setResultText(resultStr);
    setPhase('result');
    stopMusic();
    onLog(`🎵 <span>Rythme de la Couture</span> — Grade ${grade}, ${accuracy}% précision — +${fmt(reward)} 🩲`);
    onToast(`🎵 Grade ${grade} ! +${fmt(reward)} 🩲`);
  }, [sps, state, patchState, save, onLog, onToast, stopMusic]);

  // ── Animation / game loop ─────────────────────────────────────────────────
  const tick = useCallback((now: number) => {
    if (phaseRef.current !== 'play') return;

    const dt = Math.min((now - lastFrameRef.current) / 1000, 0.1);
    lastFrameRef.current = now;
    gameTimeRef.current += dt;
    const t = gameTimeRef.current;

    const { renderer, scene, camera, padMeshes } = sceneRef.current!;
    const cfg = gameConfigRef.current;
    const chart = chartRef.current;

    // Spawn new notes
    while (
      noteIndexRef.current < chart.length &&
      chart[noteIndexRef.current][0] * cfg.beat <= t + cfg.travelTime
    ) {
      const [beat, lane] = chart[noteIndexRef.current];
      const targetTime = beat * cfg.beat;
      noteIndexRef.current++;

      // Create note mesh
      const geo = new THREE.BoxGeometry(1.7, 0.35, 0.9);
      const mat = new THREE.MeshStandardMaterial({
        color: LANE_HEX[lane],
        emissive: new THREE.Color(LANE_HEX[lane]),
        emissiveIntensity: 0.6,
        roughness: 0.3,
        metalness: 0.4,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(LANE_X[lane], 0.2, cfg.spawnZ);
      mesh.castShadow = true;
      scene.add(mesh);

      notesRef.current.push({
        id: noteIdRef.current++,
        lane,
        targetTime,
        mesh,
        hit: false,
        missed: false,
      });
    }

    // Update note positions
    for (const note of notesRef.current) {
      if (note.hit || note.missed) continue;
      const z = HIT_Z - cfg.noteSpeed * (note.targetTime - t);
      note.mesh.position.z = z;

      // Fade note as it approaches from far away
      const dist = Math.abs(z - HIT_Z);
      const fade = Math.min(1, (-cfg.spawnZ - dist) / 2);
      (note.mesh.material as THREE.MeshStandardMaterial).opacity = Math.max(0.1, fade);
      (note.mesh.material as THREE.MeshStandardMaterial).transparent = fade < 1;

      // Miss detection: note passed the hit zone without being hit
      if (z > 0.8 && !note.missed) {
        missNote(note);
      }
    }

    // Clean up hit/missed notes from array
    notesRef.current = notesRef.current.filter((n) => !n.hit && !n.missed);

    // Update particles
    const toRemove: Particle[] = [];
    for (const p of particlesRef.current) {
      p.life -= dt * 2.5;
      if (p.life <= 0) {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        toRemove.push(p);
        continue;
      }
      p.mesh.position.x += p.vx;
      p.mesh.position.y += p.vy;
      p.mesh.position.z += p.vz;
      p.vy -= 0.006;
      const s = p.life;
      p.mesh.scale.set(s, s, s);
      (p.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = p.life * 1.8;
    }
    particlesRef.current = particlesRef.current.filter((p) => !toRemove.includes(p));

    // Decay lane pads glow
    padMeshes.forEach((pad) => {
      const mat = pad.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = Math.max(0, mat.emissiveIntensity - dt * 4);
    });

    // Hit bar pulse on beat
    const beatPhase = (t % cfg.beat) / cfg.beat;
    const pulse = beatPhase < 0.1 ? 1.5 : 0.8;
    sceneRef.current!.hitBarMat.emissiveIntensity = pulse;

    // Clean up old judgments
    setJudgments((prev) => prev.filter((j) => j.expires > performance.now()));

    renderer.render(scene, camera);

    // End of song
    if (t >= cfg.songDuration) {
      endGame();
      return;
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [missNote, endGame]);

  // ── Start game (after countdown) ──────────────────────────────────────────
  const startGame = useCallback((diffKey: DifficultyKey) => {
    const dConf = DIFFICULTIES[diffKey];
    gameConfigRef.current = makeConfig(dConf, diffKey);
    chartRef.current = generateChart(dConf);
    lastDiffRef.current = diffKey;
    phaseRef.current = 'play';
    setPhase('play');
    noteIndexRef.current = 0;
    gameTimeRef.current = 0;
    scoreRef.current = 0;
    comboRef.current = 0;
    maxComboRef.current = 0;
    perfectsRef.current = 0;
    goodsRef.current = 0;
    missesRef.current = 0;
    notesRef.current = [];
    particlesRef.current = [];
    lastFrameRef.current = performance.now();
    startMusic(dConf.bpm);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick, startMusic]);

  // ── Countdown ─────────────────────────────────────────────────────────────
  const startCountdown = useCallback((diffKey: DifficultyKey) => {
    phaseRef.current = 'countdown';
    setPhase('countdown');
    setCountdown(3);
    let c = 3;
    const id = setInterval(() => {
      c--;
      if (c <= 0) {
        clearInterval(id);
        startGame(diffKey);
      } else {
        setCountdown(c);
        playClick(c === 1 ? 660 : 440, 0.05, 0.2);
      }
    }, 1000);
    playClick(440, 0.05, 0.2);
  }, [startGame, playClick]);

  // ── Three.js scene init (once) ────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const built = buildScene(canvas);
    sceneRef.current = built;

    // Initial render
    built.renderer.render(built.scene, built.camera);

    // Handle resize
    const onResize = () => {
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      built.camera.aspect = W / H;
      built.camera.updateProjectionMatrix();
      built.renderer.setSize(W, H);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafRef.current);
      built.renderer.dispose();
    };
  }, []);

  // ── Keyboard input ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'play') return;

    const onDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      // Use e.key (layout-aware) for AZERTY/QWERTY compatibility
      const lane = LANE_KEY_CHARS.indexOf(e.key.toLowerCase());
      if (lane === -1) return;
      e.preventDefault();

      // Light up pad
      const pad = sceneRef.current?.padMeshes[lane];
      if (pad) {
        (pad.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.8;
      }

      setLanePressed((prev) => {
        const next = [...prev];
        next[lane] = true;
        return next;
      });

      judgeHit(lane);
    };

    const onUp = (e: KeyboardEvent) => {
      const lane = LANE_KEY_CHARS.indexOf(e.key.toLowerCase());
      if (lane === -1) return;
      setLanePressed((prev) => {
        const next = [...prev];
        next[lane] = false;
        return next;
      });
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [phase, judgeHit]);

  // ── Escape to close ───────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { stopMusic(); onClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, stopMusic]);

  // ── Stop music on unmount ───────────────────────────────────────
  useEffect(() => {
    return () => stopMusic();
  }, [stopMusic]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.overlay} role="dialog" aria-label="Rythme de la Couture">
      <canvas ref={canvasRef} className={styles.canvas} />

      {/* ── Intro screen ── */}
      {phase === 'intro' && (
        <div className={styles.introPanel}>
          <h2 className={styles.introTitle}>🎵 Rythme de la Couture</h2>
          <p className={styles.introSub}>Appuie sur les touches au bon moment pour coudre des caleçons !</p>
          <div className={styles.laneGuide}>
            {LANE_KEYS.map((key, i) => (
              <div key={i} className={styles.laneGuideItem} style={{ borderColor: LANE_CSS[i] }}>
                <span className={styles.laneIcon}>{LANE_ICONS[i]}</span>
                <span className={styles.laneKeyBadge} style={{ background: LANE_CSS[i] }}>{key}</span>
                <span className={styles.laneGuideLabel}>{LANE_LABELS[i]}</span>
              </div>
            ))}
          </div>
          <div className={styles.judgmentLegend}>
            <span style={{ color: '#ffd700' }}>PARFAIT</span>
            <span style={{ color: '#4fc3f7' }}>BIEN</span>
            <span style={{ color: '#ff4444' }}>RATÉ</span>
          </div>
          <p className={styles.difficultyLabel}>Choisir une difficulté :</p>
          <div className={styles.difficultyRow}>
            {(Object.keys(DIFFICULTIES) as DifficultyKey[]).map((key) => {
              const d = DIFFICULTIES[key];
              return (
                <button
                  key={key}
                  className={styles.diffBtn}
                  style={{ '--diff-color': d.color } as React.CSSProperties}
                  onClick={() => startCountdown(key)}
                >
                  <span className={styles.diffEmoji}>{d.emoji}</span>
                  <span className={styles.diffLabel}>{d.label}</span>
                  <span className={styles.diffBpm}>{d.bpm} BPM</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Countdown ── */}
      {phase === 'countdown' && (
        <div className={styles.countdownPanel}>
          <div className={styles.countdownNum}>{countdown}</div>
        </div>
      )}

      {/* ── HUD during play ── */}
      {phase === 'play' && (
        <>
          {/* Score + combo */}
          <div className={styles.scoreHud}>
            <div className={styles.scoreValue}>{score.toLocaleString('fr-FR')}</div>
            {combo >= 2 && (
              <div className={styles.comboValue} style={{ color: combo >= 20 ? '#ffd700' : combo >= 10 ? '#ff9800' : '#4fc3f7' }}>
                ×{combo} combo
              </div>
            )}
          </div>

          {/* Judgment popups */}
          {judgments.map((j) => (
            <div
              key={j.id}
              className={styles.judgmentPop}
              style={{
                left: `calc(${(LANE_X[j.lane] + 4) / 8 * 100}% - 50px)`,
                color: j.color,
              }}
            >
              {j.text}
            </div>
          ))}

          {/* Lane keys HUD */}
          <div className={styles.laneHud}>
            {LANE_KEYS.map((key, i) => (
              <div
                key={i}
                className={styles.laneKey}
                style={{
                  borderColor: lanePressed[i] ? LANE_CSS[i] : 'rgba(255,255,255,0.2)',
                  background: lanePressed[i] ? LANE_CSS[i] + '55' : 'rgba(0,0,0,0.5)',
                  boxShadow: lanePressed[i] ? `0 0 16px ${LANE_CSS[i]}` : 'none',
                }}
              >
                <span className={styles.laneKeyIcon}>{LANE_ICONS[i]}</span>
                <span className={styles.laneKeyLabel}>{key}</span>
              </div>
            ))}
          </div>

          {/* Mini stats */}
          <div className={styles.miniStats}>
            <span style={{ color: '#ffd700' }}>✦ {perfects}</span>
            <span style={{ color: '#4fc3f7' }}>◇ {goods}</span>
            <span style={{ color: '#ff4444' }}>✕ {misses}</span>
          </div>
          {/* Volume control */}
          <div className={styles.volControl}>
            <span>🔊</span>
            <input
              type="range" min={0} max={1} step={0.05}
              value={musicVol}
              className={styles.volSlider}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                musicVolRef.current = v;
                setMusicVol(v);
                if (masterGainRef.current && audioCtxRef.current) {
                  masterGainRef.current.gain.setTargetAtTime(v * 0.55, audioCtxRef.current.currentTime, 0.02);
                }
              }}
              aria-label="Volume musique"
            />
          </div>        </>
      )}

      {/* ── Result screen ── */}
      {phase === 'result' && (
        <div className={styles.resultPanel}>
          <h2 className={styles.resultTitle}>Terminé !</h2>
          <pre className={styles.resultText}>{resultText}</pre>
          <div className={styles.resultBtns}>
            <button className={styles.startBtn} onClick={() => startCountdown(lastDiffRef.current)}>🔁 Rejouer</button>
            <button className={styles.closeBtn} onClick={() => { phaseRef.current = 'intro'; setPhase('intro'); }}>↩ Difficulté</button>
            <button className={styles.closeBtn} onClick={onClose}>Fermer</button>
          </div>
        </div>
      )}

      {/* Close btn (always) */}
      {phase !== 'play' && (
        <button className={styles.closeBtnCorner} onClick={onClose} aria-label="Fermer">✕</button>
      )}
    </div>
  );
}
