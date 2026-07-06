const mongoose = require("mongoose");
const postSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },

    mediaUrl: {
      type: String,
      required: true,
    },

    thumbnailUrl: {
      type: String, // Mainly for videos
      default: "",
    },

    mediaHash: {
      type: String,
      required: true,
      index: true,
    },

    originalFileName: {
      type: String,
      required: true,
    },

    fileSize: {
      type: Number, // bytes
      required: true,
    },

    duration: {
      type: Number, // seconds (for videos)
      default: 0,
    },

    width: Number,
    height: Number,

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    scheduledDate: {
      type: Date,
      required: true,
      index: true,
    },

    scheduledTime: {
      type: String,
      default: "09:00",
    },

    aiCaption: {
      type: String,
      default: "",
    },

    aiDescription: {
      type: String,
      default: "",
    },

    aiHashtags: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["pending", "processing", "posted", "failed"],
      default: "pending",
      index: true,
    },

    isUsed: {
      type: Boolean,
      default: false,
    },

    postedPlatforms: [
      {
        platform: {
          type: String,
          enum: ["facebook", "instagram", "linkedin", "twitter"],
        },

        postId: String, // Platform response ID

        postedAt: Date,

        success: Boolean,

        error: String,
      },
    ],

    retryCount: {
      type: Number,
      default: 0,
    },

    postedAt: Date,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

postSchema.index(
  { companyId: 1, mediaHash: 1 },
  { unique: true }
);

export default mongoose.model("Post", postSchema);