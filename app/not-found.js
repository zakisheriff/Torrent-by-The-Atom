import Link from "next/link";
import styles from "@/app/not-found.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <span className="eyebrow">404</span>
        <h1>That route drifted out of the queue</h1>
        <p>The page you’re looking for doesn’t exist in this workspace, but the dashboard is still online and ready.</p>
        <Link href="/dashboard">Open dashboard</Link>
      </div>
    </main>
  );
}
