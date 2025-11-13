import { Router } from "express";
import { storage } from "../storage";
import { requireAuth, requireRole } from "../utils/validation";
import { sanitizeUser } from "../utils/user";

const router = Router();

router.get("/users", requireRole("admin"), async (req, res, next) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users.map(sanitizeUser));
  } catch (error) {
    next(error);
  }
});

router.get("/users/:id", requireAuth, async (req, res, next) => {
  try {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (req.user?.id !== req.params.id && req.user?.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.json(sanitizeUser(user));
  } catch (error) {
    next(error);
  }
});

export default router;
