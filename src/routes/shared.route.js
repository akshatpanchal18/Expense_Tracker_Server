import { Router } from "express";
import { getCategory } from "../controllers/category.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { createBudget, getBudget } from "../controllers/budget.controller.js";

const router = Router();

router.get("/categories", verifyJwt, getCategory);
router.post("/add-budget", verifyJwt, createBudget);
router.get("/get-budget", verifyJwt, getBudget);

export default router;
