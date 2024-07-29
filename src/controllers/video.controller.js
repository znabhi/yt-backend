import mongoose from "mongoose";
import { Video } from "../models/vidoe.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const uploadVideo = asyncHandler(async (req, res) => {
  const videoFileLocalPath = req.file?.path;
  const userId = req.user?._id;
  const { title, description, keyWords, views, vidoeThumnail } = req.body;
  if (!userId) {
    throw new ApiError(400, "User Not found");
  }
  // console.log(req.file);
  const fileExtenstion = videoFileLocalPath?.split(".").pop().toLowerCase();

  if (fileExtenstion !== "mp4") {
    throw new ApiError(400, "Please Select MP4 File");
  }

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Not Get Video file");
  }

  const videoCloudinayPath = await uploadOnCloudinary(videoFileLocalPath);
  const cloudinaryVideoURL = await videoCloudinayPath?.url;
  const videoDuration = await videoCloudinayPath?.duration;

  if (!cloudinaryVideoURL && !videoDuration) {
    throw new ApiError(400, "Error while uploading");
  }

  const video = await Video.create({
    videoFile: cloudinaryVideoURL,
    duration: videoDuration,
    title,
    description,
    keyWords,
    views,
    vidoeThumnail,
    videoOwner: new mongoose.Types.ObjectId(userId),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Successfully Uploaded Video"));
});

const getAllVideos = asyncHandler(async (_, res) => {
  const videos = await Video.find();
  return res
    .status(200)
    .json(new ApiResponse(200, videos, "All videos fatched"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // Check if videoId exists
  if (!videoId) {
    throw new ApiError(404, "Video ID is required");
  }

  // Find video details by ID
  // const videoDetails = await Video.findById(videoId);

  const videoDetails = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "videoId",
        foreignField: "videoId",
        as: "allComments",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "videoId",
        foreignField: "videoId",
        as: "allLikes",
      },
    },
    {
      $addFields: {
        comment: "$allComments",
        like: "$allLikes",
      },
    },
    {
      $project: {
        comment: 1,
        like: 1,
        videoFile: 1,
        videoOwner: 1,
        title: 1,
        description: 1,
        keyWords: 1,
        duration: 1,
        views: 1,
        vidoeThumnail: 1,
        isPublished: 1,
      },
    },
  ]);

  // If video details not found, throw an error
  if (!videoDetails.length) {
    throw new ApiError(404, "Video not found");
  }

  // Send response with video details
  return res.status(200).json({
    status: "success",
    data: videoDetails,
    message: "Successfully retrieved video details",
  });
});

const updateVideoDetails = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;
  const { title, description, keywords } = req.body;
  const thumnailLocalPath = req.file?.path;

  // Find the video by ID and owner
  const video = await Video.findOne({
    _id: videoId,
    videoOwner: userId,
  });

  // Check if the video exists and user has access to update
  if (!video) {
    throw new ApiError(
      404,
      "Video not found or you don't have access to update it."
    );
  }

  // Check if videoId exists and user is authenticated
  if (!videoId || !userId) {
    throw new ApiError(400, "Video ID and User ID are required.");
  }

  // Check if title and thumbnail are provided
  if (!title || !thumnailLocalPath) {
    throw new ApiError(400, "Title and Thumbnail Image are required.");
  }

  // Upload thumbnail to Cloudinary
  const uploadThumbnailCloudinary = await uploadOnCloudinary(thumnailLocalPath);
  if (!uploadThumbnailCloudinary?.url) {
    throw new ApiError(400, "Failed to upload thumbnail to Cloudinary.");
  }

  // Check if the provided title is different from the existing one
  if (title === video.title) {
    throw new ApiError(
      400,
      "New title must be different from the existing one."
    );
  }

  // Update video details
  video.title = title;
  video.description = description || "";
  video.keywords = keywords || [];
  video.videoThumbnail = uploadThumbnailCloudinary.url;

  // Save the updated video
  await video.save();

  // Send success response
  return res.status(200).json({
    status: "success",
    message: "Successfully updated video details.",
    data: video,
  });
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;
  if (!videoId || !userId) {
    throw new ApiError(400, "Video Details Not Fatched and user not found");
  }

  const videoCheck = await Video.findOne({
    _id: videoId,
    videoOwner: new mongoose.Types.ObjectId(userId),
  });

  if (!videoCheck) {
    throw new ApiError(
      400,
      "Sorry... Not Found this video and you don't have to access to delete"
    );
  }

  const video = await Video.findByIdAndDelete(videoId);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Succefully Deleted Video"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video Not Found");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Not Get video details");
  }

  if (video.isPublished === true) {
    video.isPublished = false;
  } else if (video.isPublished === false) {
    video.isPublished = true;
  }

  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Successfully Get details"));
});

export {
  uploadVideo,
  getVideoById,
  updateVideoDetails,
  deleteVideo,
  togglePublishStatus,
  getAllVideos,
};
