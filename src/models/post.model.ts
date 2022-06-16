import mongoose from "mongoose";
import { UserDocument } from "./user.model";

const Schema = mongoose.Schema;

export interface PostInput {
  caption: string;
  postCreator: UserDocument["_id"];
  image: {
    public_id: string;
    secure_url: string;
  };
}

export interface PostDocument extends PostInput, mongoose.Document {
  likes: [
    {
      user: UserDocument["_id"];
    }
  ];
  shares: number;
  comments: [
    {
      user: UserDocument["_id"];
      name: string;
      comment: string;
      time: Date;
    }
  ];
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema(
  {
    caption: {
      type: String,
      required: true,
    },
    image: {
      public_id: { type: String, required: true },
      secure_url: { type: String, required: true },
    },
    postCreator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likes: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    shares: {
      type: Number,
      default: 0,
    },
    comments: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        comment: String,
        time: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const PostModel = mongoose.model<PostDocument>("Post", postSchema);

export default PostModel;
