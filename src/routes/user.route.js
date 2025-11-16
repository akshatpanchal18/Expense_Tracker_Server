import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getStats } from "../controllers/expense.controller.js";

const router = Router();

router.get("/get-stats", verifyJwt, getStats);
export default router;
