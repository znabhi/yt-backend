import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    likes: {
      type: Number,
      default: 0,
    },
    dislikes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        _id: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        dateTime: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    dislikedBy: [
      {
        _id: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        dataTime: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    likeOnComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
    likeOnTweet: {
      type: Schema.Types.ObjectId,
      ref: "Tweet",
    },
  },
  { timestamps: true }
);

export const Like = mongoose.model("Like", likeSchema);
