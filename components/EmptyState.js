import { Inbox } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import styles from "@/components/EmptyState.module.css";

export default function EmptyState({ title, description }) {
  return (
    <GlassCard className={styles.card}>
      <div className={styles.icon}>
        <Inbox size={22} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </GlassCard>
  );
}
