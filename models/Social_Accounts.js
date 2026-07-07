import mongoose from "mongoose";
const socialAccountSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    platform: {
      type: String,
      enum: ["facebook", "instagram", "linkedin", "twitter","youtube"],
      required: true,
    },

    accountName: {
      type: String,
      required: true,
    },

    pageId: {
      type: String,
      required: true,
    },

    accessToken: {
      type: String,
      required: true,
    },

    refreshToken: {
      type: String,
      default: null,
    },

    tokenExpiry: {
      type: Date,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// One company cannot connect same platform twice
socialAccountSchema.index({ companyId: 1, platform: 1 }, { unique: true });

export default mongoose.model("SocialAccount", socialAccountSchema);