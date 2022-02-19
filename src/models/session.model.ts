import mongoose from "mongoose";
import { UserDocument } from "./user.model";

const Schema = mongoose.Schema;

export interface SessionInput {
  user: UserDocument["_id"];
  userAgent: string;
}

export interface SessionDocument extends SessionInput, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    userAgent: { type: String },
  },
  {
    timestamps: true,
  }
);

const sessionModel = mongoose.model<SessionDocument>("Session", sessionSchema);

export default sessionModel;
