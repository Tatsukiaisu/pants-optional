
import styles from './ChangelogModal.module.css';

interface Props { onClose: () => void; }

export default function ChangelogModal({ onClose }: Props) {
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="changelogModalTitle" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer le journal des modifications">✕</button>
        <h2 id="changelogModalTitle">📋 Changelog — Manufacture du Caleçon</h2>

        <div className={styles.version}>
          <div className={styles.versionHeader}>
            <span className={`${styles.vnum} ${styles.current}`}>v1.6.0</span>
            <span className={styles.badge}>ACTUEL</span>
            <span className={styles.date}>28 avril 2026</span>
          </div>
          <ul className={styles.entries}>
            <li><span className={`${styles.tag} ${styles.tagNew}`}>NEW</span>Mini-jeu <strong>Rythme de la Couture</strong> 🎵 — Guitar Hero-style en Three.js, touches A Z E R (AZERTY)</li>
            <li><span className={`${styles.tag} ${styles.tagNew}`}>NEW</span>4 niveaux de difficulté (Facile 85 BPM → Expert 180 BPM) avec charts aléatoires à chaque partie</li>
            <li><span className={`${styles.tag} ${styles.tagNew}`}>NEW</span>Musique procédurale en jeu (basse, mélodie, batterie, reverb) avec contrôle du volume</li>
            <li><span className={`${styles.tag} ${styles.tagNew}`}>NEW</span>Page <strong>Exploits</strong> 🎖️ — 15 trophées répartis sur Combat, Rythme et Bourse</li>
            <li><span className={`${styles.tag} ${styles.tagNew}`}>NEW</span>Statistiques mini-jeux sauvegardées : victoires Combat, meilleur grade &amp; score Rythme, bénéfices Bourse</li>
            <li><span className={`${styles.tag} ${styles.tagImprove}`}>AMÉLIO</span>Partager score inclut désormais les stats des 3 mini-jeux</li>
            <li><span className={`${styles.tag} ${styles.tagFix}`}>FIX</span>Touches AZERTY (A Z E R) correctement détectées dans le jeu Rythme</li>
            <li><span className={`${styles.tag} ${styles.tagFix}`}>FIX</span>Notes du jeu Rythme tombent de haut en bas (sens corrigé)</li>
          </ul>
        </div>

        <div className={styles.version}>
          <div className={styles.versionHeader}>
            <span className={styles.vnum}>v1.5.0</span>
            <span className={styles.date}>28 avril 2026</span>
          </div>
          <ul className={styles.entries}>
            <li><span className={`${styles.tag} ${styles.tagNew}`}>NEW</span>4 nouveaux bâtiments : Laboratoire Quantique ⚛️, Étoile à Caleçons ⭐, Le Grand Slip 💥, Multivers du Caleçon 🌀</li>
            <li><span className={`${styles.tag} ${styles.tagNew}`}>NEW</span>10 nouveaux caleçons à collecter — Caleçondex passe à 30 entrées</li>
            <li><span className={`${styles.tag} ${styles.tagNew}`}>NEW</span>5 nouvelles recettes d'élevage (15 au total), dont 2 mythiques</li>
            <li><span className={`${styles.tag} ${styles.tagNew}`}>NEW</span>Améliorations étendues : clics ×30/×50, chanceux ×8, bâtiments ×5</li>
            <li><span className={`${styles.tag} ${styles.tagNew}`}>NEW</span>2 nouveaux paliers globaux : Domination Cosmique (×8) et Transcendance Slip (×15)</li>
          </ul>
        </div>

        <div className={styles.version}>
          <div className={styles.versionHeader}>
            <span className={styles.vnum}>v1.4.0</span>
            <span className={styles.date}>28 avril 2026</span>
          </div>
          <ul className={styles.entries}>
            <li><span className={`${styles.tag} ${styles.tagNew}`}>NEW</span>Élevage 🧬 — 10 recettes secrètes, généalogie</li>
            <li><span className={`${styles.tag} ${styles.tagNew}`}>NEW</span>Jalons étendus : production (→1T), bâtiments, Caleçondex, élevage, prestiges</li>
            <li><span className={`${styles.tag} ${styles.tagNew}`}>NEW</span>Boutons développeur (+1M / +1Md / +1T)</li>
            <li><span className={`${styles.tag} ${styles.tagFix}`}>FIX</span>Journal d'activité : ordre chronologique corrigé</li>
          </ul>
        </div>

        <div className={styles.version}>
          <div className={styles.versionHeader}>
            <span className={styles.vnum}>v1.3.0</span>
            <span className={styles.date}>28 avril 2026</span>
          </div>
          <ul className={styles.entries}>
            <li><span className={`${styles.tag} ${styles.tagNew}`}>NEW</span>Caleçondex : 20 caleçons à collecter en 6 raretés (commun → mythique)</li>
            <li><span className={`${styles.tag} ${styles.tagNew}`}>NEW</span>Export / import de sauvegarde en JSON</li>
          </ul>
        </div>

        <div className={styles.version}>
          <div className={styles.versionHeader}>
            <span className={styles.vnum}>v1.2.0</span>
            <span className={styles.date}>—</span>
          </div>
          <ul className={styles.entries}>
            <li><span className={`${styles.tag} ${styles.tagNew}`}>NEW</span>Système de combo : cliquer rapidement enchaîne un multiplicateur (×1,5 → ×4)</li>
            <li><span className={`${styles.tag} ${styles.tagNew}`}>NEW</span>Mini-jeu <strong>Caleçon Rush</strong> : attrapez le plus de caleçons en 15 secondes</li>
            <li><span className={`${styles.tag} ${styles.tagEvent}`}>EVENT</span>Événement <strong>Grève Ouvrière</strong> : la production chute de 50%, payez ou attendez</li>
            <li><span className={`${styles.tag} ${styles.tagNew}`}>NEW</span>Changelog et numéro de version</li>
          </ul>
        </div>

        <div className={styles.version}>
          <div className={styles.versionHeader}>
            <span className={styles.vnum}>v1.1.0</span>
            <span className={styles.date}>— sortie précédente</span>
          </div>
          <ul className={styles.entries}>
            <li><span className={`${styles.tag} ${styles.tagNew}`}>NEW</span>9 bâtiments de production (mains → Caleçon du Verger Infâme)</li>
            <li><span className={`${styles.tag} ${styles.tagNew}`}>NEW</span>30+ améliorations de clics, bâtiments et multiplicateurs globaux</li>
            <li><span className={`${styles.tag} ${styles.tagNew}`}>NEW</span>Événement <strong>Caleçon Doré</strong> : rapporte 1 minute de production</li>
            <li><span className={`${styles.tag} ${styles.tagNew}`}>NEW</span>Système de <strong>Prestige</strong> : bonus permanent ×1,5 par prestige</li>
            <li><span className={`${styles.tag} ${styles.tagNew}`}>NEW</span>Achats en masse ×1 / ×10 / ×100</li>
            <li><span className={`${styles.tag} ${styles.tagNew}`}>NEW</span>Gains hors-ligne (jusqu'à 8 heures)</li>
          </ul>
        </div>

        <div className={styles.version}>
          <div className={styles.versionHeader}>
            <span className={styles.vnum}>v1.0.0</span>
            <span className={styles.date}>— première sortie</span>
          </div>
          <ul className={styles.entries}>
            <li><span className={`${styles.tag} ${styles.tagNew}`}>NEW</span>Prototype initial : cliquer pour produire des caleçons</li>
            <li><span className={`${styles.tag} ${styles.tagNew}`}>NEW</span>Clics chanceux 🍀 (×7) avec floaties animés</li>
            <li><span className={`${styles.tag} ${styles.tagNew}`}>NEW</span>Journal d'activité horodaté</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
