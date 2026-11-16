"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import styles from "./studio.module.css";

type User = { subject: string; email?: string };
type Project = { id: string; title: string; currentRevisionId: string | null; createdAt: string; updatedAt: string };
type SessionResponse = { authenticated: boolean; user?: User };
type ProjectsResponse = { projects: Project[] };

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message ?? `Permintaan gagal (${response.status}).`;
    throw new Error(message);
  }
  return payload as T;
}

export default function StudioHome() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const session = await readJson<SessionResponse>(await fetch("/studio-api/auth/session", { cache: "no-store" }));
      if (!session.authenticated || !session.user) {
        setUser(null);
        setProjects([]);
        return;
      }
      setUser(session.user);
      const result = await readJson<ProjectsResponse>(await fetch("/studio-api/api/projects", { cache: "no-store" }));
      setProjects(result.projects);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Terjadi kendala saat memuat Studio.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    setSaving(true);
    setError(null);
    try {
      await readJson(await fetch("/studio-api/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: cleanTitle }),
      }));
      setTitle("");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Proyek belum tersimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    setError(null);
    try {
      const response = await fetch("/studio-api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Keluar belum berhasil. Coba lagi.");
      setUser(null);
      setProjects([]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Keluar belum berhasil.");
    }
  }

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label="Content Studio, halaman utama">
          <span className={styles.brandMark} aria-hidden="true">S</span>
          <span>CONTENT <b>STUDIO</b></span>
        </a>
        {user && <div className={styles.account}><a className={styles.textButton} href="/settings">Pengaturan</a><span>{user.email ?? "Akun terverifikasi"}</span><button className={styles.textButton} onClick={() => void logout()}>Keluar</button></div>}
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>RUANG KERJA VIDEO</p>
        <h1>Mulai dari narasi.<br /><em>Bangun visual yang menjelaskan.</em></h1>
        <p className={styles.lede}>Kelola proyek, susun materi, dan siapkan alur produksi dalam satu ruang privat.</p>
      </section>

      {error && <div className={styles.alert} role="alert"><span>{error}</span><button onClick={() => void load()}>Coba lagi</button></div>}

      {loading ? (
        <section className={styles.panel} aria-live="polite"><div className={styles.spinner} /><p>Memeriksa sesi dan memuat proyek…</p></section>
      ) : !user ? (
        <section className={`${styles.panel} ${styles.signIn}`}>
          <div className={styles.panelIcon} aria-hidden="true">↗</div>
          <div><h2>Masuk ke ruang kerja privat</h2><p>Autentikasi dikelola oleh penyedia identitas yang dikonfigurasi untuk workspace ini.</p></div>
          <a className={styles.primary} href="/studio-api/auth/login">Lanjutkan dengan login aman <span aria-hidden="true">→</span></a>
          <small>Jika login belum disiapkan, minta administrator mengonfigurasi OIDC.</small>
        </section>
      ) : (
        <section className={styles.projects}>
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>WORKSPACE PRIBADI</p><h2>Proyek Anda</h2></div><span className={styles.count}>{projects.length} proyek</span></div>
          <form className={styles.newProject} onSubmit={(event) => void createProject(event)}>
            <label htmlFor="project-title">Buat proyek baru</label>
            <div className={styles.formRow}><input id="project-title" maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Contoh: Penjelasan aliran air" required /><button className={styles.primary} disabled={saving || !title.trim()}>{saving ? "Menyimpan…" : "Buat proyek"}</button></div>
            <small>Nama dapat diubah pada revisi berikutnya.</small>
          </form>
          {projects.length ? (
            <div className={styles.projectGrid}>
              {projects.map((project) => <article className={styles.projectCard} key={project.id}>
                <div className={styles.cardArtwork} aria-hidden="true"><span /><span /><span /></div>
                <div className={styles.cardMeta}><span>PROYEK</span><time dateTime={project.updatedAt}>Diperbarui {new Date(project.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</time></div>
                <h3>{project.title}</h3>
                <p>{project.currentRevisionId ? "Revisi tersedia" : "Belum ada revisi"}</p>
              </article>)}
            </div>
          ) : (
            <div className={styles.empty}><span className={styles.emptyGlyph} aria-hidden="true">＋</span><h3>Belum ada proyek</h3><p>Buat proyek pertama. Materi tetap privat dan tidak diterbitkan otomatis.</p></div>
          )}
        </section>
      )}
      <footer className={styles.footer}><span>CONTENT STUDIO · WORKSPACE PRIVAT</span><span>Ekspor bukan berarti publikasi.</span></footer>
    </main>
  );
}
