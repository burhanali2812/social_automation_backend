import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      unique: true,
      minlength: [2, "Company name must be at least 2 characters"],
      maxlength: [100, "Company name cannot exceed 100 characters"],
      index: true,
    },

    companyLogo: {
      type: String,
      default: null,
      trim: true,
      validate: {
        validator(value) {
          if (!value) return true;
          return /^https?:\/\/.+/i.test(value);
        },
        message: "Invalid logo URL",
      },
    },

    companyDescription: {
      type: String,
      required: [true, "Company description is required"],
      trim: true,
      minlength: [20, "Description should be at least 20 characters"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    companyType: {
      type: String,
      required: [true, "Company type is required"],
      enum: {
        values: [
          "Software",
          "Education",
          "Healthcare",
          "E-Commerce",
          "Travel",
          "NGO",
          "Marketing",
          "Finance",
          "Real Estate",
          "Other",
        ],
        message: "Invalid company type",
      },
      trim: true,
    },
    socialMediaLinks: {
      facebook: {
        type: String,
        trim: true,
        default: null,
        validate: {
          validator(value) {
            if (!value) return true;
            return /^https?:\/\/(www\.)?facebook\.com\/.+/i.test(value);
          },
          message: "Invalid Facebook URL",
        },
      },
      instagram: {
        type: String,
        trim: true,
        default: null,
        validate: {
          validator(value) {
            if (!value) return true;
            return /^https?:\/\/(www\.)?instagram\.com\/.+/i.test(value);
          },
          message: "Invalid Instagram URL",
        },
      },
      linkedin: {
        type: String,
        trim: true,
        default: null,
        validate: {
          validator(value) {
            if (!value) return true;
            return /^https?:\/\/(www\.)?linkedin\.com\/.+/i.test(value);
          },
          message: "Invalid LinkedIn URL",
        },
      },
     youtube: {
        type: String,
        trim: true,
        default: null,
        validate: {
          validator(value) {
            if (!value) return true;
            return /^https?:\/\/(www\.)?youtube\.com\/.+/i.test(value);
          },
          message: "Invalid YouTube URL",
        },
      },
    },
    


    website: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      validate: {
        validator(value) {
          if (!value) return true;
          return /^https?:\/\/.+/i.test(value);
        },
        message: "Invalid website URL",
      },
    },

    email: {
      type: String,
      required: [true, "Company email is required"],
      trim: true,
      lowercase: true,
      unique: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
      index: true,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^[+]?[0-9]{10,15}$/, "Phone number must contain 10-15 digits"],
    },

    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      minlength: [5, "Address is too short"],
      maxlength: [300, "Address cannot exceed 300 characters"],
    },

    defaultGeminiPrompt: {
      type: String,
      required: [true, "Default Gemini prompt is required"],
      trim: true,
      minlength: [20, "Prompt should be descriptive"],
      maxlength: [3000, "Prompt cannot exceed 3000 characters"],
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    timezone: {
      type: String,
      default: "Asia/Karachi",
    },

    postingTime: {
      type: String,
      default: "09:00",
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

companySchema.index({ companyName: 1, email: 1 });
companySchema.index({ companyType: 1 });

export default mongoose.model("Company", companySchema);