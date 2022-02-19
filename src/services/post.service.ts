import { PostDocument, PostInput } from "../models/post.model";
import { DocumentDefinition, FilterQuery } from "mongoose";
import { Post } from "../models";

export async function createPost(input: DocumentDefinition<PostInput>) {
  try {
    const post = await Post.create(input);
    return post.toJSON();
  } catch (error: any) {
    console.log(error);
    return false;
  }
}
