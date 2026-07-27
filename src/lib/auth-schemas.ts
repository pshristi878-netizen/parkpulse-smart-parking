import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email" }).max(255),
  password: z.string().min(6, { message: "At least 6 characters" }).max(72),
});

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, { message: "Enter your name" }).max(80),
  email: z.string().trim().email({ message: "Enter a valid email" }).max(255),
  password: z.string().min(6, { message: "At least 6 characters" }).max(72),
});

export const forgotSchema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email" }).max(255),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotInput = z.infer<typeof forgotSchema>;
