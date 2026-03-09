import { z } from "zod";

// Veritabanı User modeline uygun, register isteği için body şeması
export const registerUserSchema = z.object({
  email: z
    .string()
    .email("Geçerli bir e-posta adresi girin")
    .max(255, "E-posta çok uzun"),
  password: z
    .string()
    .min(8, "Şifre en az 8 karakter olmalı")
    .max(255, "Şifre çok uzun")
    .regex(/[A-Z]/, "Şifre en az bir büyük harf içermelidir")
    .regex(/[a-z]/, "Şifre en az bir küçük harf içermelidir")
    .regex(/[0-9]/, "Şifre en az bir rakam içermelidir")
    .regex(/[^A-Za-z0-9]/, "Şifre en az bir özel karakter içermelidir"),
  firstName: z.string().min(1, "İsim zorunlu").max(100, "İsim çok uzun"),
  lastName: z.string().min(1, "Soyisim zorunlu").max(100, "Soyisim çok uzun"),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;

export const loginUserSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(1, "Şifre gereklidir"),
});

export type LoginUserInput = z.infer<typeof loginUserSchema>;

export const updateMeSchema = z.object({
  first_name: z.string().min(2).optional(),
  last_name: z.string().min(2).optional(),
  timezone: z.string().optional(),
  currency: z.string().length(3).optional(),
  hourly_rate: z.number().positive().optional(),
  avatar_url: z.string().url().optional(),
  role: z.enum(["freelancer", "agency"]).optional(),
  is_onboarding_completed: z.boolean().optional(),
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>;

// Reset password şeması - aynı güçlü şifre kuralları
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Şifre en az 8 karakter olmalı")
    .max(255, "Şifre çok uzun")
    .regex(/[A-Z]/, "Şifre en az bir büyük harf içermelidir")
    .regex(/[a-z]/, "Şifre en az bir küçük harf içermelidir")
    .regex(/[0-9]/, "Şifre en az bir rakam içermelidir")
    .regex(/[^A-Za-z0-9]/, "Şifre en az bir özel karakter içermelidir"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
