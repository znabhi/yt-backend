import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { Video } from "../models/vidoe.model.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;
  // Validate videoId and userId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  } else if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid User Id");
  }

  // Find video and user
  const video = await Video.findOne({ _id: videoId });
  const user = await User.findOne({ _id: userId });

  // Check if video and user exist
  if (!video) {
    throw new ApiError(400, "Video not found");
  } else if (!user) {
    throw new ApiError(400, "User not found");
  }

  // Find or create like document for the video
  let likeDocument = await Like.findOne({ video: videoId });
  if (!likeDocument) {
    likeDocument = new Like({
      video: videoId,
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: [],
    });
  }

  // Check if user has already liked or disliked the video
  const userLikedIndex = likeDocument.likedBy.findIndex((like) =>
    like._id.equals(userId)
  );
  const userDislikedIndex = likeDocument.dislikedBy.findIndex((dislike) =>
    dislike._id.equals(userId)
  );

  // Toggle like/dislike based on user's current action
  if (userDislikedIndex !== -1) {
    likeDocument.dislikedBy.pull({ _id: userId });
    likeDocument.dislikes -= 1;

    likeDocument.likedBy.push({ _id: userId, dateTime: new Date() });
    likeDocument.likes += 1;
  } else if (userLikedIndex !== -1) {
    likeDocument.likedBy.pull({ _id: userId });
    likeDocument.likes -= 1;
  } else {
    likeDocument.likedBy.push({ _id: userId, dateTime: new Date() });
    likeDocument.likes += 1;
  }
  // Save the updated like document
  await likeDocument.save();

  // Return response
  return res
    .status(200)
    .json(new ApiResponse(200, likeDocument, "Toggle Like/Dislike Successful"));
});

const toggleDislike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;

  // Validate videoId and userId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  } else if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid User Id");
  }

  // Find video and user
  const video = await Video.findOne({ _id: videoId });
  const user = await User.findOne({ _id: userId });

  // Check if video and user exist
  if (!video) {
    throw new ApiError(400, "Video not found");
  } else if (!user) {
    throw new ApiError(400, "User not found");
  }

  // Find or create like document for the video
  let likeDocument = await Like.findOne({ video: videoId });
  if (!likeDocument) {
    likeDocument = new Like({
      video: videoId,
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: [],
    });
  }

  // Check if user has already liked or disliked the video
  const userLikedIndex = likeDocument.likedBy.findIndex((like) =>
    like._id.equals(userId)
  );
  const userDislikedIndex = likeDocument.dislikedBy.findIndex((dislike) =>
    dislike._id.equals(userId)
  );

  // Toggle like/dislike based on user's current action
  if (userDislikedIndex !== -1) {
    likeDocument.dislikedBy.pull({ _id: userId });
    likeDocument.dislikes -= 1;
  } else if (userLikedIndex !== -1) {
    likeDocument.likedBy.pull({ _id: userId });
    likeDocument.likes -= 1;

    likeDocument.dislikedBy.push({ _id: userId, dateTime: new Date() });
    likeDocument.dislikes += 1;
  } else {
    likeDocument.dislikedBy.push({ _id: userId, dateTime: new Date() });
    likeDocument.dislikes += 1;
  }

  // Save the updated like document
  await likeDocument.save();

  // Return response
  return res
    .status(200)
    .json(new ApiResponse(200, likeDocument, "Toggle Dislike Successful"));
});

export { toggleLike, toggleDislike };
