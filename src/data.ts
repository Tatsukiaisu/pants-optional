import type { Building, Upgrade, Milestone, Boxer, BabyRecipe, BoxerSection, Stock, Enemy, PlayerMove, EnemyMove } from './types';
import { getState } from './store';

// Convenience accessor — used by upgrade `req` functions
const s = () => getState();

export const BUILDINGS: Building[] = [
  { id: 'hands',    name: 'Coudre à la main',          icon: '🤲', desc: 'Lent, mais c\'est un début.',                      baseCost: 15,                  baseRate: 0.1      },
  { id: 'tailor',   name: 'Tailleur de quartier',       icon: '✂️', desc: 'Il connaît chaque entrejambe du coin.',             baseCost: 100,                 baseRate: 0.5      },
  { id: 'atelier',  name: 'Atelier de couture',         icon: '🧵', desc: 'Un atelier artisanal bien organisé.',               baseCost: 1_100,               baseRate: 4        },
  { id: 'machine',  name: 'Machine industrielle',       icon: '⚙️', desc: 'Industrialise la production de caleçons.',          baseCost: 12_000,              baseRate: 20       },
  { id: 'factory',  name: 'Usine textile',              icon: '🏭', desc: 'Production à grande échelle 24h/24.',              baseCost: 130_000,             baseRate: 100      },
  { id: 'cotton',   name: 'Champ de coton',             icon: '🌾', desc: 'La matière première directement à la source.',      baseCost: 1_400_000,           baseRate: 500      },
  { id: 'fashion',  name: 'Maison de mode',             icon: '👔', desc: 'Le caleçon devient haute couture.',                 baseCost: 20_000_000,          baseRate: 2_500    },
  { id: 'ai',       name: 'IA Caleçonnique',            icon: '🤖', desc: 'L\'intelligence artificielle au service du slip.',  baseCost: 330_000_000,         baseRate: 12_000   },
  { id: 'verger',   name: 'Caleçon du Verger Infâme',  icon: '🌌', desc: 'L\'artefact ultime. Nul ne sait d\'où il vient.',   baseCost: 5_100_000_000,       baseRate: 65_000   },
  { id: 'quantique',name: 'Laboratoire Quantique',      icon: '⚛️', desc: 'Des caleçons fabriqués en superposition d\'états.', baseCost: 75_000_000_000,      baseRate: 320_000  },
  { id: 'etoile',   name: 'Étoile à Caleçons',         icon: '⭐', desc: 'Une étoile transformée en usine textile cosmique.', baseCost: 1_300_000_000_000,   baseRate: 1_800_000},
  { id: 'bigslip',  name: 'Le Grand Slip',              icon: '💥', desc: 'L\'événement fondateur de l\'univers.',             baseCost: 25_000_000_000_000,  baseRate: 10_000_000},
  { id: 'multivers',name: 'Multivers du Caleçon',       icon: '🌀', desc: 'Chaque univers parallèle produit des caleçons.',    baseCost: 500_000_000_000_000, baseRate: 60_000_000},
];

