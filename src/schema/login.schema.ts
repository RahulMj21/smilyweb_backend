import { object, string } from "zod";

const loginSchema = object({
  body: object({
    email: string({
      required_error: "email is required",
    }).email("please enter a valid email"),
    password: string({
      required_error: "password is required",
    }),
  }),
});

export default loginSchema;
