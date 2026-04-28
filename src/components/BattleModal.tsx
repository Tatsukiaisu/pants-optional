import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore, computeTotalSPS } from '../store';
import { ENEMIES, PLAYER_MOVES, ENEMY_MOVES } from '../data';
import type { BattleState, Enemy } from '../types';
import { fmt } from '../utils';
import * as THREE from 'three';
import styles from './BattleModal.module.css';

interface Props {
  onClose: () => void;
  onLog: (html: string) => void;
  onToast: (msg: string) => void;
  greveActive: boolean;
}

function playerLevel(allTimeSocks: number) {
  return Math.max(1, Math.floor(Math.log10(allTimeSocks + 1) * 3));
}

function pickEnemy(lv: number): Enemy {
  const suitable = ENEMIES.filter((e) => e.level <= lv + 4);
  return suitable[Math.floor(Math.random() * suitable.length)] || ENEMIES[0];
}

// ── Pixel-art sprite draw functions ──────────────────────────────────────────
type DrawFn = (R: (x: number, y: number, w: number, h: number, c: string) => void) => void;

function makeSpriteTex(drawFn: DrawFn, gridW: number, gridH: number) {
  const PX = 6;
  const cnv = document.createElement('canvas');
  cnv.width = gridW * PX; cnv.height = gridH * PX;
  const ctx = cnv.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const R = (x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(x * PX, y * PX, w * PX, h * PX); };
  drawFn(R);
  const tex = new THREE.CanvasTexture(cnv);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

const drawPlayer: DrawFn = (R) => {
  const SK='#f5c5a3',HR='#3d2010',SH='#1565c0',BX='#0d47a1',SH2='#222',EL='#4fc3f7';
  R(5,0,6,1,HR);R(4,1,8,5,SK);R(5,1,6,2,HR);R(3,4,1,2,SK);R(12,4,1,2,SK);
  R(3,6,10,5,SH);R(1,6,2,4,SH);R(13,6,2,4,SH);R(1,10,2,1,SK);R(13,10,2,1,SK);
  R(3,11,10,1,EL);R(3,12,10,3,BX);R(3,15,4,4,SK);R(9,15,4,4,SK);
  R(2,18,5,2,SH2);R(9,18,5,2,SH2);
};

const drawFns: DrawFn[] = [
  // Sock
  (R) => { const W='#f5f5f5',R2='#e53935',K='#111',O='#e0e0e0'; R(4,0,8,13,W);R(4,3,8,2,R2);R(4,6,2,2,R2);R(10,6,2,2,R2);R(3,5,3,1,K);R(10,5,3,1,K);R(5,9,6,1,K);R(5,10,1,1,K);R(10,10,1,1,K);R(4,13,12,5,W);R(4,17,12,1,O); },
  // String
  (R) => { const P='#e91e63',D='#c2185b',K='#000',W='#ff80ab'; R(3,0,2,6,P);R(11,0,2,6,P);R(3,6,10,1,P);R(4,7,8,1,P);R(5,8,6,1,P);R(6,9,4,1,P);R(7,10,2,2,P);R(5,6,2,2,K);R(9,6,2,2,K);R(5,5,2,1,W);R(9,5,2,1,W);R(6,8,4,1,K);R(3,6,1,4,D);R(12,6,1,4,D); },
  // Collant
  (R) => { const P='#6a1b9a',L='#9c27b0',K='#000',R2='#f44336',S='#ce93d8',W='#fff'; R(0,3,3,1,P);R(13,3,3,1,P);R(0,5,4,1,P);R(12,5,4,1,P);R(0,7,4,1,P);R(12,7,4,1,P);R(4,1,8,12,L);R(5,0,6,2,P);R(5,12,6,2,P);R(4,2,8,2,S);R(5,4,2,2,R2);R(9,4,2,2,R2);R(6,8,4,1,K);R(6,9,1,2,W);R(9,9,1,2,W); },
  // Jean
  (R) => { const B='#1565c0',D='#0d47a1',K='#111',O='#ff6f00',S='#e3f2fd'; R(3,0,10,2,O);R(7,0,2,2,K);R(2,2,12,10,B);R(2,2,12,2,D);R(7,2,2,10,S);R(4,4,2,2,K);R(10,4,2,2,K);R(5,7,6,1,K);R(2,12,5,6,B);R(9,12,5,6,B);R(11,5,2,3,'#e91e63'); },
  // Kimono
  (R) => { const SK='#ffcc80',OR='#e65100',LO='#ff6d00',R2='#b71c1c',K='#000',GD='#ffd54f',FL='#ff1744'; R(5,0,6,5,SK);R(5,0,6,1,'#4a3728');R(5,2,2,2,K);R(9,2,2,2,K);R(6,4,4,1,K);R(2,5,12,10,OR);R(5,5,6,8,LO);R(3,12,10,2,R2);R(6,12,4,2,GD);R(3,14,10,4,OR);R(2,18,2,1,FL);R(4,18,2,1,GD); },
  // Omega
  (R) => { const G='#ffd700',D='#e65100',B='#fff176',W='#fffde7',K='#000',P='#ff6f00'; R(0,3,2,10,P);R(14,3,2,10,P);R(3,0,10,2,P);R(3,16,10,2,P);R(2,2,12,12,G);R(3,1,10,2,B);R(1,3,2,10,D);R(13,3,2,10,D);R(3,13,10,2,D);R(4,5,3,3,K);R(9,5,3,3,K);R(5,5,2,2,'#ff0');R(10,5,2,2,'#ff0');R(5,10,6,1,K);R(3,2,4,3,W); },
];

// ── Effect pixel-art draw functions ──────────────────────────────────────────
const drawFxImpact: DrawFn = (R) => {
  R(5,0,2,12,'#ffee58'); R(0,5,12,2,'#ffee58');
  R(2,2,2,2,'#fff176'); R(8,2,2,2,'#fff176'); R(2,8,2,2,'#fff176'); R(8,8,2,2,'#fff176');
  R(4,3,4,6,'#ffffff'); R(3,4,6,4,'#ffffff'); R(5,5,2,2,'#fff9c4');
};
const drawFxSlash: DrawFn = (R) => {
  R(0,0,2,1,'#82b1ff'); R(1,1,2,1,'#4fc3f7'); R(2,2,2,1,'#82b1ff'); R(3,3,2,1,'#4fc3f7');
  R(4,4,2,1,'#82b1ff'); R(5,5,2,1,'#4fc3f7');
  R(4,0,2,1,'#e040fb'); R(5,1,2,1,'#e040fb'); R(6,2,2,1,'#e040fb'); R(7,3,2,1,'#e040fb'); R(8,4,2,1,'#e040fb');
  R(8,0,2,1,'#80deea'); R(9,1,2,1,'#80deea'); R(10,2,2,1,'#80deea'); R(11,3,2,1,'#80deea'); R(12,4,2,1,'#80deea');
};
const drawFxGlow: DrawFn = (R) => {
  R(4,0,4,1,'#00e5ff'); R(0,4,1,4,'#00e5ff'); R(11,4,1,4,'#00e5ff'); R(4,11,4,1,'#00e5ff');
  R(2,1,2,2,'#00e5ff'); R(8,1,2,2,'#00e5ff'); R(2,9,2,2,'#00e5ff'); R(8,9,2,2,'#00e5ff');
  R(3,2,1,1,'#b2ebf2'); R(8,2,1,1,'#b2ebf2'); R(3,9,1,1,'#b2ebf2'); R(8,9,1,1,'#b2ebf2');
};
const drawFxSpin: DrawFn = (R) => {
  R(5,0,2,3,'#fff'); R(9,1,2,3,'#4dd0e1'); R(11,4,2,3,'#fff'); R(9,8,2,3,'#4dd0e1');
  R(5,10,2,3,'#fff'); R(1,8,2,3,'#4dd0e1'); R(0,4,2,3,'#fff'); R(2,1,2,3,'#4dd0e1');
  R(4,4,4,5,'#e0f7fa'); R(5,3,3,1,'#fff');
};
const drawFxBeam: DrawFn = (R) => {
  for (let x = 0; x < 16; x++) R(x,1,1,2,x%2===0?'#ff6d00':'#ff8f00');
  R(0,0,3,4,'#fff9c4'); R(13,0,3,4,'#fff9c4'); R(7,0,2,4,'#ffcc00');
};
const drawFxSpark: DrawFn = (R) => {
  R(4,0,1,5,'#ffff00'); R(6,1,1,4,'#ffe000'); R(2,3,3,1,'#ffff00'); R(7,5,3,1,'#ffe000');
  R(3,6,1,3,'#ffff00'); R(8,2,2,1,'#fff'); R(0,7,2,1,'#fff'); R(9,8,2,1,'#ffff00');
};
const drawFxBite: DrawFn = (R) => {
  R(0,0,2,4,'#ef5350'); R(3,0,2,5,'#ef5350'); R(6,0,2,4,'#ef5350'); R(9,0,1,3,'#ef5350');
  R(0,7,2,3,'#ef5350'); R(3,6,2,4,'#ef5350'); R(6,7,2,3,'#ef5350'); R(9,8,1,2,'#ef5350');
  R(2,4,7,2,'#b71c1c');
};
export default function BattleModal({ onClose, onLog, onToast, greveActive }: Props) {
  const { state, patchState, save } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const playerMeshRef = useRef<THREE.Group | null>(null);
  const enemyMeshRef = useRef<THREE.Group | null>(null);
  const animIdRef = useRef<number | null>(null);
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [log, setLog] = useState('Un combat commence…');
  const [buttonsEnabled, setButtonsEnabled] = useState(true);
  const [result, setResult] = useState<{ won: boolean; reward: number } | null>(null);
  const sps = computeTotalSPS(state, greveActive);

  const flashMesh = useCallback((mesh: THREE.Group | null, hexColor: number, duration: number) => {
    if (!mesh) return;
    const tmp = new THREE.Color(hexColor);
    mesh.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;
      const m = (obj as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (!m) return;
      const prev = m.color.clone();
      m.color.copy(tmp);
      setTimeout(() => { m.color.copy(prev); }, duration);
    });
  }, []);

  const shakeCam = useCallback(() => {
    if (!cameraRef.current) return;
    const ox = cameraRef.current.position.x;
    const oy = cameraRef.current.position.y;
    let i = 0;
    const iv = setInterval(() => {
      if (!cameraRef.current) { clearInterval(iv); return; }
      cameraRef.current.position.x = ox + (Math.random() - 0.5) * 0.5;
      cameraRef.current.position.y = oy + (Math.random() - 0.5) * 0.3;
      if (++i > 7) {
        clearInterval(iv);
        if (cameraRef.current) { cameraRef.current.position.x = ox; cameraRef.current.position.y = oy; }
      }
    }, 45);
  }, []);

  // Spawn a temporary effect sprite in the Three.js scene
  const spawnEffect = useCallback((wx: number, wy: number, drawFn: DrawFn, gW: number, gH: number, plW: number, plH: number, duration: number) => {
    if (!sceneRef.current) return;
    const tex = makeSpriteTex(drawFn, gW, gH);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.04, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(plW, plH), mat);
    mesh.position.set(wx, wy, 0.6);
    sceneRef.current.add(mesh);
    setTimeout(() => {
      sceneRef.current?.remove(mesh);
      mat.dispose(); tex.dispose(); mesh.geometry.dispose();
    }, duration);
  }, []);

  // Lunge utility: mesh moves dx then returns
  const animLunge = useCallback((mesh: THREE.Group | null, dx: number, cb: () => void) => {
    if (!mesh) { cb(); return; }
    const ox = mesh.position.x, oy = mesh.position.y;
    let step = 0;
    const iv = setInterval(() => {
      step++;
      if (step <= 5) {
        mesh.position.x += dx / 5;
        mesh.position.y = oy + Math.sin((step / 5) * Math.PI) * 0.4;
      } else if (step <= 10) {
        mesh.position.x -= dx / 5;
        mesh.position.y = oy + Math.sin(((step - 5) / 5) * Math.PI) * 0.2;
      } else {
        mesh.position.x = ox; mesh.position.y = oy;
        clearInterval(iv); cb();
      }
    }, 40);
  }, []);

  // ── Player move animations ─────────────────────────────────────────────────
  const animCoupDeSlip = useCallback((atkr: THREE.Group | null, defr: THREE.Group | null, onHit: () => void, cb: () => void) => {
    animLunge(atkr, 2.5, () => {
      if (defr) spawnEffect(defr.position.x, defr.position.y + 1, drawFxImpact, 12, 12, 2.8, 2.8, 550);
      onHit(); shakeCam(); setTimeout(cb, 650);
    });
  }, [animLunge, spawnEffect, shakeCam]);

  const animRayureElastique = useCallback((atkr: THREE.Group | null, defr: THREE.Group | null, onHit: () => void, cb: () => void) => {
    if (!atkr) { onHit(); setTimeout(cb, 700); return; }
    const ox = atkr.position.x, oy = atkr.position.y;
    let step = 0;
    const iv = setInterval(() => {
      step++;
      if (step <= 8) {
        atkr.position.x = ox + (step / 8) * 4.0;
        atkr.scale.x = 1 + step * 0.18; atkr.scale.y = 1 - step * 0.04;
      } else if (step === 9) {
        if (defr) [-0.6, 0.1, 0.8].forEach((dy, i) =>
          setTimeout(() => spawnEffect(defr.position.x - 0.3, defr.position.y + dy + 1, drawFxSlash, 14, 6, 3.2, 1.4, 400), i * 90));
        onHit(); shakeCam();
      } else if (step <= 14) {
        atkr.position.x = ox + ((14 - step) / 5) * 4.0;
        atkr.scale.x = 1 + (14 - step) * 0.1; atkr.scale.y = 1;
      } else {
        atkr.position.set(ox, oy, atkr.position.z); atkr.scale.set(1, 1, 1);
        clearInterval(iv); setTimeout(cb, 200);
      }
    }, 42);
  }, [spawnEffect, shakeCam]);

  const animTissuRenforce = useCallback((atkr: THREE.Group | null, _defr: THREE.Group | null, onHit: () => void, cb: () => void) => {
    if (!atkr) { onHit(); setTimeout(cb, 1000); return; }
    [0, 220, 440].forEach((t) =>
      setTimeout(() => spawnEffect(atkr.position.x, atkr.position.y + 1, drawFxGlow, 12, 12, 4.0, 4.0, 380), t));
    setTimeout(() => { flashMesh(atkr, 0x00e5ff, 700); onHit(); }, 550);
    setTimeout(cb, 1200);
  }, [spawnEffect, flashMesh]);

  const animTourbillonCoton = useCallback((atkr: THREE.Group | null, defr: THREE.Group | null, onHit: () => void, cb: () => void) => {
    if (!atkr) { onHit(); setTimeout(cb, 900); return; }
    const ox = atkr.position.x, oy = atkr.position.y;
    let step = 0, hitDone = false;
    const STEPS = 20;
    const iv = setInterval(() => {
      step++;
      const prog = step / STEPS;
      atkr.position.x = ox + prog * 7.0;
      atkr.position.y = oy + Math.sin(prog * Math.PI) * 3.2;
      atkr.rotation.z = prog * Math.PI * 4;
      if (!hitDone && prog >= 0.7) {
        hitDone = true;
        if (defr) spawnEffect(defr.position.x, defr.position.y + 0.5, drawFxSpin, 12, 12, 3.2, 3.2, 650);
        onHit(); shakeCam();
      }
      if (step >= STEPS) {
        clearInterval(iv);
        let rb = 0;
        const rv = setInterval(() => {
          rb++;
          atkr.position.x = ox + (1 - rb / 8) * 7.0;
          atkr.position.y = oy; atkr.rotation.z = 0;
          if (rb >= 8) { atkr.position.set(ox, oy, atkr.position.z); clearInterval(rv); cb(); }
        }, 35);
      }
    }, 38);
  }, [spawnEffect, shakeCam]);

  // ── Enemy move animations ──────────────────────────────────────────────────
  const animMorsureTissu = useCallback((atkr: THREE.Group | null, defr: THREE.Group | null, onHit: () => void, cb: () => void) => {
    animLunge(atkr, -2.5, () => {
      if (defr) spawnEffect(defr.position.x, defr.position.y + 1, drawFxBite, 10, 10, 2.6, 2.6, 550);
      onHit(); shakeCam(); setTimeout(cb, 650);
    });
  }, [animLunge, spawnEffect, shakeCam]);

  const animAttaqueRepassee = useCallback((atkr: THREE.Group | null, defr: THREE.Group | null, onHit: () => void, cb: () => void) => {
    if (!atkr) { onHit(); setTimeout(cb, 900); return; }
    [0, 160, 320].forEach((t) => setTimeout(() => flashMesh(atkr, 0xff6d00, 140), t));
    setTimeout(() => {
      if (defr) {
        const bx = (atkr.position.x + defr.position.x) / 2;
        const by = (atkr.position.y + defr.position.y) / 2 + 1.2;
        spawnEffect(bx, by, drawFxBeam, 16, 4, 7.0, 1.4, 450);
      }
      onHit(); if (defr) flashMesh(defr, 0xff6d00, 500); shakeCam();
      setTimeout(cb, 700);
    }, 560);
  }, [flashMesh, spawnEffect, shakeCam]);

  const animFrottementStatique = useCallback((atkr: THREE.Group | null, defr: THREE.Group | null, onHit: () => void, cb: () => void) => {
    if (!atkr) { onHit(); setTimeout(cb, 800); return; }
    const ox = atkr.position.x, oy = atkr.position.y;
    let step = 0, hitDone = false;
    const iv = setInterval(() => {
      step++;
      atkr.position.x = ox + (Math.random() - 0.5) * 0.7;
      atkr.position.y = oy + (Math.random() - 0.5) * 0.35;
      if (defr && step % 4 === 0)
        spawnEffect(defr.position.x + (Math.random() - 0.5) * 2, defr.position.y + Math.random() * 2.5, drawFxSpark, 10, 10, 1.6, 1.6, 320);
      if (!hitDone && step === 10) { hitDone = true; onHit(); }
      if (step >= 18) {
        clearInterval(iv); atkr.position.set(ox, oy, atkr.position.z); setTimeout(cb, 400);
      }
    }, 50);
  }, [spawnEffect]);

  const initBattle = useCallback(() => {
    const lv = playerLevel(state.allTimeSocks || state.totalSocks || 1);
    const enemy = pickEnemy(lv);
    const playerMaxHp = 80 + lv * 5;
    setBattleState({ enemy, playerHp: playerMaxHp, playerMaxHp, enemyHp: enemy.hp, enemyMaxHp: enemy.hp, playerDef: 10, enemyDef: enemy.def, playerLv: lv, turn: 'player', over: false });
    setLog(`Un ${enemy.name} sauvage apparaît !`);
    setButtonsEnabled(true);
    setResult(null);
  }, [state.allTimeSocks, state.totalSocks]);

  // Three.js init
  useEffect(() => {
    if (!canvasRef.current || !battleState) return;
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    renderer.setPixelRatio(1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const aspect = window.innerWidth / window.innerHeight;
    const vH = 9;
    const camera = new THREE.OrthographicCamera(-vH * aspect, vH * aspect, vH, -vH, 0.1, 100);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Background
    const bgCnv = document.createElement('canvas'); bgCnv.width = 512; bgCnv.height = 512;
    const bx = bgCnv.getContext('2d')!;
    const sky = bx.createLinearGradient(0, 0, 0, 512);
    sky.addColorStop(0, '#5b8dd9'); sky.addColorStop(0.5, '#7fb3ef');
    sky.addColorStop(0.55, '#bcd4a0'); sky.addColorStop(1, '#8bb85c');
    bx.fillStyle = sky; bx.fillRect(0, 0, 512, 512);
    const bgTex = new THREE.CanvasTexture(bgCnv);
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(vH * aspect * 2, vH * 2), new THREE.MeshBasicMaterial({ map: bgTex }));
    bg.position.z = -5; scene.add(bg);

    scene.add(new THREE.AmbientLight(0xffffff, 1));

    // Player sprite
    const pTex = makeSpriteTex(drawPlayer, 16, 20);
    const pMat = new THREE.MeshBasicMaterial({ map: pTex, transparent: true, alphaTest: 0.05, side: THREE.DoubleSide });
    const pMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 4.0), pMat);
    const pGroup = new THREE.Group(); pGroup.add(pMesh);
    pGroup.position.set(-3.8, -1.5, 0); scene.add(pGroup);
    playerMeshRef.current = pGroup;

    // Enemy sprite
    const eIdx = ENEMIES.indexOf(battleState.enemy);
    const eTex = makeSpriteTex(drawFns[eIdx] || drawFns[0], 16, 20);
    const eMat = new THREE.MeshBasicMaterial({ map: eTex, transparent: true, alphaTest: 0.05, side: THREE.DoubleSide });
    const eMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.2), eMat);
    const eGroup = new THREE.Group(); eGroup.add(eMesh);
    eGroup.position.set(3.2, 1.8, 0); eGroup.scale.setScalar(0.85); scene.add(eGroup);
    enemyMeshRef.current = eGroup;

    let t = 0;
    const animate = () => {
      animIdRef.current = requestAnimationFrame(animate);
      t += 0.016;
      if (playerMeshRef.current) playerMeshRef.current.position.y = -1.5 + Math.sin(t * 2.0) * 0.08;
      if (enemyMeshRef.current) enemyMeshRef.current.position.y = 1.8 + Math.sin(t * 1.8 + 1.0) * 0.07;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [battleState?.enemy]);

  useEffect(() => { initBattle(); }, []);

  const endBattle = useCallback((won: boolean, bs: BattleState) => {
    const bonus = Math.max(500, Math.floor(sps * 60 * bs.enemy.reward));
    if (won) {
      patchState({ socks: state.socks + bonus, totalSocks: state.totalSocks + bonus, allTimeSocks: state.allTimeSocks + bonus, battlesWon: (state.battlesWon || 0) + 1 });
      save();
      setLog(`🏆 Victoire ! ${bs.enemy.name} est K.O. !`);
      onLog(`⚔️ <span>Victoire !</span> Battu ${bs.enemy.name} — +${fmt(bonus)} 🩲`);
      onToast(`🏆 Victoire ! +${fmt(bonus)} 🩲`);
    } else {
      setLog('💀 Votre caleçon est K.O. !');
      onLog(`⚔️ <span>Défaite</span> contre ${bs.enemy.name}…`);
    }
    setButtonsEnabled(false);
    setTimeout(() => setResult({ won, reward: bonus }), 1500);
  }, [sps, state, patchState, save, onLog, onToast]);

  const handlePlayerMove = (moveIdx: number) => {
    if (!battleState || battleState.over || battleState.turn !== 'player') return;
    setButtonsEnabled(false);
    const move = PLAYER_MOVES[moveIdx];
    const bs = { ...battleState, turn: 'anim' as const };
    setBattleState(bs);

    const doHit = () => {
      let newLog = '';
      if (move.statFn) {
        const r = move.statFn(bs);
        newLog = `🩲 utilise ${move.name} ! ${r}`;
      } else if (Math.random() < move.acc) {
        const dmg = Math.max(1, move.baseDmg + Math.floor(Math.random() * 10) + bs.playerLv - bs.enemyDef * 0.4);
        bs.enemyHp -= dmg;
        newLog = `🩲 utilise ${move.name} ! ${Math.ceil(dmg)} dégâts !`;
      } else {
        newLog = `🩲 utilise ${move.name}… Raté !`;
      }
      setLog(newLog);
      setBattleState({ ...bs });
    };

    const afterAnim = () => {
      if (bs.enemyHp <= 0) { bs.over = true; setBattleState({ ...bs }); endBattle(true, bs); return; }
      // Enemy turn
      setTimeout(() => {
        const emIdx = Math.floor(Math.random() * ENEMY_MOVES.length);
        const emove = ENEMY_MOVES[emIdx];
        const bs2: BattleState = { ...bs, turn: 'anim' as const };

        const doEnemyHit = () => {
          if (Math.random() < 0.88) {
            const dmg = Math.max(1, emove.baseDmg + Math.floor(Math.random() * 8) + bs2.enemy.level - bs2.playerDef * 0.4);
            bs2.playerHp -= dmg;
            setLog(`${bs2.enemy.icon} utilise ${emove.name} ! ${Math.ceil(dmg)} dégâts !`);
          } else {
            setLog(`${bs2.enemy.icon} utilise ${emove.name}… Raté !`);
          }
          setBattleState({ ...bs2 });
        };

        const afterEnemyAnim = () => {
          if (bs2.playerHp <= 0) { bs2.over = true; setBattleState({ ...bs2 }); endBattle(false, bs2); return; }
          bs2.turn = 'player';
          setBattleState({ ...bs2 });
          setTimeout(() => { setLog('Que fait 🩲 ?'); setButtonsEnabled(true); }, 700);
        };

        const enemyAnimFns = [animMorsureTissu, animAttaqueRepassee, animFrottementStatique];
        (enemyAnimFns[emIdx] || animMorsureTissu)(enemyMeshRef.current, playerMeshRef.current, doEnemyHit, afterEnemyAnim);
      }, 400);
    };

    const playerAnimFns = [animCoupDeSlip, animRayureElastique, animTissuRenforce, animTourbillonCoton];
    (playerAnimFns[moveIdx] || animCoupDeSlip)(playerMeshRef.current, enemyMeshRef.current, doHit, afterAnim);
  };

  if (!battleState) return null;

  const pPct = Math.max(0, (battleState.playerHp / battleState.playerMaxHp) * 100);
  const ePct = Math.max(0, (battleState.enemyHp / battleState.enemyMaxHp) * 100);

  return (
    <div className={styles.overlay}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <button className={styles.closeBtn} onClick={onClose} aria-label="Quitter le combat">✕</button>

      <div className={styles.enemyHud}>
        <div className={styles.hudTop}><span className={styles.hudName}>{battleState.enemy.name}</span><span className={styles.hudLevel}>Niv. {battleState.enemy.level}</span></div>
        <div className={styles.hpLabel}>HP</div>
        <div className={styles.hpBar}><div className={`${styles.hpFill} ${styles.enemy} ${ePct < 25 ? styles.critical : ePct < 50 ? styles.low : ''}`} style={{ width: ePct + '%' }} /></div>
        <div className={styles.hpText}>{Math.max(0, Math.ceil(battleState.enemyHp))} / {battleState.enemyMaxHp}</div>
      </div>

      <div className={styles.playerHud}>
        <div className={styles.hudTop}><span className={styles.hudName}>🩲 Caleçon Champion</span><span className={styles.hudLevel}>Niv. {battleState.playerLv}</span></div>
        <div className={styles.hpLabel}>HP</div>
        <div className={styles.hpBar}><div className={`${styles.hpFill} ${styles.player} ${pPct < 25 ? styles.critical : pPct < 50 ? styles.low : ''}`} style={{ width: pPct + '%' }} /></div>
        <div className={styles.hpText}>{Math.max(0, Math.ceil(battleState.playerHp))} / {battleState.playerMaxHp}</div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.logBox}><div className={styles.logText}>{log}</div></div>
        <div className={styles.actionsBox}>
          <div className={styles.actions}>
            {PLAYER_MOVES.map((move, i) => (
              <button key={i} className={`${styles.moveBtn} ${styles[move.type]}`} disabled={!buttonsEnabled || battleState.turn !== 'player'} onClick={() => handlePlayerMove(i)}>
                <span className={styles.moveIcon}>{['💥', '✨', '🛡️', '🌪️'][i]}</span>
                <span className={styles.moveInfo}>
                  <span className={styles.moveName}>{move.name}</span>
                  <span className={styles.moveType}>
                    {move.type === 'physical' ? 'Physique' : move.type === 'special' ? 'Spécial' : 'Statut'}
                    {' • '}{move.desc}{' • '}Préc.{' '}{Math.round(move.acc * 100)}%
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {result && (
        <div className={`${styles.resultOverlay} ${styles.show}`}>
          <div className={styles.resultTitle} style={{ color: result.won ? '#f5a623' : '#e53935' }}>{result.won ? '🏆 Victoire !' : '💀 Défaite…'}</div>
          {result.won && <div className={styles.resultReward}>Récompense : <strong>+{fmt(result.reward)} 🩲</strong></div>}
          <button className={styles.resultBtn} onClick={onClose}>Continuer</button>
        </div>
      )}
    </div>
  );
}
