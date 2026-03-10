import { Router } from "express";
import {
  createExpense,
  deleteExpense,
  deleteReceipt,
  getExpenseById,
  getExpenses,
  getExpenseStats,
  updateExpense,
  uploadReceipt,
} from "../controllers/expenseController";
import { protect } from "../middlewares/authMiddleware";
import { isVerified } from "../middlewares/isVerified";
import receiptUpload from "../middlewares/receiptUploadMiddleware";

const router = Router();

router.use(protect, isVerified);

router.get("/", getExpenses);
router.get("/stats", getExpenseStats);
router.post("/", createExpense);

router.get("/:id", getExpenseById);
router.patch("/:id", updateExpense);
router.delete("/:id", deleteExpense);

router.post("/:id/receipt", receiptUpload.single("file"), uploadReceipt);
router.delete("/:id/receipt", deleteReceipt);

export default router;
