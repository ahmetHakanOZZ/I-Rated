import { Router } from "express";
import adminController from "../controllers/admin.controller.js";
import { requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();
router.use(requireAdmin);
router.get("/overview", adminController.overview);
router.get("/users", adminController.users);
router.delete("/comments/:id", adminController.deleteComment);

export default router;
