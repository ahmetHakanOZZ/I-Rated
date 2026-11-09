import type { NextFunction, Request, Response } from "express";
import type { PublicUser } from "../repositories/user.repository.js";
import authService from "../services/auth.service.js";
import { getSessionToken } from "../auth/session-cookie.js";

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getSessionToken(req);
    res.locals.user = token ? await authService.currentUser(token) : null;
    next();
  } catch (error) {
    next(error);
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  await optionalAuth(req, res, (error?: unknown) => {
    if (error) return next(error);
    const user = res.locals.user as PublicUser | null;
    if (!user) {
      res.status(401).json({ error: "Bu işlem için giriş yapmalısınız." });
      return;
    }
    next();
  });
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  await requireAuth(req, res, (error?: unknown) => {
    if (error) return next(error);
    const user = res.locals.user as PublicUser | null;
    if (!user || user.role !== "ADMIN") {
      res.status(403).json({ error: "Bu alan yalnızca yöneticilere açık." });
      return;
    }
    next();
  });
}
