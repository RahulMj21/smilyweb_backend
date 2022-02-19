import { object, string, TypeOf } from "zod";

export const ResetPasswordSchema = object({
  body: object({
    password: string({
      required_error: "password is required",
    }).min(6, "password should be atleast 6 characters long"),
    confirmPassword: string({
      required_error: "confirm Password is required",
    }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "password and confirm Password mismatched",
    path: ["confirmNewPassword"],
  }),
});

export type ResetPasswordInput = TypeOf<typeof ResetPasswordSchema>;
