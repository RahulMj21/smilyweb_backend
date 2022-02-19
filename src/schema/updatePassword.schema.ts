import { object, string, TypeOf } from "zod";

export const UpdatePasswordSchema = object({
  body: object({
    currentPassword: string({
      required_error: "current password is required",
    }).min(6, "current password should be atleast 6 characters long"),
    newPassword: string({
      required_error: "new password is required",
    }).min(6, "new password should be atleast 6 characters long"),
    confirmNewPassword: string({
      required_error: "confirm New Password is required",
    }),
  }).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "new password and confirm new Password mismatched",
    path: ["confirmNewPassword"],
  }),
});

export type UpdatePasswordInput = TypeOf<typeof UpdatePasswordSchema>;
