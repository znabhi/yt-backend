import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Tweet } from "../models/tweet.model.js";
import mongoose from "mongoose";

const addTweet = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { content } = req.body;

  if (!userId || !content) {
    throw new ApiError(400, "User ID and content are required.");
  }

  const tweet = await Tweet.create({
    content,
    owner: new mongoose.Types.ObjectId(userId),
  });

  if (!tweet) {
    throw new ApiError(400, "Tweet could not be added.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet added successfully."));
});

const getUserTweet = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User ID not provided.");
  }

  const tweets = await Tweet.find({ owner: userId });

  if (!tweets.length) {
    throw new ApiError(404, "No tweets found for this user.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "All tweets fetched successfully."));
});

const editTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!tweetId || !content) {
    throw new ApiError(400, "Tweet ID and content are required.");
  }

  const updateTweet = await Tweet.findOneAndUpdate(
    { _id: tweetId, owner: req.user?._id },
    { content },
    { new: true }
  );

  if (!updateTweet) {
    throw new ApiError(404, "Tweet not found or unauthorized.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updateTweet, "Tweet updated successfully."));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user?._id;

  if (!tweetId || !userId) {
    throw new ApiError(400, "Tweet ID not provided or user not authenticated.");
  }

  const deletedTweet = await Tweet.findOneAndDelete({
    _id: tweetId,
    owner: userId,
  });

  if (!deletedTweet) {
    throw new ApiError(404, "Tweet not found for the authenticated user.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedTweet, "Tweet deleted successfully."));
});

export { addTweet, getUserTweet, editTweet, deleteTweet };
