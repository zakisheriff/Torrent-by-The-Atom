"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import Toast from "@/components/Toast";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextToast = {
      id,
      title: toast.title || "Update",
      description: toast.description || "",
      variant: toast.variant || "default"
    };

    setToasts((current) => [...current, nextToast]);
    window.setTimeout(() => removeToast(id), 3600);
  }, [removeToast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toastViewport">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
