import { object, string, TypeOf } from "zod";

export const createUserSchema = object({
  body: object({
    name: string({
      required_error: "name is required",
    }).min(3, "name should be contain atleast 3 characters"),
    email: string({
      required_error: "email is required",
    }).email("please enter a valid email"),
    password: string({
      required_error: "password is required",
    }).min(6, "password should be atleast 6 characters long"),
    confirmPassword: string({
      required_error: "confirmPassword is required",
    }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "password and confirmPassword mismatched",
    path: ["confirmPassword"],
  }),
});

export type CreateUserInput = TypeOf<
  Omit<typeof createUserSchema, "body.confirmPassword">
>;