export const UPGRADES: Upgrade[] = [
  // Click
  { id: 'u_click1', name: 'Dé à coudre renforcé',         icon: '🪡', desc: '×2 par clic',          cost: 100,                  clickMult: 2,  req: () => s().totalSocks >= 50 },
  { id: 'u_click2', name: 'Fil élastique magique',         icon: '✨', desc: '×3 par clic',          cost: 5_000,                clickMult: 3,  req: () => s().totalSocks >= 2_000 },
  { id: 'u_click3', name: 'Couture quantique',             icon: '⚛️', desc: '×5 par clic',          cost: 500_000,              clickMult: 5,  req: () => s().totalSocks >= 100_000 },
  { id: 'u_click4', name: 'Doigts de fée',                icon: '🧚', desc: '×10 par clic',         cost: 50_000_000,           clickMult: 10, req: () => s().totalSocks >= 10_000_000 },
  { id: 'u_click5', name: 'Clic cosmique',                 icon: '🌠', desc: '×20 par clic',         cost: 5_000_000_000,        clickMult: 20, req: () => s().totalSocks >= 1_000_000_000 },
  { id: 'u_click6', name: 'Cyborg du Caleçon',             icon: '🦾', desc: '×30 par clic',         cost: 500_000_000_000,      clickMult: 30, req: () => s().totalSocks >= 100_000_000_000 },
  { id: 'u_click7', name: 'Transcendance du Clic',         icon: '🌌', desc: '×50 par clic',         cost: 100_000_000_000_000,  clickMult: 50, req: () => s().totalSocks >= 10_000_000_000_000 },
  // Hands
  { id: 'u_hands1', name: 'Gants en latex',                icon: '🧤', desc: 'Mains ×2',  cost: 200,                buildingId: 'hands', buildingMult: 2, req: () => (s().buildings.hands||0) >= 5 },
  { id: 'u_hands2', name: 'Technique orientale',           icon: '🥋', desc: 'Mains ×3',  cost: 8_000,              buildingId: 'hands', buildingMult: 3, req: () => (s().buildings.hands||0) >= 25 },
  { id: 'u_hands3', name: 'Main bionique',                 icon: '🦾', desc: 'Mains ×4',  cost: 300_000,            buildingId: 'hands', buildingMult: 4, req: () => (s().buildings.hands||0) >= 50 },
  { id: 'u_hands4', name: 'Mains de Titan',                icon: '🤲', desc: 'Mains ×5',  cost: 5_000_000_000_000,  buildingId: 'hands', buildingMult: 5, req: () => (s().buildings.hands||0) >= 100 },
  // Tailor
  { id: 'u_tailor1',name: 'Lunettes bifocales',            icon: '👓', desc: 'Tailleurs ×2', cost: 1_000,           buildingId: 'tailor', buildingMult: 2, req: () => (s().buildings.tailor||0) >= 5 },
  { id: 'u_tailor2',name: 'Patron breveté',                icon: '📐', desc: 'Tailleurs ×3', cost: 40_000,          buildingId: 'tailor', buildingMult: 3, req: () => (s().buildings.tailor||0) >= 25 },
  { id: 'u_tailor3',name: 'Mannequin IA',                  icon: '🪆', desc: 'Tailleurs ×4', cost: 1_500_000,       buildingId: 'tailor', buildingMult: 4, req: () => (s().buildings.tailor||0) >= 50 },
  { id: 'u_tailor4',name: 'Maître Tailleur Divin',         icon: '✂️', desc: 'Tailleurs ×5', cost: 30_000_000_000_000, buildingId: 'tailor', buildingMult: 5, req: () => (s().buildings.tailor||0) >= 100 },
  // Atelier
  { id: 'u_atelier1',name: 'Outils premium',              icon: '🔨', desc: 'Ateliers ×2', cost: 12_000,           buildingId: 'atelier', buildingMult: 2, req: () => (s().buildings.atelier||0) >= 5 },
  { id: 'u_atelier2',name: 'Plan 3D',                      icon: '🗺️', desc: 'Ateliers ×3', cost: 200_000,          buildingId: 'atelier', buildingMult: 3, req: () => (s().buildings.atelier||0) >= 25 },
  { id: 'u_atelier3',name: 'Atelier connecté',             icon: '📡', desc: 'Ateliers ×4', cost: 8_000_000,        buildingId: 'atelier', buildingMult: 4, req: () => (s().buildings.atelier||0) >= 50 },
  // Machine
  { id: 'u_machine1',name: 'Huile de graissage',           icon: '🛢️', desc: 'Machines ×2', cost: 130_000,          buildingId: 'machine', buildingMult: 2, req: () => (s().buildings.machine||0) >= 5 },
  { id: 'u_machine2',name: 'Turbocompresseur',             icon: '⚡', desc: 'Machines ×3', cost: 3_000_000,        buildingId: 'machine', buildingMult: 3, req: () => (s().buildings.machine||0) >= 25 },
  { id: 'u_machine3',name: 'Antigravité',                  icon: '🔮', desc: 'Machines ×4', cost: 90_000_000,       buildingId: 'machine', buildingMult: 4, req: () => (s().buildings.machine||0) >= 50 },
  { id: 'u_machine4',name: 'Réacteur à Slip',              icon: '☢️', desc: 'Machines ×5', cost: 500_000_000_000_000, buildingId: 'machine', buildingMult: 5, req: () => (s().buildings.machine||0) >= 100 },
  // Factory
  { id: 'u_factory1',name: 'Chaîne automatisée',           icon: '🔄', desc: 'Usines ×2', cost: 1_400_000,          buildingId: 'factory', buildingMult: 2, req: () => (s().buildings.factory||0) >= 5 },
  { id: 'u_factory2',name: 'Robots soudeurs',              icon: '🤖', desc: 'Usines ×3', cost: 40_000_000,         buildingId: 'factory', buildingMult: 3, req: () => (s().buildings.factory||0) >= 25 },
  { id: 'u_factory3',name: 'Nano-fabrication',             icon: '🧬', desc: 'Usines ×4', cost: 1_200_000_000,      buildingId: 'factory', buildingMult: 4, req: () => (s().buildings.factory||0) >= 50 },
  { id: 'u_factory4',name: 'Méga-Usine Orbitale',          icon: '🛸', desc: 'Usines ×5', cost: 10_000_000_000_000_000, buildingId: 'factory', buildingMult: 5, req: () => (s().buildings.factory||0) >= 100 },
  // Cotton
  { id: 'u_cotton1', name: 'Irrigation avancée',           icon: '💧', desc: 'Champs ×2', cost: 18_000_000,         buildingId: 'cotton', buildingMult: 2, req: () => (s().buildings.cotton||0) >= 5 },
  { id: 'u_cotton2', name: 'OGM du slip',                  icon: '🌱', desc: 'Champs ×3', cost: 500_000_000,        buildingId: 'cotton', buildingMult: 3, req: () => (s().buildings.cotton||0) >= 25 },
  // Fashion
  { id: 'u_fashion1',name: 'Défilé de mode',               icon: '💃', desc: 'Maisons ×2', cost: 250_000_000,       buildingId: 'fashion', buildingMult: 2, req: () => (s().buildings.fashion||0) >= 5 },
  { id: 'u_fashion2',name: 'Couverture Vogue',             icon: '📸', desc: 'Maisons ×3', cost: 8_000_000_000,     buildingId: 'fashion', buildingMult: 3, req: () => (s().buildings.fashion||0) >= 25 },
  // AI
  { id: 'u_ai1',     name: 'GPU Caleçonnique',             icon: '💾', desc: 'IA ×2', cost: 4_000_000_000,          buildingId: 'ai', buildingMult: 2, req: () => (s().buildings.ai||0) >= 5 },
  { id: 'u_ai2',     name: 'Singularité slip',             icon: '🌀', desc: 'IA ×3', cost: 100_000_000_000,        buildingId: 'ai', buildingMult: 3, req: () => (s().buildings.ai||0) >= 25 },
  // Verger
  { id: 'u_verger1', name: 'Almanach du Verger',           icon: '📜', desc: 'Verger ×2', cost: 80_000_000_000,     buildingId: 'verger', buildingMult: 2, req: () => (s().buildings.verger||0) >= 5 },
  { id: 'u_verger2', name: 'Mystère du Verger',            icon: '🔯', desc: 'Verger ×3', cost: 2_000_000_000_000,  buildingId: 'verger', buildingMult: 3, req: () => (s().buildings.verger||0) >= 25 },
  // Quantique
  { id: 'u_quantique1',name: 'Qubit de Slip',              icon: '🔬', desc: 'Quantique ×2', cost: 1_100_000_000_000,   buildingId: 'quantique', buildingMult: 2, req: () => (s().buildings.quantique||0) >= 5 },
  { id: 'u_quantique2',name: 'Enchevêtrement Caleçoné',    icon: '🌐', desc: 'Quantique ×3', cost: 30_000_000_000_000,  buildingId: 'quantique', buildingMult: 3, req: () => (s().buildings.quantique||0) >= 25 },
  // Etoile
  { id: 'u_etoile1', name: 'Fusion Stellaire',             icon: '☀️', desc: 'Étoiles ×2', cost: 20_000_000_000_000,   buildingId: 'etoile', buildingMult: 2, req: () => (s().buildings.etoile||0) >= 5 },
  { id: 'u_etoile2', name: 'Supernova du Caleçon',         icon: '💫', desc: 'Étoiles ×3', cost: 500_000_000_000_000,  buildingId: 'etoile', buildingMult: 3, req: () => (s().buildings.etoile||0) >= 25 },
  // BigSlip
  { id: 'u_bigslip1',name: 'Expansion Textile',            icon: '🌠', desc: 'Grand Slip ×2', cost: 400_000_000_000_000,     buildingId: 'bigslip', buildingMult: 2, req: () => (s().buildings.bigslip||0) >= 5 },
  { id: 'u_bigslip2',name: 'Théorie des Cordes (du Slip)', icon: '〰️', desc: 'Grand Slip ×3', cost: 10_000_000_000_000_000,  buildingId: 'bigslip', buildingMult: 3, req: () => (s().buildings.bigslip||0) >= 25 },
  // Multivers
  { id: 'u_multivers1',name: 'Slips Parallèles',           icon: '♾️', desc: 'Multivers ×2', cost: 8_000_000_000_000_000,   buildingId: 'multivers', buildingMult: 2, req: () => (s().buildings.multivers||0) >= 5 },
  { id: 'u_multivers2',name: 'Convergence Interdimensionnelle', icon: '🔮', desc: 'Multivers ×3', cost: 200_000_000_000_000_000, buildingId: 'multivers', buildingMult: 3, req: () => (s().buildings.multivers||0) >= 25 },
  // Global
  { id: 'u_global1', name: 'Norme ISO Caleçon',            icon: '📋', desc: 'Toute prod. ×1,5', cost: 10_000_000,            globalMult: 1.5, req: () => s().totalSocks >= 5_000_000 },
  { id: 'u_global2', name: 'Label Commerce Équit.',        icon: '🌍', desc: 'Toute prod. ×2',   cost: 500_000_000,           globalMult: 2,   req: () => s().totalSocks >= 100_000_000 },
  { id: 'u_global3', name: 'Monopole Mondial',             icon: '👑', desc: 'Toute prod. ×3',   cost: 50_000_000_000,        globalMult: 3,   req: () => s().totalSocks >= 10_000_000_000 },
  { id: 'u_global4', name: 'Impérialisme du Slip',         icon: '🌐', desc: 'Toute prod. ×5',   cost: 5_000_000_000_000,     globalMult: 5,   req: () => s().totalSocks >= 1_000_000_000_000 },
  { id: 'u_global5', name: 'Domination Cosmique',          icon: '🪐', desc: 'Toute prod. ×8',   cost: 500_000_000_000_000,   globalMult: 8,   req: () => s().totalSocks >= 100_000_000_000_000 },
  { id: 'u_global6', name: 'Transcendance Slip',           icon: '🌟', desc: 'Toute prod. ×15',  cost: 100_000_000_000_000_000, globalMult: 15, req: () => s().totalSocks >= 10_000_000_000_000_000 },
  // Lucky
  { id: 'u_lucky1', name: 'Fil porte-bonheur',             icon: '🍀', desc: 'Clics chanceux ×2 (proba→4%)',  cost: 50_000,           luckyMult: 2, req: () => s().totalSocks >= 20_000 },
  { id: 'u_lucky2', name: 'Caleçon à quatre feuilles',     icon: '🌿', desc: 'Clics chanceux ×3 (proba→6%)',  cost: 5_000_000,        luckyMult: 3, req: () => s().totalSocks >= 2_000_000 },
  { id: 'u_lucky3', name: 'Jackpot du Verger',             icon: '🎰', desc: 'Clics chanceux ×5 (proba→8%)',  cost: 1_000_000_000,    luckyMult: 5, req: () => s().totalSocks >= 500_000_000 },
  { id: 'u_lucky4', name: 'Slip Arc-en-Ciel',              icon: '🌈', desc: 'Clics chanceux ×8 (proba→10%)', cost: 50_000_000_000_000, luckyMult: 8, req: () => s().totalSocks >= 10_000_000_000_000 },
];

