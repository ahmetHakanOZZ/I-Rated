import { useCallback, useEffect, useState } from "react";
import AccountPanel from "./components/AccountPanel";
import AuthDialog, { type User } from "./components/AuthDialog";
import MovieComments from "./components/MovieComments";
import MovieList, { type Movie } from "./components/MovieList";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL ?? `${window.location.protocol}//${window.location.hostname}:3001`;

function getVisitorId() {
  const key = "i-rated-visitor-id";
  const stored = localStorage.getItem(key);
  if (stored) return stored;

  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

function App() {
  const [visitorId] = useState(getVisitorId);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMovies = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/api/movies?visitorId=${encodeURIComponent(visitorId)}`, { credentials: "include" });
      if (!response.ok) throw new Error("Filmler yüklenemedi.");

      const data: Array<{
        id: number;
        title: string;
        release_year: number | null;
        image_path: string | null;
        like_count: number;
        comment_count: number;
        liked_by_me: number | boolean;
      }> = await response.json();

      setMovies(data.map((movie) => ({
        id: movie.id,
        title: movie.title,
        year: movie.release_year,
        image: movie.image_path ?? "",
        likeCount: Number(movie.like_count),
        commentCount: Number(movie.comment_count),
        liked: Boolean(movie.liked_by_me),
      })));
    } catch {
      setError("Filmler yüklenemedi. Sunucunun ve MySQL bağlantısının çalıştığını kontrol edin.");
    } finally {
      setLoading(false);
    }
  }, [user?.id, visitorId]);

  useEffect(() => {
    void loadMovies();
  }, [loadMovies]);

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/api/auth/me`, { credentials: "include" })
      .then(async (response) => response.ok ? response.json() as Promise<{ user: User }> : null)
      .then((result) => { if (active) setUser(result?.user ?? null); })
      .catch(() => { if (active) setUser(null); });
    return () => { active = false; };
  }, []);

  const logout = async () => {
    await fetch(`${API_URL}/api/auth/logout`, { method: "POST", credentials: "include" }).catch(() => undefined);
    setUser(null);
    setShowPanel(false);
  };

  const handleCommentAdded = (movieId: number) => {
    setMovies((current) => current.map((movie) => movie.id === movieId
      ? { ...movie, commentCount: movie.commentCount + 1 }
      : movie));
    setSelectedMovie((current) => current?.id === movieId
      ? { ...current, commentCount: current.commentCount + 1 }
      : current);
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="I Rated ana sayfa">
          <span className="brand-mark">i</span>
          <span>I<span className="brand-accent">Rated</span></span>
        </a>
        <nav className="header-nav" aria-label="Ana navigasyon">
          <a className="active" href="#movies">Keşfet</a>
          <a href="#movies">Filmler</a>
        </nav>
        <div className="header-account">
          {user ? (
            <button className="account-nav-button" type="button" onClick={() => setShowPanel(true)}>
              <span className="account-avatar">{user.name.slice(0, 1).toUpperCase()}</span>
              <span>{user.name}</span>{user.role === "ADMIN" ? <span className="admin-nav-tag">ADMIN</span> : null}
            </button>
          ) : <button className="login-nav-button" type="button" onClick={() => setAuthMode("login")}>Giriş yap <span aria-hidden="true">↗</span></button>}
        </div>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow"><span /> İZLE · DEĞERLENDİR · PAYLAŞ</p>
            <h1>İyi filmler,<br /><em>iyi sohbetler.</em></h1>
            <p className="hero-description">İzlediklerini keşfet, sevdiğin filmlere kalp bırak ve film üzerine konuşmaya katıl.</p>
            <a className="hero-link" href="#movies">Filmleri keşfet <span aria-hidden="true">↓</span></a>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
            <div className="hero-ticket"><span>FRAME<br />NO. 01</span><strong>★</strong><small>A STORY<br />WORTH SHARING</small></div>
            <div className="hero-spark spark-one">✳</div>
            <div className="hero-spark spark-two">✦</div>
          </div>
          <div className="hero-index"><span>01</span><i /> 03</div>
        </section>

        <section className="catalog-section" id="movies">
          <div className="section-heading">
            <div>
              <p className="eyebrow">TOPLULUĞUN SEÇKİSİ</p>
              <h2>Filmleri keşfet</h2>
            </div>
            <p className="section-caption">Bir film seç, fikrini paylaş.</p>
          </div>

          {loading ? <div className="page-message">Film seçkisi hazırlanıyor...</div> : null}
          {error ? <div className="page-message error-message" role="alert">{error}</div> : null}
          {!loading && !error ? <MovieList movies={movies} onOpenComments={setSelectedMovie} /> : null}
        </section>
      </main>

      <footer className="site-footer"><span>© 2026 I Rated</span><span>Filmler hakkında, film sevenlerle.</span></footer>

      {selectedMovie ? (
        <MovieComments
          movie={selectedMovie}
          visitorId={visitorId}
          signedInName={user?.name ?? null}
          onClose={() => setSelectedMovie(null)}
          onCommentAdded={() => handleCommentAdded(selectedMovie.id)}
        />
      ) : null}
      {authMode ? <AuthDialog mode={authMode} onClose={() => setAuthMode(null)} onSuccess={(nextUser) => { setUser(nextUser); setAuthMode(null); }} /> : null}
      {showPanel && user ? <AccountPanel user={user} visitorId={visitorId} onClose={() => setShowPanel(false)} onLogout={() => void logout()} /> : null}
    </div>
  );
}

export default App;
