import { Request, Response } from "express";
import { env } from "../config/env";
import { redis } from "../config/redis";
import { AuthRequest } from "../middlewares/authMiddleware";
import { AuthService } from "../services/authService";
import { AppError } from "../utils/appError";
import { catchAsync } from "../utils/catchAsync";
import { sendEmail } from "../utils/email";
import { setTokenCookies } from "../utils/setTokenCookies";
import {
  loginUserSchema,
  registerUserSchema,
  resetPasswordSchema,
  updateMeSchema,
} from "../validators/userSchema";

export const register = catchAsync(async (req: Request, res: Response) => {
  const validatedData = registerUserSchema.parse(req.body);

  const { user, accessToken, refreshToken, sessionId, verificationToken } =
    await AuthService.registerUser(validatedData);

  // Send verification email
  const verificationURL = `${env.FRONTEND_URL}/verify-email/${verificationToken}`;
  const emailHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
      <h2>Hesabınızı Doğrulayın</h2>
      <p>Merhaba ${user.first_name || "Kullanıcı"},</p>
      <p>Hesabınızı aktifleştirmek için aşağıdaki butona tıklayın:</p>
      <a href="${verificationURL}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Hesabımı Doğrula</a>
      <p>Bu bağlantı 24 saat içinde geçerliliğini yitirecektir.</p>
      <p>Eğer bu hesabı siz oluşturmadıysanız, bu e-postayı dikkate almayın.</p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: "Hesabınızı Doğrulayın",
    html: emailHtml,
  });

  setTokenCookies(res, accessToken, refreshToken, sessionId);

  res.status(201).json({
    status: "success",
    message:
      "User created successfully. Please check your email to verify your account.",
    user: { id: user.id, email: user.email },
  });
});
export const login = catchAsync(async (req: Request, res: Response) => {
  const validatedData = loginUserSchema.parse(req.body);

  const { user, accessToken, refreshToken, sessionId } =
    await AuthService.loginUser(validatedData);

  setTokenCookies(res, accessToken, refreshToken, sessionId);

  res.status(200).json({
    status: "success",
    message: "User logged in successfully",
    user: { id: user.id, email: user.email },
  });
});
export const logout = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  const sessionId = req.cookies?.sid;

  if (refreshToken) {
    await AuthService.logoutUser(refreshToken);
  }
  if (sessionId) {
    await redis.del(`sess:${sessionId}`);
  }

  const isProd = env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? "none" : "lax") as any,
  };

  res.clearCookie("refreshToken", cookieOptions);
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("sid", cookieOptions);

  res
    .status(200)
    .json({ status: "success", message: "Logged out successfully" });
});
export const refresh = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  const sessionId = req.cookies?.sid;

  const { accessToken, refreshToken: newRefreshToken } =
    await AuthService.refreshToken(refreshToken);

  setTokenCookies(res, accessToken, newRefreshToken, sessionId);

  res.status(200).json({
    status: "success",
    message: "Token refreshed successfully",
  });
});
export const forgotPassword = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const result = await AuthService.forgotPassword(email, env.FRONTEND_URL);

    if (result.emailSent) {
      const emailHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
      <h2>Şifre Sıfırlama Talebi</h2>
      <p>Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
      <a href="${result.resetURL!}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Şifremi Sıfırla</a>
      <p>Eğer bu talebi siz yapmadıysanız, bu e-postayı dikkate almayın.</p>
      <p>Bu bağlantı 15 dakika içinde geçerliliğini yitirecektir.</p>
    </div>
  `;

      await sendEmail({
        to: result.userEmail!,
        subject: "Şifre Sıfırlama Talebi",
        html: emailHtml,
      });
    }

    // Always return same response to prevent user enumeration
    res.status(200).json({
      status: "success",
      message: "If an account exists, a reset email has been sent",
    });
  },
);
export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.params;
  const validatedData = resetPasswordSchema.parse(req.body);

  if (!token || typeof token !== "string") {
    throw new AppError("Invalid or missing token", 400);
  }

  await AuthService.resetPassword(token, validatedData.password);

  res.status(200).json({
    status: "success",
    message: "Password reset successfully",
  });
});
export const me = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const user = await AuthService.getMe(req.user.id);

  res.status(200).json({
    status: "success",
    user,
  });
});
export const updateMe = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const validatedData = updateMeSchema.parse(req.body);

  const user = await AuthService.updateMe(req.user.id, validatedData);

  res.status(200).json({
    status: "success",
    message: "User updated successfully",
    user,
  });
});
export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.params;

  if (!token || typeof token !== "string") {
    throw new AppError("Invalid or missing token", 400);
  }

  await AuthService.verifyEmail(token);

  res.status(200).json({
    status: "success",
    message: "Email verified successfully",
  });
});
export const deleteAccount = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) throw new AppError("Unauthorized", 401);

  const { password } = req.body;
  if (!password || typeof password !== "string") {
    throw new AppError("Password is required to delete your account", 400);
  }

  const { email } = await AuthService.deleteAccount(req.user.id, password);

  // Send confirmation email (best-effort)
  await sendEmail({
    to: email,
    subject: "Your Flowbill account has been deleted",
    html: `<p>Your account has been permanently deleted. All your data has been removed.</p>`,
  }).catch(() => {});

  // Clear cookies
  const isProd = env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? "none" : "lax") as any,
  };
  res.clearCookie("refreshToken", cookieOptions);
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("sid", cookieOptions);

  res.status(200).json({ status: "success", message: "Account deleted successfully" });
});

export const resendVerificationEmail = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      throw new AppError("Email is required", 400);
    }

    const result = await AuthService.resendVerificationEmail(email);

    if (result.emailSent) {
      const verificationURL = `${env.FRONTEND_URL}/verify-email/${result.verificationToken}`;
      const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h2>Hesabınızı Doğrulayın</h2>
        <p>Doğrulama e-postanızı yeniden gönderdiniz.</p>
        <p>Hesabınızı aktifleştirmek için aşağıdaki butona tıklayın:</p>
        <a href="${verificationURL}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Hesabımı Doğrula</a>
        <p>Bu bağlantı 24 saat içinde geçerliliğini yitirecektir.</p>
      </div>
    `;

      await sendEmail({
        to: result.userEmail!,
        subject: "Hesabınızı Doğrulayın",
        html: emailHtml,
      });
    }

    // Always return success to prevent user enumeration
    res.status(200).json({
      status: "success",
      message:
        "If an unverified account exists, a verification email has been sent",
    });
  },
);
