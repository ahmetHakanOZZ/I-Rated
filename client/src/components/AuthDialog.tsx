import { useState, type FormEvent } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? `${window.location.protocol}//${window.location.hostname}:3001`;

export type User = { id: number; name: string; email: string; role: "USER" | "ADMIN" };
type Props = { mode: "login" | "register"; onClose: () => void; onSuccess: (user: User) => void };

export default function AuthDialog({ mode: initialMode, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/auth/${mode}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, visitorId: localStorage.getItem("i-rated-visitor-id") }),
      });
      const result = await response.json() as { user?: User; error?: string };
      if (!response.ok || !result.user) throw new Error(result.error ?? "İşlem tamamlanamadı.");
      onSuccess(result.user);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Sunucuya bağlanılamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="dialog-close auth-close" type="button" onClick={onClose} aria-label="Kapat">×</button>
        <span className="brand-mark auth-mark">i</span>
        <p className="eyebrow">I RATED HESABI</p>
        <h2 id="auth-title">{mode === "login" ? "Tekrar hoş geldin." : "Aramıza katıl."}</h2>
        <p className="auth-intro">{mode === "login" ? "Film sohbetine kaldığın yerden devam et." : "Filmleri kaydet, yorumlarını ve beğenilerini takip et."}</p>
        <form className="auth-form" onSubmit={(event) => void submit(event)}>
          {mode === "register" ? <label>Kullanıcı adı<input autoComplete="username" minLength={2} maxLength={50} value={name} onChange={(event) => setName(event.target.value)} required /></label> : null}
          <label>E-posta<input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Şifre<input autoComplete={mode === "login" ? "current-password" : "new-password"} type="password" minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {mode === "register" ? <p className="password-hint">Şifre en az 10 karakter olmalı.</p> : null}
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="auth-submit" type="submit" disabled={loading}>{loading ? "Bekleyin..." : mode === "login" ? "Giriş yap" : "Hesap oluştur"}</button>
        </form>
        <p className="auth-switch">
          {mode === "login" ? "Hesabın yok mu?" : "Zaten hesabın var mı?"}{" "}
          <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}>
            {mode === "login" ? "Kayıt ol" : "Giriş yap"}
          </button>
        </p>
      </section>
    </div>
  );
}
