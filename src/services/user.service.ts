import { User } from "../models";
import { UserInput, UserDocument } from "../models/user.model";
import { DocumentDefinition, FilterQuery } from "mongoose";
import { omit } from "lodash";

export async function createUser(input: DocumentDefinition<UserInput>) {
  const user = await User.create(input);
  return omit(user.toJSON(), "password");
}
export async function findUser(query: FilterQuery<UserDocument>) {
  try {
    const user = await User.findOne(query);
    return user?.toJSON();
  } catch (error: any) {
    return false;
  }
}
export async function deleteUser(id: string) {
  try {
    await User.findByIdAndDelete(id);
    return true;
  } catch (error: any) {
    return false;
  }
}
export async function findAllUsers() {
  const users = await User.find();
  return users.map((user) => omit(user.toJSON(), "password"));
}
export async function validatePassword({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const user = await User.findOne({ email });
  if (!user) return false;

  const isValid = await user.comparePassword(password);

  if (!isValid) return false;

  return omit(user.toJSON(), "password");
}
export async function updatePassword({
  id,
  currentPassword,
  newPassword,
}: {
  id: string;
  currentPassword: string;
  newPassword: string;
}) {
  const user = await User.findById(id);
  if (!user) return false;

  const isPasswordMatched = await user.comparePassword(currentPassword);
  if (!isPasswordMatched) return false;

  if (currentPassword === newPassword) return false;

  user.password = newPassword;
  user.save();

  return omit(user.toJSON(), "password");
}
