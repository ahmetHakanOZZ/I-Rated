import { useState, type CSSProperties } from "react";
import type { Movie } from "./MovieList";

const API_URL = import.meta.env.VITE_API_URL ?? `${window.location.protocol}//${window.location.hostname}:3001`;

type Props = {
  movie: Movie;
  index: number;
  onOpenComments: (movie: Movie) => void;
};

export default function MovieCard({ movie, index, onOpenComments }: Props) {
  const [liked, setLiked] = useState(movie.liked);
  const [likeCount, setLikeCount] = useState(movie.likeCount);
  const [savingLike, setSavingLike] = useState(false);

  const toggleLike = async () => {
    if (savingLike) return;
    setSavingLike(true);
    const visitorId = localStorage.getItem("i-rated-visitor-id");

    try {
      const response = await fetch(`${API_URL}/api/movies/${movie.id}/likes`, {
        method: liked ? "DELETE" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId }),
      });
      if (!response.ok) throw new Error("Beğeni kaydedilemedi.");
      setLiked(!liked);
      setLikeCount((count) => count + (liked ? -1 : 1));
    } catch {
      // Keep the current count when the API request fails.
    } finally {
      setSavingLike(false);
    }
  };

  return (
    <li className="movie-card" style={{ "--card-index": index } as CSSProperties}>
      <div className="poster-frame">
        <img className="movie-poster" src={movie.image} alt={`${movie.title} kapak görseli`} loading="lazy" />
        <span className="poster-year">{movie.year ?? "—"}</span>
      </div>
      <div className="movie-card-content">
        <h3 className="movie-title" title={movie.title}>{movie.title}</h3>
        <div className="movie-actions">
          <button
            className={`social-action like-action${liked ? " is-liked" : ""}`}
            type="button"
            aria-label={liked ? `Beğeniyi geri al, ${likeCount} beğeni` : `Filmi beğen, ${likeCount} beğeni`}
            aria-pressed={liked}
            disabled={savingLike}
            onClick={() => void toggleLike()}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.8c0 5.2-8.8 10.1-8.8 10.1S3.2 14 3.2 8.8A4.3 4.3 0 0 1 12 6.5a4.3 4.3 0 0 1 8.8 2.3Z" /></svg>
            <span>{likeCount}</span>
          </button>
          <button
            className="social-action comment-action"
            type="button"
            aria-label={`${movie.commentCount} yorumu gör`}
            onClick={() => onOpenComments(movie)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-9.5A7.5 7.5 0 0 1 10.5 4h2A7.5 7.5 0 0 1 20 11.5Z" /><path d="M8 11h8M8 14h5" /></svg>
            <span>{movie.commentCount}</span>
          </button>
        </div>
      </div>
    </li>
  );
}