export const MILESTONES: Milestone[] = [
  { id: 'm1',  label: '100 caleçons',          req: 100 },
  { id: 'm2',  label: '1 000 caleçons',         req: 1_000 },
  { id: 'm3',  label: '10 000 caleçons',        req: 10_000 },
  { id: 'm4',  label: '100 000 caleçons',       req: 100_000 },
  { id: 'm5',  label: '1 million',              req: 1_000_000 },
  { id: 'm6',  label: '10 millions',            req: 10_000_000 },
  { id: 'm7',  label: '100 millions',           req: 100_000_000 },
  { id: 'm8',  label: '1 milliard',             req: 1_000_000_000 },
  { id: 'm9',  label: '1 trillion',             req: 1_000_000_000_000 },
  { id: 'mb1', label: '10 bâtiments achetés',   req: 0, reqFn: (s) => Object.values(s.buildings).reduce((a,b)=>a+b,0) >= 10 },
  { id: 'mb2', label: '50 bâtiments achetés',   req: 0, reqFn: (s) => Object.values(s.buildings).reduce((a,b)=>a+b,0) >= 50 },
  { id: 'mb3', label: '100 bâtiments achetés',  req: 0, reqFn: (s) => Object.values(s.buildings).reduce((a,b)=>a+b,0) >= 100 },
  { id: 'mb4', label: '250 bâtiments achetés',  req: 0, reqFn: (s) => Object.values(s.buildings).reduce((a,b)=>a+b,0) >= 250 },
  { id: 'md1', label: '5 caleçons collectés',   req: 0, reqFn: (s) => (s.caughtBoxers||[]).length >= 5 },
  { id: 'md2', label: '10 caleçons collectés',  req: 0, reqFn: (s) => (s.caughtBoxers||[]).length >= 10 },
  { id: 'md3', label: '20 caleçons collectés',  req: 0, reqFn: (s) => (s.caughtBoxers||[]).length >= 20 },
  { id: 'md4', label: 'Collection complète 📖', req: 0, reqFn: (s) => (s.caughtBoxers||[]).length >= 30 },
  { id: 'me1', label: '1er bébé élevé 🧬',      req: 0, reqFn: (s) => (s.bredBoxers||[]).length >= 1 },
  { id: 'me2', label: '5 bébés élevés',         req: 0, reqFn: (s) => (s.bredBoxers||[]).length >= 5 },
  { id: 'me3', label: '10 bébés élevés',        req: 0, reqFn: (s) => (s.bredBoxers||[]).length >= 10 },
  { id: 'mp1', label: '1er Prestige ✨',         req: 0, reqFn: (s) => (s.prestigeCount||0) >= 1 },
  { id: 'mp2', label: '5 Prestiges',            req: 0, reqFn: (s) => (s.prestigeCount||0) >= 5 },
];

