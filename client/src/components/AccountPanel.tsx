import { useCallback, useEffect, useState } from "react";
import type { User } from "./AuthDialog";

const API_URL = import.meta.env.VITE_API_URL ?? `${window.location.protocol}//${window.location.hostname}:3001`;

type FavoriteMovie = { id: number; title: string; release_year: number | null; image_path: string | null };
type UserComment = { id: number; body: string; created_at: string; movie_id: number; movie_title: string };
type AdminComment = { id: number; author_name: string; body: string; created_at: string; movie_title: string; user_id: number | null };
type AdminUser = { id: number; name: string; email: string; role: "USER" | "ADMIN"; created_at: string; comment_count: number; like_count: number };
type Props = { user: User; visitorId: string; onClose: () => void; onLogout: () => void };

export default function AccountPanel({ user, visitorId, onClose, onLogout }: Props) {
  const [likes, setLikes] = useState<FavoriteMovie[]>([]);
  const [comments, setComments] = useState<UserComment[]>([]);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [adminComments, setAdminComments] = useState<AdminComment[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPanel = useCallback(async () => {
    try {
      const dashboardResponse = await fetch(`${API_URL}/api/auth/dashboard?visitorId=${encodeURIComponent(visitorId)}`, { credentials: "include" });
      if (!dashboardResponse.ok) throw new Error("Panel verileri yüklenemedi.");
      const dashboard = await dashboardResponse.json() as { likes: FavoriteMovie[]; comments: UserComment[] };
      setLikes(dashboard.likes);
      setComments(dashboard.comments);

      if (user.role === "ADMIN") {
        const [overviewResponse, usersResponse] = await Promise.all([
          fetch(`${API_URL}/api/admin/overview`, { credentials: "include" }),
          fetch(`${API_URL}/api/admin/users`, { credentials: "include" }),
        ]);
        if (!overviewResponse.ok || !usersResponse.ok) throw new Error("Yönetici verileri yüklenemedi.");
        const overview = await overviewResponse.json() as { stats: Record<string, number>; recentComments: AdminComment[] };
        setStats(overview.stats);
        setAdminComments(overview.recentComments);
        setUsers(await usersResponse.json());
      }
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Panel verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [user.role, visitorId]);

  useEffect(() => { void loadPanel(); }, [loadPanel]);

  const deleteComment = async (commentId: number) => {
    const response = await fetch(`${API_URL}/api/admin/comments/${commentId}`, { method: "DELETE", credentials: "include" });
    if (response.ok) {
      setAdminComments((current) => current.filter((comment) => comment.id !== commentId));
      setStats((current) => current ? { ...current, comments: Math.max(0, current.comments - 1) } : current);
    }
  };

  return (
    <div className="dialog-backdrop account-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="account-title">
        <header className="account-header">
          <div><p className="eyebrow">I RATED · HESAP</p><h2 id="account-title">Merhaba, {user.name}</h2><span className={`role-pill${user.role === "ADMIN" ? " admin-pill" : ""}`}>{user.role === "ADMIN" ? "Yönetici" : "Üye"}</span></div>
          <div className="account-header-actions"><button className="logout-button" type="button" onClick={onLogout}>Çıkış yap</button><button className="dialog-close" type="button" onClick={onClose} aria-label="Paneli kapat">×</button></div>
        </header>

        {loading ? <p className="panel-state">Panel yükleniyor...</p> : null}
        {error ? <p className="panel-state form-error" role="alert">{error}</p> : null}

        {!loading && !error ? (
          <div className="account-content">
            {user.role === "ADMIN" && stats ? (
              <section className="admin-overview">
                <p className="eyebrow">YÖNETİM ÖZETİ</p>
                <div className="admin-stat-grid">
                  <div><strong>{stats.users}</strong><span>Kullanıcı</span></div>
                  <div><strong>{stats.movies}</strong><span>Film</span></div>
                  <div><strong>{stats.likes}</strong><span>Beğeni</span></div>
                  <div><strong>{stats.comments}</strong><span>Yorum</span></div>
                </div>
              </section>
            ) : null}

            {user.role === "ADMIN" ? (
              <section className="admin-users">
                <div className="panel-section-heading"><div><p className="eyebrow">TOPLULUK</p><h3>Kullanıcılar</h3></div><span>{users.length} hesap</span></div>
                <div className="user-table-wrap"><table><thead><tr><th>Kullanıcı</th><th>E-posta</th><th>Rol</th><th>Katkı</th></tr></thead><tbody>
                  {users.map((account) => <tr key={account.id}><td>{account.name}</td><td>{account.email}</td><td><span className={`role-pill${account.role === "ADMIN" ? " admin-pill" : ""}`}>{account.role === "ADMIN" ? "Admin" : "Üye"}</span></td><td>{account.comment_count} yorum · {account.like_count} beğeni</td></tr>)}
                </tbody></table></div>
              </section>
            ) : null}

            {user.role === "ADMIN" ? (
              <section className="admin-moderation">
                <div className="panel-section-heading"><div><p className="eyebrow">MODERASYON</p><h3>Son yorumlar</h3></div><span>Son 50</span></div>
                {adminComments.length ? adminComments.map((comment) => <article className="moderation-item" key={comment.id}><div><strong>{comment.author_name}</strong><span>{comment.movie_title}</span><p>{comment.body}</p></div><button type="button" onClick={() => void deleteComment(comment.id)}>Yorumu kaldır</button></article>) : <p className="panel-empty">Henüz yorum yok.</p>}
              </section>
            ) : null}

            <section className="account-likes">
              <div className="panel-section-heading"><div><p className="eyebrow">KÜTÜPHANEM</p><h3>Beğendiğim filmler</h3></div><span>{likes.length} film</span></div>
              {likes.length ? <div className="favorite-grid">{likes.map((movie) => <article className="favorite-item" key={movie.id}><img src={movie.image_path ?? ""} alt="" /><div><strong>{movie.title}</strong><span>{movie.release_year ?? "—"}</span></div></article>)}</div> : <p className="panel-empty">Beğendiğin filmler burada görünecek.</p>}
            </section>

            <section className="account-comments">
              <div className="panel-section-heading"><div><p className="eyebrow">SOHBETLERİM</p><h3>Yorumlarım</h3></div><span>{comments.length} yorum</span></div>
              {comments.length ? comments.map((comment) => <article className="my-comment" key={comment.id}><strong>{comment.movie_title}</strong><p>{comment.body}</p><time>{new Date(comment.created_at).toLocaleDateString("tr-TR")}</time></article>) : <p className="panel-empty">Yaptığın yorumlar burada görünecek.</p>}
            </section>
          </div>
        ) : null}
      </section>
    </div>
  );
}
