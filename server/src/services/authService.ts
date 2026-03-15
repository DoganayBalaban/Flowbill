import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { BCRYPT_ROUNDS } from "../config/constants";
import { env } from "../config/env";
import { redis } from "../config/redis";
import { stripe } from "../config/stripe";
import { AppError } from "../utils/appError";
import { cache } from "../utils/cache";
import { prisma } from "../utils/prisma";

export class AuthService {
    static async registerUser(data:{email:string,password:string,firstName:string,lastName:string}){
        const existingUser = await prisma.user.findUnique({
            where:{
                email:data.email
            }
        })
        if(existingUser){
            throw new AppError("User already exists",400)
        }
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(verificationToken).digest("hex");
        const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
        const hashedPassword = await bcrypt.hash(data.password, salt);
        return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          password_hash: hashedPassword,
          first_name: data.firstName,
          last_name: data.lastName,
          verification_token: hashedToken,
          verification_token_expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
        },
      });
      const sessionId = crypto.randomUUID()
      await redis.set(`sess:${sessionId}`,JSON.stringify(user),'EX',86400)

      const { accessToken, refreshToken } = this.generateTokens(user.id);
      await this.saveRefreshToken(tx, user.id, refreshToken);

      return { user, accessToken, refreshToken, sessionId, verificationToken };
    });
    }
    static async loginUser(data:{email:string,password:string}){
        const user = await prisma.user.findFirst({
            where:{
                email:data.email,
                deleted_at:null
            }
        })
        if (!user || !(await bcrypt.compare(data.password, user.password_hash))) {
      throw new AppError("Invalid credentials", 401);
    }
        const { accessToken, refreshToken } = this.generateTokens(user.id);
        await prisma.$transaction(async(tx)=>{
            await tx.refreshToken.updateMany({
                where:{
                    user_id:user.id,
                    revoked_at:null
                },
                data:{
                    revoked_at:new Date()
                }
            }),
            await tx.refreshToken.create({
                data:{
                    user_id:user.id,
                    token:refreshToken,
                    expires_at:new Date(Date.now() + 7*24*60*60*1000)
                }
            })
        })
        const sessionId = crypto.randomUUID()
        await redis.set(`sess:${sessionId}`,JSON.stringify(user),'EX',86400)
        return {user,accessToken,refreshToken,sessionId}
    }
    static generateTokens(userId: string) {
    const accessToken = jwt.sign({ userId }, env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ userId }, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
    return { accessToken, refreshToken };
    }
    static async saveRefreshToken(tx: any, userId: string, token: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await tx.refreshToken.create({
      data: { user_id: userId, token, expires_at: expiresAt },
    });
    }
    static async logoutUser(refreshToken: string) {
    await prisma.refreshToken.updateMany({
      where: {
        token: refreshToken,
        revoked_at: null,
      },
      data: {
        revoked_at: new Date(),
      },
    });
  }
    static async refreshToken(token: string) {
    if (!token) {
      throw new AppError("Refresh token missing", 401);
    }

    const savedToken = await prisma.refreshToken.findUnique({
      where: {
        token,
      },
      include: {
        user: true,
      },
    });

    if (
      !savedToken ||
      savedToken.expires_at < new Date() ||
      savedToken.revoked_at
    ) {
      throw new AppError("Invalid or expired refresh token", 403);
    }

    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as {
      userId: string;
    };

    // Extra security: token userId must match DB user_id
    if (payload.userId !== savedToken.user_id) {
      throw new AppError("Invalid refresh token", 403);
    }

    const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(payload.userId);

    // Refresh Token Rotation: revoke old token and create new one in transaction
    await prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: {
          id: savedToken.id,
        },
        data: {
          revoked_at: new Date(),
        },
      });

      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 7);

      await tx.refreshToken.create({
        data: {
          user_id: payload.userId,
          token: newRefreshToken,
          expires_at: newExpiresAt,
        },
      });
    });

    return { accessToken, refreshToken: newRefreshToken, userId: payload.userId };
  }

  static async forgotPassword(email: string, frontendUrl: string) {
    const user = await prisma.user.findUnique({
      where: {
        email,
        deleted_at: null
      }
    });

    // Always return success to prevent user enumeration
    if (!user) {
      return { emailSent: false };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        password_reset_token: hashedToken,
        password_reset_expires: new Date(Date.now() + 15 * 60 * 1000)
      }
    });

    const resetURL = `${frontendUrl}/reset-password/${resetToken}`;
    
    return { emailSent: true, resetURL, userEmail: user.email };
  }
  static async resetPassword(token: string, password: string) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    
    const user = await prisma.user.findUnique({
      where: {
        password_reset_token: hashedToken,
        password_reset_expires: {
          gte: new Date(),
        },
      },
    });

    if (!user) {
      throw new AppError("Invalid or expired token", 400);
    }

    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Use transaction to update password and revoke tokens atomically
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          password_hash: hashedPassword,
          password_reset_token: null,
          password_reset_expires: null,
        },
      });

      // Revoke all refresh tokens for security
      await tx.refreshToken.updateMany({
        where: { user_id: user.id, revoked_at: null },
        data: { revoked_at: new Date() },
      });
    });

    // Cache invalidation: tüm session'ları temizle
    await cache.deletePattern(`sess:*`);
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        deleted_at: null,
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        avatar_url: true,
        timezone: true,
        currency: true,
        hourly_rate: true,
        plan: true,
        plan_expires_at: true,
        email_verified: true,
        is_onboarding_completed: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  static async updateMe(userId: string, data: {
    first_name?: string;
    last_name?: string;
    timezone?: string;
    currency?: string;
    hourly_rate?: number;
    avatar_url?: string;
    role?: string;
    is_onboarding_completed?: boolean;
  }) {
    const user = await prisma.user.update({
      where: {
        id: userId,
        deleted_at: null,
      },
      data: {
        ...(data.first_name !== undefined && { first_name: data.first_name }),
        ...(data.last_name !== undefined && { last_name: data.last_name }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.hourly_rate !== undefined && { hourly_rate: data.hourly_rate }),
        ...(data.avatar_url !== undefined && { avatar_url: data.avatar_url }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.is_onboarding_completed !== undefined && { is_onboarding_completed: data.is_onboarding_completed }),
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        avatar_url: true,
        timezone: true,
        currency: true,
        hourly_rate: true,
        plan: true,
        plan_expires_at: true,
        email_verified: true,
        is_onboarding_completed: true,
        updated_at: true,
      },
    });

    // Cache invalidation: kullanıcının session cache'ini güncelle
    await cache.deletePattern(`sess:*`);

    return user;
  }

  static async verifyEmail(token: string) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        verification_token: hashedToken,
        verification_token_expires: {
          gte: new Date(),
        },
      },
    });

    if (!user) {
      throw new AppError("Geçersiz veya süresi dolmuş doğrulama linki.", 400);
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        email_verified: true,
        verification_token: null,
        verification_token_expires: null,
      },
    });

    // Cache invalidation: email_verified değiştiği için session cache'i temizle
    await cache.deletePattern(`sess:*`);
  }

  static async resendVerificationEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: {
        email,
        deleted_at: null,
      },
    });

    // Return false if user doesn't exist or is already verified (prevent user enumeration)
    if (!user || user.email_verified) {
      return { emailSent: false };
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(verificationToken).digest("hex");

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        verification_token: hashedToken,
        verification_token_expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    return { emailSent: true, verificationToken, userEmail: user.email };
  }

  static async deleteAccount(userId: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId, deleted_at: null },
    });

    if (!user) throw new AppError("User not found", 404);

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) throw new AppError("Incorrect password", 401);

    // Cancel Stripe subscription if active
    if (user.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(user.stripe_subscription_id);
      } catch {
        // Non-fatal: subscription may already be cancelled
      }
    }

    await prisma.$transaction(async (tx) => {
      // Revoke all refresh tokens
      await tx.refreshToken.updateMany({
        where: { user_id: userId, revoked_at: null },
        data: { revoked_at: new Date() },
      });

      // Soft delete + GDPR anonymisation
      await tx.user.update({
        where: { id: userId },
        data: {
          deleted_at: new Date(),
          email: `deleted_${userId}@deleted.invalid`,
          password_hash: "DELETED",
          first_name: null,
          last_name: null,
          avatar_url: null,
          stripe_subscription_id: null,
          stripe_customer_id: null,
          verification_token: null,
          password_reset_token: null,
        },
      });
    });

    // Clear all Redis caches for this user
    await Promise.all([
      cache.deletePattern(`sess:*`),
      redis.del(`dashboard:stats:${userId}`),
      redis.del(`dashboard:revenue:${userId}`),
    ]);

    return { email: user.email };
  }
}