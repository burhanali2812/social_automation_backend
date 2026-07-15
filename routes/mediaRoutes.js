import Company from "../models/Company.js";
import Media from "../models/Media.js";
import express from "express";
import multer from "multer";
import  {uploadToCloudinary, deleteFromCloudinary}  from "../utils/cloudinary.js";
import authMiddleware from "../authMiddleware/authMiddleware.js";
const router = express.Router();


const upload = multer({
  dest: "uploads/",
});

const uploadMedia = async (req, res) => {
  try {
    const { companyId, tags } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID is required.",
      });
    }

    if (!tags || tags.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "At least one tag is required.",
      });
    }
  

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one media file.",
      });
    }

    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found.",
      });
    }
    

    const tagArray = tags
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);

    const uploadResults = await Promise.allSettled(
      req.files.map(async (file) => {

        const alreadyExists = await Media.findOne({
          companyId,
          mediaHash: file.originalname,
        });
        if (alreadyExists) {
          return alreadyExists;
        }
        const result = await uploadToCloudinary(
          file.path,
          `social_automation/${company.slug || company.companyName}`
        );

        const media = await Media.create({
          companyId,

          mediaType: result.resource_type,

          mediaUrl: result.url,

          cloudinaryPublicId: result.public_id,

          mediaHash: result.public_id,

          originalFileName: file.originalname,

          fileSize: result.bytes,

          width: result.width,

          height: result.height,

          duration: result.duration,

          tags: tagArray,

          uploadedBy: req.user.id,
        });

        return media;
      })
    );

    const uploadedMedia = [];
    const failedUploads = [];

    uploadResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        uploadedMedia.push(result.value);
      } else {
        failedUploads.push({
          file: req.files[index].originalname,
          error: result.reason.message,
        });
      }
    });

    return res.status(201).json({
      success: true,
      message: `${uploadedMedia.length} file(s) uploaded successfully.`,

      totalFiles: req.files.length,

      uploaded: uploadedMedia.length,

      failed: failedUploads.length,

      uploadedFiles: uploadedMedia,

      failedFiles: failedUploads,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

router.post(
  "/upload",
  authMiddleware,
  upload.array("media", 30),
  uploadMedia
);

router.get("/getMedia/:companyId", authMiddleware, async (req, res) => {
  try {
    const { companyId } = req.params;
    const media = await Media.find({ companyId });

    res.status(200).json({
      success: true,
      data: media,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

router.delete("/deleteallMedia/:companyId", authMiddleware, async (req, res) => {
  try {
    const { companyId } = req.params;
    const mediaList = await Media.find({ companyId });

    for (const media of mediaList) {
      await deleteFromCloudinary(media.cloudinaryPublicId, media.mediaType);
      await Media.findByIdAndDelete(media._id);
    }

    res.status(200).json({
      success: true,
      message: "All media deleted successfully.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

router.delete("/deleteMedia/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const media = await Media.findById(id);
    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media not found.",
      });
    }
    //also delete from cloudinary
    await deleteFromCloudinary(media.cloudinaryPublicId, media.mediaType);
    await Media.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: "Media deleted successfully.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});
router.get("/allMedia", authMiddleware, async (req, res) => {
  try {
    const media = await Media.find();
    res.status(200).json({
      success: true,
      data: media,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});
export default router;

