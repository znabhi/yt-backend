import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/vidoe.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { title, description } = req.body; // Corrected "discription" to "description"
  const userId = req.user?._id;

  if (!title) {
    throw new ApiError(400, "Title is required");
  } else if (!userId) {
    throw new ApiError(400, "User ID not found");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(400, "User not found in the database");
  }

  const playlist = await Playlist.create({
    title,
    description, // Corrected "discription" to "description"
    createdBy: new mongoose.Types.ObjectId(userId), // Removed "new" keyword
  });

  if (!playlist) {
    throw new ApiError(500, "Failed to create playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist created successfully"));
});

const getPlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId) {
    throw new ApiError(400, "Playlist ID is required");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId), // Removed "new" keyword
      },
    },
    {
      $lookup: {
        from: "videos",
        let: { playlistVideos: "$playlistVideos" },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ["$_id", "$$playlistVideos"],
              },
            },
          },
          {
            $match: {
              isPublished: true,
            },
          },
        ],
        as: "videos",
      },
    },
    {
      $addFields: {
        videos: {
          $cond: {
            if: { $eq: [{ $size: "$playlistVideos" }, 0] },
            then: [],
            else: "$videos",
          },
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $addFields: {
        totalSize: { $size: "$videos" },
        totalView: { $sum: "$videos.views" },
        owner: { $arrayElemAt: ["$owner", 0] },
      },
    },
    {
      $project: {
        title: 1,
        description: 1,
        totalSize: 1,
        totalView: 1,
        playlistVideos: 1,
        "videos._id": 1,
        "videos.title": 1,
        "videos.videoFile": 1,
        "videos.videoOwner": 1,
        "videos.description": 1, // Corrected "discription" to "description"
        "videos.duration": 1,
        "videos.views": 1,
        "videos.videoThumbnail": 1,
        "videos.isPublished": 1,
        "owner.username": 1,
      },
    },
  ]);

  if (!playlist || playlist.length === 0) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist[0], "Playlist fetched successfully"));
});

const addVideoOnPlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { videoId } = req.body;
  const userId = req.user?._id;

  if (!playlistId) {
    throw new ApiError(400, "Playlist ID is required");
  } else if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  } else if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const video = await Video.findById(videoId);
  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (String(playlist.createdBy) !== String(userId)) {
    throw new ApiError(
      403,
      "You don't have permission to add video to this playlist"
    );
  }

  playlist.playlistVideos.push(videoId);
  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video added successfully"));
});

const editPlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { title, description } = req.body;
  const userId = req.user._id;

  // Validate request parameters
  if (!playlistId) {
    throw new ApiError(400, "Playlist ID is required");
  } else if (!userId) {
    throw new ApiError(400, "User ID is required");
  } else if (!title && !description) {
    throw new ApiError(400, "Title or description is required");
  }

  // Update playlist
  const updatedPlaylist = await Playlist.findOneAndUpdate(
    { _id: playlistId, createdBy: userId },
    { title, description },
    { new: true } // Return the updated document
  );

  // Check if playlist exists
  if (!updatedPlaylist) {
    throw new ApiError(
      400,
      "This playlist does not exist or you don't have permission to edit it."
    );
  }

  // Return response with updated playlist
  return res.status(200).json(new ApiResponse(200, updatedPlaylist, "edit"));
});

const removePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const userId = req.user?._id;

  if (!playlistId) {
    throw new ApiError(400, "Playlist ID is required");
  } else if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const playlist = await Playlist.findOneAndDelete({
    _id: playlistId,
    createdBy: userId,
  });

  if (!playlist) {
    throw new ApiError(
      404,
      "Playlist not found or you don't have permission to delete it"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Playlist removed successfully"));
});

const removePlaylistVideo = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { videoIdToRemove } = req.body;
  const userId = req.user?._id;

  if (!videoIdToRemove) {
    throw new ApiError(400, "Video Id required for removing");
  } else if (!userId) {
    throw new ApiError(400, "User Id required");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(400, "Playlist not found or you don't have access");
  }

  const videoIndex = playlist.playlistVideos.findIndex(
    (video) => String(video) === String(videoIdToRemove)
  );

  // Check if the video was found
  if (videoIndex === -1) {
    throw new ApiError(404, "Video not found in the playlist");
  } else {
    // Remove the video from playlistVideos array
    playlist.playlistVideos.splice(videoIndex, 1);
  }
  // Save the updated playlist
  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video removed successfully"));
});

export {
  createPlaylist,
  getPlaylist,
  addVideoOnPlaylist,
  editPlaylist,
  removePlaylist,
  removePlaylistVideo,
};
