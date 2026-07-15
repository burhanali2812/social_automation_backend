import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company is required"],
      index: true,
    },

    mediaType: {
      type: String,
      enum: {
        values: ["image", "video"],
        message: "Media type must be image or video",
      },
      required: [true, "Media type is required"],
      index: true,
    },

    mediaUrl: {
      type: String,
      required: [true, "Media URL is required"],
      trim: true,
    },

    cloudinaryPublicId: {
      type: String,
      required: [true, "Cloudinary Public ID is required"],
      unique: true,
      trim: true,
    },

    mediaHash: {
      type: String,
      required: [true, "Media hash is required"],
      unique: true,
      index: true,
      trim: true,
    },

    originalFileName: {
      type: String,
      required: [true, "Original filename is required"],
      trim: true,
    },

    fileSize: {
      type: Number,
      required: true,
      min: 0,
    },

    width: {
      type: Number,
      default: null,
    },

    height: {
      type: Number,
      default: null,
    },

    duration: {
      type: Number,
      default: null, // Only for videos (seconds)
    },

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    isAssigned: {
      type: Boolean,
      default: false,
      index: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);


// Prevent duplicate upload of same file in same company
mediaSchema.index(
  {
    companyId: 1,
    mediaHash: 1,
  },
  {
    unique: true,
  }
);

// Search optimization
mediaSchema.index({
  companyId: 1,
  mediaType: 1,
});

mediaSchema.index({
  tags: 1,
});

export default mongoose.model("Media", mediaSchema);