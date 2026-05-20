import styles from "@/components/GlassCard.module.css";

export default function GlassCard({ className = "", children }) {
  return <div className={`${styles.card} ${className}`.trim()}>{children}</div>;
}
