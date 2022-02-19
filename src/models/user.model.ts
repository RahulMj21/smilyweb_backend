import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import config from "config";

export interface UserInput {
  name: string;
  email: string;
  password: string;
}

export interface UserDocument extends UserInput, mongoose.Document {
  avatar: {
    public_id: string;
    secure_url: string;
  };
  role: string;
  followers: [
    {
      user: UserDocument["_id"];
    }
  ];
  following: [
    {
      user: UserDocument["_id"];
    }
  ];
  forgotPasswordToken: string;
  forgotPasswordExpiry: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<Boolean>;
  getForgotPasswordToken(): string;
}

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 40,
      minlength: 3,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    avatar: {
      public_id: { type: String, default: "" },
      secure_url: { type: String, default: "" },
    },
    role: {
      type: String,
      default: "user",
    },
    isLoggedInWithGoogle: {
      type: Boolean,
      default: false,
    },
    followers: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    following: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    forgotPasswordToken: {
      type: String,
    },
    forgotPasswordExpiry: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  const user = this as UserDocument;
  if (!user.isModified("password")) return next();
  user.password = await bcrypt.hash(user.password, 10);
  return next();
});

userSchema.methods.comparePassword = async function (
  password: string
): Promise<Boolean> {
  const user = this as UserDocument;
  return await bcrypt.compare(password, user.password).catch((err) => false);
};

userSchema.methods.getForgotPasswordToken = function () {
  const user = this as UserDocument;
  const randomString = crypto.randomBytes(26).toString("hex");
  const expiry = Date.now() + 1000 * 60 * 15;
  const data = `${randomString}.${expiry}`;

  const hash = crypto
    .createHmac("sha256", config.get("forgotPasswordTokenSecret"))
    .update(data)
    .digest("hex");
  user.forgotPasswordToken = hash;
  user.forgotPasswordExpiry = expiry;
  user.save();
  return `${expiry}.bR${randomString}`;
};

export default mongoose.model<UserDocument>("User", userSchema);
