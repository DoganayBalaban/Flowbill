import { Router } from "express";
import {
  createCheckout,
  getSubscriptionStatus,
  openBillingPortal,
} from "../controllers/subscriptionController";
import { protect } from "../middlewares/authMiddleware";

const router = Router();

router.get("/status", protect, getSubscriptionStatus);
router.post("/checkout", protect, createCheckout);
router.post("/portal", protect, openBillingPortal);

export default router;
