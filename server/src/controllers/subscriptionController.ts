import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { SubscriptionService } from "../services/subscriptionService";
import { catchAsync } from "../utils/catchAsync";

export const createCheckout = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { variantId } = req.body;

    const url = await SubscriptionService.createCheckoutSession(userId, variantId);

    return res.status(200).json({ success: true, url });
  },
);

export const openBillingPortal = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const url = await SubscriptionService.createBillingPortalSession(userId);

    return res.status(200).json({ success: true, url });
  },
);

export const getSubscriptionStatus = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const data = await SubscriptionService.getStatus(userId);

    return res.status(200).json({ success: true, data });
  },
);