export const BOXERS: Boxer[] = [
  { id:'bx_coton',    name:'Caleçon Coton',        icon:'🩲', rarity:'common',   lore:'Le classique indémodable. Lavable à 60°.',                                           req:(s)=>s.totalSocks>=1 },
  { id:'bx_slip',     name:'Slip de Sport',         icon:'🏃', rarity:'common',   lore:'Aérodynamique. Approuvé par 3 athlètes amateur.',                                    req:(s)=>s.totalSocks>=50 },
  { id:'bx_rayure',   name:'Caleçon Rayé',          icon:'🦓', rarity:'common',   lore:'Rayures horizontales. Les verticales font paraître grand.',                          req:(s)=>(s.buildings.hands||0)>=5 },
  { id:'bx_flanelle', name:'Caleçon Flanelle',      icon:'🟥', rarity:'common',   lore:'Chaud, doux, légèrement grattant au niveau des hanches.',                            req:(s)=>s.totalSocks>=500 },
  { id:'bx_bambou',   name:'Caleçon Bambou',        icon:'🎋', rarity:'common',   lore:'100% naturel, certifié forêt gérée. Sent légèrement le bambou.',                    req:(s)=>s.totalSocks>=1_500 },
  { id:'bx_tennis',   name:'Slip de Tennis',        icon:'🎾', rarity:'common',   lore:'Court. Efficace. Légèrement transpercé par une raquette.',                           req:(s)=>(s.buildings.tailor||0)>=10 },
  { id:'bx_soie',     name:'Slip en Soie',          icon:'🕊️', rarity:'uncommon', lore:'Réservé aux grandes occasions. Ne pas mettre en machine.',                          req:(s)=>s.totalSocks>=2_000 },
  { id:'bx_imprime',  name:'Caleçon Imprimé',       icon:'🌺', rarity:'uncommon', lore:'Motif floral hawaïen. Acheté en soldes à Hawaï.',                                    req:(s)=>(s.buildings.tailor||0)>=5 },
  { id:'bx_laine',    name:'Caleçon en Laine',      icon:'🐑', rarity:'uncommon', lore:'Tricoté main par Mamie. Gratte mais réchauffe le cœur.',                             req:(s)=>s.totalSocks>=10_000 },
  { id:'bx_denim',    name:'Slip en Jean',          icon:'👖', rarity:'uncommon', lore:'Tendance ou absurde ? Les deux à la fois.',                                          req:(s)=>(s.buildings.atelier||0)>=5 },
  { id:'bx_velours',  name:'Caleçon en Velours',    icon:'🟣', rarity:'uncommon', lore:'Doux comme un nuage. Interdit dans les ascenseurs.',                                  req:(s)=>s.totalSocks>=50_000 },
  { id:'bx_crochet',  name:'Caleçon au Crochet',    icon:'🧶', rarity:'uncommon', lore:'Tricoté au crochet par un influenceur. 10 000 likes. 0 confort.',                    req:(s)=>(s.buildings.atelier||0)>=10 },
  { id:'bx_vintage',  name:'Caleçon Vintage',       icon:'🎞️', rarity:'rare',     lore:'Années 70. Coupes larges, couleurs psychédéliques.',                                 req:(s)=>s.totalSocks>=100_000 },
  { id:'bx_neon',     name:'Slip Néon',             icon:'🌈', rarity:'rare',     lore:'Visible de nuit. Déconseillé en forêt pendant la chasse.',                           req:(s)=>(s.buildings.machine||0)>=10 },
  { id:'bx_cuir',     name:'Slip en Cuir',          icon:'🤘', rarity:'rare',     lore:'Controversé. Interdit dans 14 pays. Populaire dans les 186 autres.',                 req:(s)=>s.totalSocks>=500_000 },
  { id:'bx_sequin',   name:'Caleçon à Sequins',     icon:'✨', rarity:'rare',     lore:'Pour les soirées disco uniquement. Ne pas utiliser en réunion.',                     req:(s)=>(s.buildings.factory||0)>=5 },
  { id:'bx_thermique',name:'Slip Thermique',        icon:'🌡️', rarity:'rare',     lore:'Régule la température corporelle. Breveté. Inutile en été.',                        req:(s)=>s.totalSocks>=2_000_000 },
  { id:'bx_galactique',name:'Slip Galactique',      icon:'🔭', rarity:'rare',     lore:'Observé par Hubble en 2021. La NASA refuse de commenter.',                           req:(s)=>(s.buildings.factory||0)>=10 },
  { id:'bx_tech',     name:'Slip Technologique',    icon:'🔋', rarity:'epic',     lore:'Intègre un capteur biométrique et une batterie interne. Pas de USB-C.',              req:(s)=>s.totalSocks>=5_000_000 },
  { id:'bx_luxe',     name:'Caleçon de Luxe',       icon:'💎', rarity:'epic',     lore:'Cousu à la main à Paris. Livré dans un écrin en bois.',                             req:(s)=>(s.buildings.fashion||0)>=5 },
  { id:'bx_espace',   name:'Slip Spatial',          icon:'🚀', rarity:'epic',     lore:'Porté lors de la mission Apollo 42b. Thermorégulé.',                                 req:(s)=>s.totalSocks>=50_000_000 },
  { id:'bx_ia',       name:'Caleçon IA Génératif',  icon:'🤖', rarity:'epic',     lore:'Designé par l\'IA. Elle a ignoré toutes les contraintes de style.',                  req:(s)=>(s.buildings.ai||0)>=5 },
  { id:'bx_combinaison',name:'Combinaison Quantique',icon:'🧪',rarity:'epic',     lore:'Observe-le et il change de couleur. La mécanique quantique est bizarre.',            req:(s)=>(s.buildings.quantique||0)>=1 },
  { id:'bx_stellaire',name:'Caleçon Stellaire',     icon:'🌠', rarity:'epic',     lore:'Forgé dans le cœur d\'une étoile. Ça explique la chaleur.',                          req:(s)=>(s.buildings.etoile||0)>=1 },
  { id:'bx_golden',   name:'Slip Doré',             icon:'🥇', rarity:'legendary',lore:'Plaqué or 24 carats. Très inconfortable. Très impressionnant.',                      req:(s)=>(s.goldenBoxersCaught||0)>=5 },
  { id:'bx_prestige', name:'Caleçon de Prestige',   icon:'👑', rarity:'legendary',lore:'Accordé aux grands maîtres de la couture. Porte-bonheur certifié.',                  req:(s)=>(s.prestigeCount||0)>=1 },
  { id:'bx_verger',   name:'Caleçon du Verger',     icon:'🌌', rarity:'legendary',lore:'Un artefact millénaire. Frémit au contact du coton bio.',                            req:(s)=>(s.buildings.verger||0)>=1 },
  { id:'bx_cosmique', name:'Slip Cosmique',         icon:'💫', rarity:'legendary',lore:'Né lors du Grand Slip originel. Vibre à la fréquence de l\'univers.',                req:(s)=>(s.buildings.bigslip||0)>=1 },
  { id:'bx_absolu',   name:'Caleçon Absolu',        icon:'♾️', rarity:'legendary',lore:'Il existe dans tous les univers simultanément. Difficile à plier.',                  req:(s)=>(s.buildings.multivers||0)>=1 },
  { id:'bx_omega',    name:'OMÉGA CALEÇON',         icon:'⚡', rarity:'mythic',   lore:'Il était dit qu\'un jour viendrait le caleçon ultime. Ce jour est arrivé.',          req:(s)=>s.allTimeSocks>=1_000_000_000 },
  { id:'bx_trou_noir',name:'Caleçon du Trou Noir',  icon:'🕳️', rarity:'mythic',   lore:'Absorbe la lumière, la matière et les autres caleçons dans un rayon de 3 mètres.', req:(s)=>s.allTimeSocks>=100_000_000_000 },
  { id:'bx_createur', name:'Le Créateur',           icon:'👁️', rarity:'mythic',   lore:'Il existait avant les caleçons. C\'est lui qui a tout commencé.',                   req:(s)=>(s.prestigeCount||0)>=10 },
];

