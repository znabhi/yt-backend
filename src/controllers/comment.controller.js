import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getVideoComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video ID not provided");
  }

  const allComments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, allComments, "Successfully retrieved all comments")
    );
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;
  const { content } = req.body;

  if (!videoId || !userId || !content) {
    throw new ApiError(400, "Invalid data provided");
  }

  const comment = await Comment.create({
    content,
    video: new mongoose.Types.ObjectId(videoId),
    owner: new mongoose.Types.ObjectId(userId),
  });

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment created successfully"));
});

const editComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user?._id;
  const { content } = req.body;

  if (!commentId || !userId || !content) {
    throw new ApiError(400, "Invalid data provided");
  }

  const updatedComment = await Comment.findOneAndUpdate(
    {
      _id: commentId,
      owner: userId,
    },
    {
      content,
    },
    { new: true }
  );

  if (!updatedComment) {
    throw new ApiError(404, "Comment not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user?._id;

  if (!commentId || !userId) {
    throw new ApiError(400, "Invalid data provided");
  }

  const comment = await Comment.findOneAndDelete({
    _id: commentId,
    owner: new mongoose.Types.ObjectId(userId),
  });

  if (!comment) {
    throw new ApiError(
      404,
      "Comment not found or you don't have permission to delete it"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment deleted successfully"));
});

export { getVideoComment, addComment, deleteComment, editComment };
