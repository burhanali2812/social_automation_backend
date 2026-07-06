const mongoose = require("mongoose");
const mediaSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    imageUrl: {
      type: String,
      required: true,
    },

    imageHash: {
      type: String,
      required: true,
    },

    tags: [String],

    isAssigned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

mediaSchema.index({ companyId: 1, imageHash: 1 }, { unique: true });

export default mongoose.model("Media", mediaSchema);