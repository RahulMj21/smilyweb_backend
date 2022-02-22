import { NextFunction, Request, Response } from "express";
import { get } from "lodash";
import { Post } from "../models";
import { createPost } from "../services/post.service";
import { BigPromise, CustomErrorHandler } from "../utils";
import { uploadImage } from "../utils/cloudinaryHelper";

class PostController {
  createPost = BigPromise(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = get(res, "locals.user");
      const caption = get(req, "body.caption");
      const image = get(req, "files.image") || get(req, "body.image");
      if (!caption || !image)
        return next(new CustomErrorHandler(400, "all fields are required"));
      const uploadableFile =
        typeof image === "object" ? image.tempFilePath : image;
      const result = await uploadImage(uploadableFile, {
        folder: `/socialmedia/${user._id}/posts`,
      });

      if (!result)
        return next(new CustomErrorHandler(500, "Oops..something went wrong"));

      const data = {
        caption,
        postCreator: user._id,
        image: {
          public_id: result.public_id,
          secure_url: result.secure_url,
        },
      };

      const post = await createPost(data);
      if (!post)
        return next(new CustomErrorHandler(500, "Oops..something went wrong"));

      return res.status(200).json({
        success: true,
        message: "Post Created",
        post: {
          ...post,
          postCreator: {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
          },
        },
      });
    }
  );

  getAllPosts = BigPromise(
    async (req: Request, res: Response, next: NextFunction) => {
      const posts = await Post.find().populate(
        "postCreator",
        "name avatar email _id"
      );
      if (!posts)
        return next(
          new CustomErrorHandler(404, "currently don't have any post to see")
        );
      return res.status(200).json({
        success: true,
        posts,
      });
    }
  );

  getSinglePost = BigPromise(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = get(req, "params.id");
      if (!id) return next(new CustomErrorHandler(400, "post id is required"));

      const post = await Post.findById(id).populate(
        "postCreator",
        "name avatar email _id"
      );
      if (!post)
        return next(
          new CustomErrorHandler(404, "currently don't have any post to see")
        );

      return res.status(200).json({
        success: true,
        post,
      });
    }
  );

  getUserAllPosts = BigPromise(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = get(req, "params.id");
      if (!id) return next(new CustomErrorHandler(400, "user id is required"));

      const posts = await Post.find({ postCreator: id });
      if (!posts)
        return next(
          new CustomErrorHandler(404, "currently don't have any post to see")
        );

      return res.status(200).json({
        success: true,
        posts,
      });
    }
  );

  likePost = BigPromise(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = get(res, "locals.user");
      const id = get(req, "params.id");

      const post = await Post.findById(id);
      if (!post) return next(new CustomErrorHandler(404, "post not found"));

      const isLiked = post.likes.find(
        (like) => like.user.toString() === user._id.toString()
      );

      if (isLiked) {
        return res
          .status(200)
          .json({ success: true, message: "already liked" });
      }

      const data = {
        likes: [
          ...post.likes,
          {
            user: get(user, "_id"),
          },
        ],
      };

      const updatedPost = await Post.findByIdAndUpdate(post._id, data, {
        new: true,
      }).populate("postCreator", "_id name email avatar");
      if (!updatedPost)
        return next(new CustomErrorHandler(500, "Oops..something went wrong"));

      return res.status(200).json({
        success: true,
        updatedPost,
        message: "post liked",
      });
    }
  );

  disLikePost = BigPromise(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = get(res, "locals.user");
      const id = get(req, "params.id");

      const post = await Post.findById(id);
      if (!post) return next(new CustomErrorHandler(404, "post not found"));

      const isLiked = post.likes.find(
        (like) => like.user.toString() === user._id.toString()
      );

      if (!isLiked)
        return next(new CustomErrorHandler(400, "cannot perform this task"));

      const data = {
        likes: post.likes.filter(
          (like) => like.user.toString() !== user._id.toString()
        ),
      };

      const updatedPost = await Post.findByIdAndUpdate(post._id, data, {
        new: true,
      }).populate("postCreator", "_id name email avatar");
      if (!updatedPost)
        return next(new CustomErrorHandler(500, "Oops..something went wrong"));

      return res.status(200).json({
        success: true,
        updatedPost,
        message: "like removed",
      });
    }
  );

  sharePost = BigPromise(
    async (req: Request, res: Response, next: NextFunction) => {
      const post = await Post.findById(get(req, "params.id"));
      if (!post) return next(new CustomErrorHandler(404, "post not found"));

      post.shares = post.shares + 1;
      post.save();

      return res.status(200).json({
        success: true,
        message: "Link copied to clipboard.. share the link to anyone",
      });
    }
  );

  makeComment = BigPromise(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = get(res, "locals.user");
      const comment = get(req, "body.comment");

      if (!comment)
        return next(
          new CustomErrorHandler(400, "enter some text to make a comment")
        );

      const post = await Post.findById(get(req, "params.id"));
      if (!post) return next(new CustomErrorHandler(404, "post not found"));

      const data = {
        comments: [
          ...post.comments,
          {
            user: user._id,
            name: user.name,
            comment,
          },
        ],
      };
      const updatedPost = await Post.findByIdAndUpdate(post._id, data, {
        new: true,
      }).populate("postCreator", "_id name email avatar");

      if (!updatedPost)
        return next(new CustomErrorHandler(500, "Oops..something went wrong"));

      res.status(200).json({
        success: true,
        updatedPost,
        message: "comment added",
      });
    }
  );

  deletePost = BigPromise(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = get(res, "locals.user");
      const id = get(req, "params.id");
      if (!id) return next(new CustomErrorHandler(400, "post id is required"));

      const post = await Post.findById(id);
      if (!post) return next(new CustomErrorHandler(404, "post not found"));

      if (post.postCreator.toString() !== user._id.toString())
        return next(
          new CustomErrorHandler(403, "you are not allowed to this route")
        );

      post.remove();

      res.status(200).json({
        success: true,
        message: "post deleted",
      });
    }
  );
}

export default new PostController();
