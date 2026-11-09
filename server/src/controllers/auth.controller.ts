import type { Request, Response } from "express";
import authService from "../services/auth.service.js";
import { clearSessionCookie, getSessionToken, setSessionCookie } from "../auth/session-cookie.js";

const visitorIdOrNull = (value: unknown) => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;

class AuthController {
  async register(req: Request, res: Response) {
    const { name, email, password, visitorId } = (req.body ?? {}) as Record<string, unknown>;
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 50) {
      res.status(400).json({ error: "Kullanıcı adı 2 ile 50 karakter arasında olmalı." });
      return;
    }
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: "Geçerli bir e-posta adresi girin." });
      return;
    }
    if (typeof password !== "string" || password.length < 10 || password.length > 128) {
      res.status(400).json({ error: "Şifre en az 10, en fazla 128 karakter olmalı." });
      return;
    }

    try {
      const session = await authService.register(name, email, password, visitorIdOrNull(visitorId));
      setSessionCookie(res, session.token);
      res.status(201).json({ user: session.user });
    } catch (error) {
      if (error instanceof Error && error.message === "EMAIL_IN_USE") {
        res.status(409).json({ error: "Bu e-posta adresi zaten kayıtlı." });
        return;
      }
      throw error;
    }
  }

  async login(req: Request, res: Response) {
    const { email, password, visitorId } = (req.body ?? {}) as Record<string, unknown>;
    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "E-posta ve şifre gerekli." });
      return;
    }
    const session = await authService.login(email, password, visitorIdOrNull(visitorId));
    if (!session) {
      res.status(401).json({ error: "E-posta veya şifre hatalı." });
      return;
    }
    setSessionCookie(res, session.token);
    res.json({ user: session.user });
  }

  async logout(req: Request, res: Response) {
    const token = getSessionToken(req);
    if (token) await authService.logout(token);
    clearSessionCookie(res);
    res.status(204).end();
  }

  me(req: Request, res: Response) {
    res.json({ user: res.locals.user });
  }

  async dashboard(req: Request, res: Response) {
    const userId = Number(res.locals.user.id);
    res.json(await authService.getDashboard(userId));
  }
}

export default new AuthController();
