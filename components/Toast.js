"use client";

import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import styles from "@/components/Toast.module.css";

const icons = {
  default: Info,
  success: CheckCircle2,
  warning: TriangleAlert
};

export default function Toast({ toast, onClose }) {
  const Icon = icons[toast.variant] || icons.default;

  return (
    <div className={styles.toast}>
      <div className={styles.iconWrap}>
        <Icon size={18} />
      </div>
      <div className={styles.copy}>
        <strong>{toast.title}</strong>
        {toast.description ? <p>{toast.description}</p> : null}
      </div>
      <button className={styles.close} onClick={onClose} aria-label="Close toast">
        <X size={16} />
      </button>
    </div>
  );
}
