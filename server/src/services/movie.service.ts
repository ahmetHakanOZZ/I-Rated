import movieRepository from "../repositories/movie.repository.js";

class MovieService {
  getMovies(visitorId: string | null, userId: number | null) {
    return movieRepository.getMovies(visitorId, userId);
  }

  getMovieById(id: number) {
    return movieRepository.getMovieById(id);
  }

  getComments(movieId: number) {
    return movieRepository.getComments(movieId);
  }

  addComment(movieId: number, visitorId: string, userId: number | null, authorName: string, body: string) {
    return movieRepository.addComment(movieId, visitorId, userId, authorName, body);
  }

  addLike(movieId: number, visitorId: string, userId: number | null) {
    return movieRepository.addLike(movieId, visitorId, userId);
  }

  removeLike(movieId: number, visitorId: string, userId: number | null) {
    return movieRepository.removeLike(movieId, visitorId, userId);
  }
}

export default new MovieService();
