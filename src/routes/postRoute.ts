import express from "express";
import { PostController } from "../controllers";
import { deserializeUser } from "../middlewares";

const router = express.Router();

router.route("/post/new").post(deserializeUser, PostController.createPost);

router.route("/posts").get(deserializeUser, PostController.getAllPosts);

router
  .route("/user/posts/:id")
  .get(deserializeUser, PostController.getUserAllPosts);

router
  .route("/post/:id")
  .get(deserializeUser, PostController.getSinglePost)
  .delete(deserializeUser, PostController.deletePost);

router.route("/likepost/:id").put(deserializeUser, PostController.likePost);

router
  .route("/dislikepost/:id")
  .put(deserializeUser, PostController.disLikePost);

router.route("/sharepost/:id").put(deserializeUser, PostController.sharePost);

router
  .route("/makecomment/:id")
  .put(deserializeUser, PostController.makeComment);

export default router;
