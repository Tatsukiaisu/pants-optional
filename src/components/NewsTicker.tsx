
import { NEWS } from '../data';
import styles from './NewsTicker.module.css';

export default function NewsTicker() {
  const text = NEWS.map((n) => '  ◆  ' + n).join('');
  return (
    <div className={styles.newsTicker}>
      <div className={styles.newsLabel}>📰 ACTU</div>
      <div className={styles.newsContent}>
        <span className={styles.newsText}>{text}</span>
      </div>
    </div>
  );
}
