"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "../studio.module.css";

type Readiness = { status: string; auth?: string; database?: string; error?: { code: string; message: string } };

export default function SettingsPage() {
  const [status, setStatus] = useState<"loading" | "ready" | "blocked" | "error">("loading");
  const [message, setMessage] = useState("Memeriksa layanan…");
  useEffect(() => {
    let active = true;
    fetch("/studio-api/health/ready", { cache: "no-store" })
      .then(async (response) => ({ response, body: await response.json() as Readiness }))
      .then(({ response, body }) => {
        if (!active) return;
        if (response.ok) { setStatus("ready"); setMessage("Login dan database siap."); }
        else if (response.status === 503) { setStatus("blocked"); setMessage(body.error?.message ?? "Konfigurasi belum lengkap."); }
        else { setStatus("error"); setMessage("Status layanan belum dapat diperiksa."); }
      })
      .catch(() => { if (active) { setStatus("error"); setMessage("API belum dapat dijangkau. Pastikan layanan lokal berjalan."); } });
    return () => { active = false; };
  }, []);

  const dotStyle = status === "ready" ? styles.ready : status === "error" ? styles.error : "";

  return <main className={styles.shell}>
    <header className={styles.header}><Link className={styles.brand} href="/" aria-label="Kembali ke Content Studio"><span className={styles.brandMark}>S</span><span>CONTENT <b>STUDIO</b></span></Link><Link className={styles.textButton} href="/">Kembali ke proyek</Link></header>
    <section className={styles.hero}><p className={styles.eyebrow}>KONFIGURASI</p><h1>Pengaturan<br /><em>workspace.</em></h1><p className={styles.lede}>Periksa kesiapan layanan privat. Credential penyedia tidak ditampilkan di halaman ini.</p></section>
    <section className={styles.panel} aria-live="polite"><span className={`${styles.statusDot} ${dotStyle}`} aria-hidden="true" /><div><h2>Status layanan</h2><p>{message}</p></div><span className={styles.count}>{status === "ready" ? "SIAP" : status === "loading" ? "MEMERIKSA" : "PERLU TINDAKAN"}</span></section>
    <section className={styles.settingsNote}><h2>Penyedia identitas dan AI</h2><p>OIDC dikonfigurasi oleh administrator melalui environment server. Penyedia AI belum dipilih; kunci API tidak dapat dimasukkan atau dibaca kembali dari UI pada tahap ini.</p><p>Jangan menaruh credential pada URL, naskah, atau log.</p></section>
    <footer className={styles.footer}><span>CONTENT STUDIO · WORKSPACE PRIVAT</span><span>Pengaturan secret write-only belum tersedia.</span></footer>
  </main>;
}
