import type { Request, Response } from "express";
import movieService from "../services/movie.service.js";

const validMovieId = (id: number) => Number.isSafeInteger(id) && id > 0;
const validVisitorId = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

class MovieController {
  async getMovies(req: Request, res: Response) {
    const visitorId = typeof req.query.visitorId === "string" ? req.query.visitorId : null;
    const userId = Number.isInteger(res.locals.user?.id) ? res.locals.user.id : null;
    res.json(await movieService.getMovies(visitorId, userId));
  }

  async getMovieById(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (!validMovieId(id)) {
      res.status(400).json({ error: "Geçersiz film numarası." });
      return;
    }
    res.json(await movieService.getMovieById(id));
  }

  async getComments(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (!validMovieId(id)) {
      res.status(400).json({ error: "Geçersiz film numarası." });
      return;
    }
    res.json(await movieService.getComments(id));
  }

  async addComment(req: Request, res: Response) {
    const id = Number(req.params.id);
    const { visitorId, authorName, body } = (req.body ?? {}) as Record<string, unknown>;
    if (!validMovieId(id) || !validVisitorId(visitorId)) {
      res.status(400).json({ error: "Geçersiz film veya ziyaretçi bilgisi." });
      return;
    }
    if (typeof body !== "string" || body.trim().length === 0 || body.trim().length > 1000) {
      res.status(400).json({ error: "Yorum 1 ile 1000 karakter arasında olmalı." });
      return;
    }
    const signedInName = typeof res.locals.user?.name === "string" ? res.locals.user.name : null;
    const name = signedInName ?? (typeof authorName === "string" ? authorName.trim().slice(0, 80) : "");
    const userId = Number.isInteger(res.locals.user?.id) ? res.locals.user.id : null;
    await movieService.addComment(id, visitorId, userId, name || "Misafir", body.trim());
    res.status(201).json({ message: "Yorum eklendi." });
  }

  async addLike(req: Request, res: Response) {
    const id = Number(req.params.id);
    const { visitorId } = (req.body ?? {}) as Record<string, unknown>;
    if (!validMovieId(id) || !validVisitorId(visitorId)) {
      res.status(400).json({ error: "Geçersiz film veya ziyaretçi bilgisi." });
      return;
    }
    const userId = Number.isInteger(res.locals.user?.id) ? res.locals.user.id : null;
    await movieService.addLike(id, visitorId, userId);
    res.status(204).end();
  }

  async removeLike(req: Request, res: Response) {
    const id = Number(req.params.id);
    const { visitorId } = (req.body ?? {}) as Record<string, unknown>;
    if (!validMovieId(id) || !validVisitorId(visitorId)) {
      res.status(400).json({ error: "Geçersiz film veya ziyaretçi bilgisi." });
      return;
    }
    const userId = Number.isInteger(res.locals.user?.id) ? res.locals.user.id : null;
    await movieService.removeLike(id, visitorId, userId);
    res.status(204).end();
  }
}

export default new MovieController();