export const BOXER_SECTIONS: BoxerSection[] = [
  { label:'Commun',      rarity:'common' },
  { label:'Peu commun',  rarity:'uncommon' },
  { label:'Rare',        rarity:'rare' },
  { label:'Épique',      rarity:'epic' },
  { label:'Légendaire',  rarity:'legendary' },
  { label:'Mythique',    rarity:'mythic' },
];

export const BABY_RECIPES: BabyRecipe[] = [
  { id:'bb_sportif',      parents:['bx_coton','bx_slip'],        name:'Slip Sportif Pro',        icon:'🏋️', rarity:'uncommon', lore:'Né du coton classique et de l\'athlétisme. Ventilé aux endroits stratégiques.' },
  { id:'bb_sauvage',      parents:['bx_rayure','bx_imprime'],    name:'Caleçon Safari',          icon:'🦁', rarity:'uncommon', lore:'Zèbre rencontre hibiscus hawaïen. La savane est désormais tendance.' },
  { id:'bb_polaire',      parents:['bx_flanelle','bx_laine'],    name:'Caleçon Polaire',         icon:'❄️', rarity:'rare',     lore:'Double épaisseur laine-flanelle. Résiste à −40 °C. Déconseillé l\'été.' },
  { id:'bb_punk',         parents:['bx_cuir','bx_denim'],        name:'Slip Punk',               icon:'🤟', rarity:'rare',     lore:'Jean et cuir. Clouté. Révolté. Surtout, ne pas laver.' },
  { id:'bb_retro',        parents:['bx_vintage','bx_neon'],      name:'Slip Rétrofuturiste',     icon:'🕹️', rarity:'rare',     lore:'Les années 70 rencontrent la discothèque. Chef-d\'œuvre involontaire.' },
  { id:'bb_gala',         parents:['bx_soie','bx_sequin'],       name:'Caleçon de Gala',         icon:'🎭', rarity:'epic',     lore:'Soie et sequins réunis. Pour les galas de sous-vêtements ultra chics.' },
  { id:'bb_cybercouture', parents:['bx_tech','bx_luxe'],         name:'Slip Cyber-Couture',      icon:'💡', rarity:'epic',     lore:'Batterie intégrée et piqûres main. Chargez votre téléphone et votre dignité.' },
  { id:'bb_quantique',    parents:['bx_espace','bx_ia'],         name:'Caleçon Quantique',       icon:'⚛️', rarity:'legendary',lore:'L\'IA a designé un slip spatial quantique. Il existe et n\'existe pas simultanément.' },
  { id:'bb_empire',       parents:['bx_luxe','bx_prestige'],     name:'Caleçon de l\'Empire',    icon:'🏛️', rarity:'legendary',lore:'Luxe absolu et prestige suprême fusionnés. Il porte une petite couronne.' },
  { id:'bb_divin',        parents:['bx_omega','bx_golden'],      name:'Caleçon Divin',           icon:'🌟', rarity:'mythic',   lore:'L\'OMÉGA et l\'Or unis. Ce qui en est né défie toute description humaine.' },
  { id:'bb_ecolo',        parents:['bx_bambou','bx_coton'],      name:'Slip Éco-Responsable',    icon:'♻️', rarity:'uncommon', lore:'Zéro déchet, zéro élastique synthétique. Le slip de la génération verte.' },
  { id:'bb_velvet',       parents:['bx_velours','bx_soie'],      name:'Caleçon Velours Royal',   icon:'👒', rarity:'rare',     lore:'Velours et soie en union sacrée. Réservé aux monarques et aux influenceurs.' },
  { id:'bb_astral',       parents:['bx_stellaire','bx_espace'],  name:'Slip Interstellaire',     icon:'🛸', rarity:'epic',     lore:'Stellaire rencontre spatial. Désormais visible depuis la Station Internationale.' },
  { id:'bb_abyssal',      parents:['bx_trou_noir','bx_omega'],   name:'Caleçon Abyssal',         icon:'🌑', rarity:'mythic',   lore:'Trou noir + OMÉGA = un caleçon qui n\'existe plus vraiment. Mais on le sent.' },
  { id:'bb_infini',       parents:['bx_absolu','bx_cosmique'],   name:'Le Slip Infini',          icon:'🌈', rarity:'mythic',   lore:'Deux légendes fusionnées. Il n\'a ni début ni fin. Sa taille aussi est infinie.' },
];

