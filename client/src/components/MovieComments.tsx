import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Movie } from "./MovieList";

const API_URL = import.meta.env.VITE_API_URL ?? `${window.location.protocol}//${window.location.hostname}:3001`;

type Comment = {
  id: number;
  author_name: string;
  body: string;
  created_at: string;
};

type Props = {
  movie: Movie;
  visitorId: string;
  signedInName?: string | null;
  onClose: () => void;
  onCommentAdded: () => void;
};

export default function MovieComments({ movie, visitorId, signedInName = null, onClose, onCommentAdded }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [authorName, setAuthorName] = useState(signedInName ?? "Misafir");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/movies/${movie.id}/comments`, { credentials: "include" });
      if (!response.ok) throw new Error("Yorumlar yüklenemedi.");
      setComments(await response.json());
      setError(null);
    } catch {
      setError("Yorumlar yüklenemedi. Biraz sonra tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [movie.id]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!body.trim() || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/movies/${movie.id}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, authorName, body }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(result?.error ?? "Yorum gönderilemedi.");
      }
      setBody("");
      onCommentAdded();
      await loadComments();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Yorum gönderilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="comments-dialog" role="dialog" aria-modal="true" aria-labelledby="comments-title">
        <div className="dialog-header">
          <div>
            <p className="eyebrow">İZLEYİCİ NOTLARI</p>
            <h2 id="comments-title">{movie.title}</h2>
          </div>
          <button className="dialog-close" type="button" onClick={onClose} aria-label="Yorumları kapat">×</button>
        </div>

        <div className="comments-list" aria-live="polite">
          {loading ? <p className="comments-empty">Yorumlar yükleniyor...</p> : null}
          {!loading && comments.length === 0 ? <p className="comments-empty">İlk yorumu sen bırak.</p> : null}
          {comments.map((comment) => (
            <article className="comment-item" key={comment.id}>
              <div className="comment-avatar" aria-hidden="true">{comment.author_name.slice(0, 1).toUpperCase()}</div>
              <div className="comment-copy">
                <div className="comment-byline"><strong>{comment.author_name}</strong><time>{new Date(comment.created_at).toLocaleDateString("tr-TR")}</time></div>
                <p>{comment.body}</p>
              </div>
            </article>
          ))}
        </div>

        <form className="comment-form" onSubmit={(event) => void submitComment(event)}>
          <label htmlFor="comment-author">Adın</label>
          <input id="comment-author" maxLength={80} value={signedInName ?? authorName} onChange={(event) => setAuthorName(event.target.value)} disabled={Boolean(signedInName)} />
          <label htmlFor="comment-body">Yorumun</label>
          <textarea id="comment-body" maxLength={1000} rows={3} placeholder="Bu film sende ne hissettirdi?" value={body} onChange={(event) => setBody(event.target.value)} required />
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <div className="comment-form-footer"><span>{body.length}/1000</span><button type="submit" disabled={submitting || !body.trim()}>{submitting ? "Gönderiliyor..." : "Yorumu paylaş"}</button></div>
        </form>
      </section>
    </div>
  );
}
