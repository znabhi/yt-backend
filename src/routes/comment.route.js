import { Router } from "express";
import {
  addComment,
  deleteComment,
  editComment,
  getVideoComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/:videoId").get(getVideoComment).post(addComment);

router.route("/c/:commentId").delete(deleteComment).patch(editComment);

// router.route("/add-comment");

export default router;