export const RARITY_BREED_COST: Record<string, number> = {
  common: 500, uncommon: 2000, rare: 20000, epic: 200000, legendary: 2000000, mythic: 50000000,
};

export const NEWS: string[] = [
  '🩲 La production mondiale de caleçons atteint un niveau record — experts perplexes.',
  '📈 Le cours du slip en coton s\'emballe : +340% en une semaine.',
  '👔 Un styliste affirme que le caleçon est "le nouveau chapeau".',
  '🏭 Ouverture de la 1 000e usine textile — le PDG pleure de joie en string.',
  '🌍 ONU : résolution urgente sur la pénurie mondiale d\'élastique.',
  '🤖 Une IA réclame des droits après avoir cousu 10 milliards de caleçons.',
  '🐑 Les moutons refusent de se faire tondre — syndicats ovins en grève.',
  '🌌 Scientifiques : le Caleçon du Verger Infâme détecté à 4 parsecs du Soleil.',
  '💃 Paris Fashion Week dominée par le slip — Le Figaro scandalisé.',
  '🧚 Un luttin syndiqué réclame des pauses entre chaque couture.',
  '🔮 Médium prédit : "Le prochain grand caleçon changera l\'humanité."',
  '📦 La Poste annonce un nouveau service : livraison en slip.',
  '🎰 Casino de Monaco : jackpot remporté en caleçon imprimé léopard.',
  '🌿 Tendance : le caleçon biodynamique — vendu 800€ à Montmartre.',
  '🦾 Homme bionique bat le record de couture : 12 000 caleçons/s.',
  '🏆 Remise des Oscars : meilleur sous-vêtement de l\'année.',
  '⚡ Tempête magnétique — toutes les machines à coudre s\'emballent.',
  '🎵 Hit de l\'été : "Caleçon (feat. DJ Verger Infâme)".',
];

