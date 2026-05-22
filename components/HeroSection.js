"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTorrents } from "@/components/providers/TorrentProvider";
import styles from "@/components/HeroSection.module.css";

export default function HeroSection() {
  const [magnet, setMagnet] = useState("");
  const router = useRouter();
  const { addTorrent } = useTorrents();
  const inputRef = useRef(null);

  const handleStart = async () => {
    if (!magnet.trim()) return;
    const created = await addTorrent(magnet);

    if (created) {
      setMagnet("");
      router.push(`/torrent/${created.id}`);
    }
  };

  const handleContainerClick = (e) => {
    // Avoid focusing if clicking the button or its children
    if (e.target.tagName !== "BUTTON" && !e.target.closest("button")) {
      inputRef.current?.focus();
    }
  };

  return (
    <section className={styles.hero}>
      <div className={styles.glow} />
      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Paste a magnet link. That’s it.</h1>

        <div className={styles.inputCard} onClick={handleContainerClick}>
          <input
            ref={inputRef}
            value={magnet}
            onChange={(event) => setMagnet(event.target.value)}
            placeholder="Paste magnet:?xt=urn:btih:..."
            autoFocus
          />
          <button onClick={handleStart}>
            Open On Device
            <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>
    </section>
  );
}
