import MovieCard from "./MovieCard";

export type Movie = {
  id: number;
  title: string;
  year: number | null;
  image: string;
  likeCount: number;
  commentCount: number;
  liked: boolean;
};

type Props = {
  movies: Movie[];
  onOpenComments: (movie: Movie) => void;
};

export default function MovieList({ movies, onOpenComments }: Props) {
  if (movies.length === 0) return <div className="page-message">Henüz film eklenmemiş.</div>;

  return (
    <ul className="movie-list">
      {movies.map((movie, index) => (
        <MovieCard key={movie.id} movie={movie} index={index} onOpenComments={onOpenComments} />
      ))}
    </ul>
  );
}
