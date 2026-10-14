import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .email()
  .max(254)
  .transform((email) => email.toLowerCase());

const passwordSchema = z
  .string()
  .min(12, "La contraseña debe tener al menos 12 caracteres.")
  .max(72, "La contraseña no puede superar los 72 caracteres.")
  .refine(
    (password) => Buffer.byteLength(password, "utf8") <= 72,
    "La contraseña supera el máximo de 72 bytes.",
  );

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z
      .string()
      .min(1)
      .max(72)
      .refine(
        (password) => Buffer.byteLength(password, "utf8") <= 72,
        "La contraseña supera el máximo de 72 bytes.",
      ),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
