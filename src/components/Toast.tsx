import { useEffect, useState } from 'react';
import styles from './Toast.module.css';

interface Props {
  message: string | null;
}

export default function Toast({ message }: Props) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    setCurrent(message);
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3200);
    return () => clearTimeout(t);
  }, [message]);

  if (!current) return null;

  return (
    <div className={`${styles.toast} ${visible ? styles.show : styles.hide}`} role="status" aria-live="polite">
      {current}
    </div>
  );
}
