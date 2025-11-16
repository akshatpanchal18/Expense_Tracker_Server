import { Router } from "express";
import {
  login,
  logout,
  register,
  validateSession,
} from "../controllers/auth.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/login", login);
router.post("/register", register);

// protected route
router.post("/logout", verifyJwt, logout);
router.get("/session-validation", validateSession);

export default router;
