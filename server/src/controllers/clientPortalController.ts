import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { PortalService } from "../services/portalService";
import { catchAsync } from "../utils/catchAsync";
import { assertCanUseClientPortal } from "../utils/planGuard";

export const enableClientPortal = catchAsync(async (req: AuthRequest, res: Response) => {
  await assertCanUseClientPortal(req.user!.id);
  const client = await PortalService.enablePortal(req.user!.id, req.params.id as string);
  res.status(200).json({ success: true, message: "Portal enabled", client });
});

export const disableClientPortal = catchAsync(async (req: AuthRequest, res: Response) => {
  const client = await PortalService.disablePortal(req.user!.id, req.params.id as string);
  res.status(200).json({ success: true, message: "Portal disabled", client });
});

export const sendPortalMagicLink = catchAsync(async (req: AuthRequest, res: Response) => {
  await PortalService.sendMagicLink(req.user!.id, req.params.id as string);
  res.status(200).json({ success: true, message: "Magic link sent to client" });
});
