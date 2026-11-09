import type { Request, Response } from "express";
import authService from "../services/auth.service.js";

class AdminController {
  async overview(_req: Request, res: Response) {
    res.json(await authService.getAdminOverview());
  }

  async users(_req: Request, res: Response) {
    res.json(await authService.listUsers());
  }

  async deleteComment(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      res.status(400).json({ error: "Geçersiz yorum numarası." });
      return;
    }
    const deleted = await authService.deleteComment(id);
    if (!deleted) {
      res.status(404).json({ error: "Yorum bulunamadı." });
      return;
    }
    res.status(204).end();
  }
}

export default new AdminController();
