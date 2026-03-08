import express from "express";
import {
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  register,
  resendVerificationEmail,
  resetPassword,
  updateMe,
  verifyEmail,
} from "../controllers/authControllers";
import { protect } from "../middlewares/authMiddleware";
import {
  loginLimiter,
  passwordResetLimiter,
  refreshLimiter,
  registerLimiter,
  verificationLimiter,
} from "../middlewares/rateLimiter";

const router = express.Router();

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/logout", logout);
router.post("/refresh", refreshLimiter, refresh);
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password/:token", passwordResetLimiter, resetPassword);
router.get("/me", protect, me);
router.patch("/me", protect, updateMe);
router.get("/verify-email/:token", verifyEmail);
router.post(
  "/resend-verification",
  verificationLimiter,
  resendVerificationEmail,
);

export default router;
