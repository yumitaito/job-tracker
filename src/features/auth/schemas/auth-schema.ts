import { z } from "zod";

const email = z
  .string()
  .trim()
  .min(1, "メールアドレスを入力してください")
  .email("正しいメールアドレス形式で入力してください");

const displayName = z
  .string()
  .trim()
  .min(1, "表示名を入力してください")
  .max(50, "50文字以内で入力してください");

export const signupSchema = z
  .object({
    displayName,
    email,
    password: z.string().min(6, "パスワードは6文字以上で入力してください"),
    confirmPassword: z.string().min(1, "確認用パスワードを入力してください"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "パスワードを入力してください"),
});

export const profileSchema = z.object({
  displayName,
  email,
});

export const passwordChangeSchema = z
  .object({
    newPassword: z.string().min(6, "パスワードは6文字以上で入力してください"),
    confirmPassword: z.string().min(1, "確認用パスワードを入力してください"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

export type SignupFormValues = z.infer<typeof signupSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type ProfileFormValues = z.infer<typeof profileSchema>;
export type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;