export const STOCKS: Stock[] = [
  { id:'SLIP', name:'Slip Industries',  icon:'🩲', ticker:'SLIP', basePrice:120,  vol:0.018, trend:0,      desc:'Leader mondial du sous-vêtement.' },
  { id:'COTT', name:'CottonCorp',       icon:'🌾', ticker:'COTT', basePrice:75,   vol:0.022, trend:0.0002, desc:'Producteur de coton bio certifié.' },
  { id:'ELST', name:'Élastique & Co',   icon:'🔧', ticker:'ELST', basePrice:200,  vol:0.014, trend:-0.0001,desc:'Monopole mondial de l\'élastique.' },
  { id:'KYMO', name:'Kimono Futures',   icon:'🥋', ticker:'KYMO', basePrice:340,  vol:0.028, trend:0,      desc:'Spéculatif — très volatil.' },
  { id:'OMEG', name:'OMEGA Holdings',   icon:'⚡', ticker:'OMEG', basePrice:1000, vol:0.035, trend:0.0003, desc:'Le titan de la bourse du textile.' },
];

export const ENEMIES: Enemy[] = [
  { name:'Chaussette Sauvage 🧦', icon:'🧦', level:1,  hp:80,  atk:8,  def:4,  color:0x888888, reward:0.5 },
  { name:'String Agressif 🩱',    icon:'🩱', level:3,  hp:120, atk:14, def:6,  color:0xe91e63, reward:1.0 },
  { name:'Collant Maléfique',     icon:'🕷️', level:5,  hp:160, atk:18, def:10, color:0x6a1b9a, reward:1.5 },
  { name:'Jean Rebelle 👖',       icon:'👖', level:8,  hp:220, atk:25, def:14, color:0x1565c0, reward:2.0 },
  { name:'Kimono Furieux 🥋',     icon:'🥋', level:12, hp:300, atk:35, def:20, color:0xe65100, reward:3.0 },
  { name:'OMEGA SLIP ⚡',         icon:'⚡', level:20, hp:500, atk:55, def:30, color:0xffcc02, reward:6.0 },
];

export const PLAYER_MOVES: PlayerMove[] = [
  { name:'Coup de Slip',      icon:'💥', type:'physical', baseDmg:40, acc:0.95, desc:'40 dmg',    statFn:null },
  { name:'Rayure Élastique',  icon:'✨', type:'special',  baseDmg:65, acc:0.85, desc:'65 dmg',    statFn:null },
  { name:'Tissu Renforcé',    icon:'🛡️', type:'status',   baseDmg:0,  acc:1.0,  desc:'+20 DEF',   statFn:(bs) => { bs.playerDef += 20; return '+20 DEF !'; } },
  { name:'Tourbillon Coton',  icon:'🌪️', type:'physical', baseDmg:80, acc:0.75, desc:'80 dmg',    statFn:null },
];

export const ENEMY_MOVES: EnemyMove[] = [
  { name:'Morsure de Tissu',     type:'physical', baseDmg:30 },
  { name:'Attaque Repassée',     type:'special',  baseDmg:50 },
  { name:'Frottement Statique',  type:'physical', baseDmg:20 },
];
