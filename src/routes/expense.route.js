import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  createExpense,
  exportExpensesPDF,
  getExpenses,
  getExpenseStatistics,
} from "../controllers/expense.controller.js";

const router = Router();

router.post("/add-expense", verifyJwt, createExpense);
router.get("/get-expense", verifyJwt, getExpenses);
router.get("/get-statistic", verifyJwt, getExpenseStatistics);
router.get("/download-pdf", verifyJwt, exportExpensesPDF);
export default router;
