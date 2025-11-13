import { Router } from "express";
import passport from "passport";
import { storage } from "../storage";
import { hashPassword } from "../auth";
import { validateRequest } from "../utils/validation";
import { loginSchema, registerApiSchema } from "@shared/schema";
import { sanitizeUser } from "../utils/user";

const router = Router();

router.post("/register", validateRequest(registerApiSchema), async (req, res, next) => {
  try {
    const userData = req.body;
    
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const existingEmail = await storage.getUserByEmail(userData.email);
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await hashPassword(userData.password);
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword,
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(sanitizeUser(user));
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", validateRequest(loginSchema), (req, res, next) => {
  passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: info?.message || "Invalid credentials" });
    }
    
    req.login(user, (err) => {
      if (err) return next(err);
      res.status(200).json(sanitizeUser(user));
    });
  })(req, res, next);
});

router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.sendStatus(200);
  });
});

router.get("/user", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.sendStatus(401);
  }
  res.json(sanitizeUser(req.user!));
});

export default router;
