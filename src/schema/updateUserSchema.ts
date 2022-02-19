import { string, object } from "zod";

export const updateUserSchema = object({
  body: object({
    email: string({
      required_error: "please provide email",
    }).email("Please enter a valid email"),
    name: string({
      required_error: "please provide name",
    }).min(3, "name should be atlest 3 characters long"),
  }),
});
