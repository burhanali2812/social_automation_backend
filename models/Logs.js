const mongoose = require("mongoose");
const logSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    platform: {
      type: String,
      enum: ["facebook", "instagram", "linkedin", "twitter"],
      required: true,
    },

    success: {
      type: Boolean,
      required: true,
    },

    response: {
      type: Object,
      default: {},
    },

    errorMessage: {
      type: String,
      default: null,
    },

    postedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

logSchema.index({ postId: 1, platform: 1 });

export default mongoose.model("Log", logSchema);