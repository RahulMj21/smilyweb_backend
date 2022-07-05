import { DocumentDefinition } from "mongoose";
import { Post } from "../models";
import { PostInput } from "../models/post.model";

export async function createPost(input: DocumentDefinition<PostInput>) {
  try {
    const post = await Post.create(input);
    return post.toJSON();
  } catch (error: any) {
    console.log(error);
    return false;
  }
}
