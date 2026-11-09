import { Router } from "express";
import movieController from "../controllers/movie.controller.js";
import { optionalAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", optionalAuth, movieController.getMovies)
router.get("/:id/comments", movieController.getComments)
router.post("/:id/comments", optionalAuth, movieController.addComment)
router.post("/:id/likes", optionalAuth, movieController.addLike)
router.delete("/:id/likes", optionalAuth, movieController.removeLike)
router.get("/:id", movieController.getMovieById)

export default router;
