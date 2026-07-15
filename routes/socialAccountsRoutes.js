import express from "express";
import SocialAccount from "../models/Social_Accounts.js";
import authMiddleware from "../authMiddleware/authMiddleware.js";
import bcrypt from "bcryptjs";
import axios from "axios";
const router = express.Router();


router.post("/addSocialAccount", authMiddleware, async (req, res) => {
  try {
    const {companyId, platform, accountName, pageId, accessToken, tokenExpiry } = req.body;

    if (!companyId || !platform || !accountName || !pageId || !accessToken || !tokenExpiry) {
      return res.status(400).json({ message: "Please fill all required fields." });
    }
    const existingAccount = await SocialAccount.findOne({ companyId, platform, pageId });
    if (existingAccount) {
      return res.status(409).json({ message: "This platform is already connected for this company." });
    }

    const socialAccount = new SocialAccount({
      companyId,
      platform,
      accountName,
      pageId,
      accessToken,
      tokenExpiry
    });
    await socialAccount.save();
    res.status(201).json({ message: "Social account connected successfully.", success: true, data: socialAccount });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
router.get("/getSocialAccounts/:companyId", authMiddleware, async (req, res) => {
  try {
    const { companyId } = req.params;
    const socialAccounts = await SocialAccount.find({ companyId });
    res.status(200).json({ success: true, data: socialAccounts });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/deleteSocialAccount/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const deletedAccount = await SocialAccount.findByIdAndDelete(id);
        if (!deletedAccount) {
            return res.status(404).json({ message: "Social account not found." });
        }
        res.status(200).json({ message: "Social account deleted successfully.", success: true });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
router.put("/updateSocialAccount/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { accountName, accessToken, tokenExpiry, pageId } = req.body;
        const updatedAccount = await SocialAccount.findByIdAndUpdate(id, { accountName, accessToken, tokenExpiry, pageId }, { new: true });
        if (!updatedAccount) {
            return res.status(404).json({ message: "Social account not found." });
        }
        res.status(200).json({ message: "Social account updated successfully.", success: true, data: updatedAccount });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


//testing route
router.post("/facebook/post-image", async (req, res) => {
  try {
    const { pageId, accessToken, imageUrl, caption } = req.body;

    const response = await axios.post(
      `https://graph.facebook.com/v25.0/${pageId}/photos`,
      {
        url: imageUrl,
        caption,
        access_token: accessToken,
      }
    );

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});
router.post("/instagram/post-image", async (req, res) => {
  try {
    const {
      instagramAccountId,
      accessToken,
      imageUrl,
      caption,
    } = req.body;

    // Step 1: Create media container
    const createResponse = await axios.post(
      `https://graph.instagram.com/v25.0/${instagramAccountId}/media`,
      null,
      {
        params: {
          image_url: imageUrl,
          caption,
          access_token: accessToken,
        },
      }
    );

    const creationId = createResponse.data.id;

    // Wait for Meta to process the image
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Step 2: Publish media
    const publishResponse = await axios.post(
      `https://graph.instagram.com/v25.0/${instagramAccountId}/media_publish`,
      null,
      {
        params: {
          creation_id: creationId,
          access_token: accessToken,
        },
      }
    );

    res.json({
      success: true,
      creationId,
      publish: publishResponse.data,
    });
  } catch (error) {
    console.error(error.response?.data || error);

    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});
router.post("/facebook/post-video", async (req, res) => {
  try {
    const { pageId, accessToken, videoUrl, caption } = req.body;
    try {
      const response = await axios.post(
        `https://graph.facebook.com/v25.0/${pageId}/videos`,
        {
          file_url: videoUrl,
          description: caption,
          access_token: accessToken,
        }
      );
      res.json({
        success: true,
        data: response.data,
      });
    }
    catch (error) {
      res.status(500).json({
        success: false,
        error: error.response?.data || error.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});
router.post("/instagram/post-video", async (req, res) => {
  try {
    const { instagramAccountId, accessToken, videoUrl, caption } = req.body;

    // ==========================
    // Step 1: Create Reel Container
    // ==========================
    const createResponse = await axios.post(
      `https://graph.instagram.com/v25.0/${instagramAccountId}/media`,
      null,
      {
        params: {
          media_type: "REELS",
          video_url: videoUrl,
          caption,
          access_token: accessToken,
        },
      }
    );

    const creationId = createResponse.data.id;

    console.log("Creation ID:", creationId);

    // ==========================
    // Step 2: Wait until Meta finishes processing
    // ==========================
    let status = "IN_PROGRESS";
    let attempts = 0;
    const MAX_ATTEMPTS = 24; // 24 × 5 sec = 2 minutes

    while (status === "IN_PROGRESS" && attempts < MAX_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const statusResponse = await axios.get(
        `https://graph.instagram.com/v25.0/${creationId}`,
        {
          params: {
            fields: "status_code",
            access_token: accessToken,
          },
        }
      );

      status = statusResponse.data.status_code;
      attempts++;

      console.log(`Attempt ${attempts}: ${status}`);
    }

    if (status !== "FINISHED") {
      return res.status(400).json({
        success: false,
        message: `Video processing failed or timed out.`,
        status,
      });
    }

    // ==========================
    // Step 3: Publish Reel
    // ==========================
    const publishResponse = await axios.post(
      `https://graph.instagram.com/v25.0/${instagramAccountId}/media_publish`,
      null,
      {
        params: {
          creation_id: creationId,
          access_token: accessToken,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Reel published successfully.",
      creationId,
      publishId: publishResponse.data.id,
    });
  } catch (error) {
    console.error(
      "Instagram Error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});
export default router;