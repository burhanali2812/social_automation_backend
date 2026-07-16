import express from "express";
import SocialAccount from "../models/Social_Accounts.js";
import authMiddleware from "../authMiddleware/authMiddleware.js";
import bcrypt from "bcryptjs";
import axios from "axios";

import { google } from "googleapis";
import fs from "fs";
import path from "path";
const router = express.Router();

router.post("/addSocialAccount", authMiddleware, async (req, res) => {
  try {
    const {
      companyId,
      platform,
      accountName,
      pageId,
      accessToken,
      tokenExpiry,
    } = req.body;

    if (
      !companyId ||
      !platform ||
      !accountName ||
      !pageId ||
      !accessToken ||
      !tokenExpiry
    ) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields." });
    }
    const existingAccount = await SocialAccount.findOne({
      companyId,
      platform,
      pageId,
    });
    if (existingAccount) {
      return res
        .status(409)
        .json({
          message: "This platform is already connected for this company.",
        });
    }

    const socialAccount = new SocialAccount({
      companyId,
      platform,
      accountName,
      pageId,
      accessToken,
      tokenExpiry,
    });
    await socialAccount.save();
    res
      .status(201)
      .json({
        message: "Social account connected successfully.",
        success: true,
        data: socialAccount,
      });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
router.get(
  "/getSocialAccounts/:companyId",
  authMiddleware,
  async (req, res) => {
    try {
      const { companyId } = req.params;
      const socialAccounts = await SocialAccount.find({ companyId });
      res.status(200).json({ success: true, data: socialAccounts });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
);

router.delete("/deleteSocialAccount/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedAccount = await SocialAccount.findByIdAndDelete(id);
    if (!deletedAccount) {
      return res.status(404).json({ message: "Social account not found." });
    }
    res
      .status(200)
      .json({ message: "Social account deleted successfully.", success: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
router.put("/updateSocialAccount/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { accountName, accessToken, tokenExpiry, pageId } = req.body;
    const updatedAccount = await SocialAccount.findByIdAndUpdate(
      id,
      { accountName, accessToken, tokenExpiry, pageId },
      { new: true },
    );
    if (!updatedAccount) {
      return res.status(404).json({ message: "Social account not found." });
    }
    res
      .status(200)
      .json({
        message: "Social account updated successfully.",
        success: true,
        data: updatedAccount,
      });
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
      },
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
    const { instagramAccountId, accessToken, imageUrl, caption } = req.body;

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
      },
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
      },
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
        },
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
      },
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
        },
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
      },
    );

    return res.status(200).json({
      success: true,
      message: "Reel published successfully.",
      creationId,
      publishId: publishResponse.data.id,
    });
  } catch (error) {
    console.error("Instagram Error:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});

router.get("/youtube/login/:companyId", (req, res) => {
  const { companyId } = req.params;

  const { YOUTUBE_CLIENT_ID, YOUTUBE_REDIRECT_URI } = process.env;

  const scopes = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
  ];

  const authUrl =
    "https://accounts.google.com/o/oauth2/v2/auth" +
    `?client_id=${encodeURIComponent(YOUTUBE_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(YOUTUBE_REDIRECT_URI)}` +
    "&response_type=code" +
    `&scope=${encodeURIComponent(scopes.join(" "))}` +
    "&access_type=offline" +
    "&prompt=consent" +
    `&state=${companyId}`;

  res.redirect(authUrl);
});
router.get("/youtube/callback", async (req, res) => {
  const { code, state } = req.query;

  const companyId = state;

  const {
    YOUTUBE_CLIENT_ID,
    YOUTUBE_CLIENT_SECRET,
    YOUTUBE_REDIRECT_URI,
  } = process.env;

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: YOUTUBE_CLIENT_ID,
        client_secret: YOUTUBE_CLIENT_SECRET,
        redirect_uri: YOUTUBE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const {
      access_token,
      refresh_token,
      expires_in,
    } = tokenResponse.data;

    // Get channel information
    const channelResponse = await axios.get(
      "https://www.googleapis.com/youtube/v3/channels",
      {
        params: {
          part: "snippet",
          mine: true,
          access_token,
        },
      }
    );

    const channel = channelResponse.data.items[0];

    if (!channel) {
      return res.status(400).json({
        success: false,
        message: "Unable to fetch YouTube channel.",
      });
    }

    // Save or Update database
    await SocialAccount.findOneAndUpdate(
      {
        companyId,
        platform: "youtube",
      },
      {
        companyId,
        platform: "youtube",
        accountName: channel.snippet.title,
        pageId: channel.id,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiry: new Date(Date.now() + expires_in * 1000),
        isActive: true,
      },
      {
        new: true,
        upsert: true,
      }
    );

    // Redirect back to frontend
    return res.redirect(
      "http://localhost:3000/social-accounts?youtube=connected"
    );

  } catch (error) {
    console.error(
      "YouTube OAuth Error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});
router.get("/youtube/channel", async (req, res) => {
  const { access_token } = req.query;

  try {
    const channelResponse = await axios.get(
      "https://www.googleapis.com/youtube/v3/channels",
      {
        params: {
          part: "snippet",
          mine: true,
          access_token,
        },
      },
    );

    res.json({
      success: true,
      channel: channelResponse.data.items[0],
    });
  } catch (error) {
    console.error(
      "YouTube Channel Error:",
      error.response?.data || error.message,
    );
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});


router.post("/youtube/upload", async (req, res) => {
  const {
    accessToken,
    title,
    description,
    tags,
    privacyStatus,
    videoUrl,
  } = req.body;

  try {
    // Download video from Cloudinary
    const tempPath = path.join(
      "uploads",
      `video-${Date.now()}.mp4`
    );

    const response = await axios({
      url: videoUrl,
      method: "GET",
      responseType: "stream",
    });

    const writer = fs.createWriteStream(tempPath);

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // Configure OAuth
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });

    // Upload video
    const uploadResponse = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title,
          description,
          tags,
        },
        status: {
          privacyStatus: privacyStatus || "public",
        },
      },
      media: {
        body: fs.createReadStream(tempPath),
      },
    });

    // Delete temporary file
    fs.unlinkSync(tempPath);

    return res.status(200).json({
      success: true,
      message: "Video uploaded successfully.",
      data: uploadResponse.data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
      error: error.response?.data,
    });
  }
});
router.post("/youtube/refresh-token", async (req, res) => {
  const { companyId } = req.body;

  if (!companyId) {
    return res.status(400).json({
      success: false,
      message: "Company ID is required.",
    });
  }

  try {
    const socialAccount = await SocialAccount.findOne({
      companyId,
      platform: "youtube",
    });

    if (!socialAccount) {
      return res.status(404).json({
        success: false,
        message: "YouTube account not connected.",
      });
    }

    if (!socialAccount.refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token not found.",
      });
    }

    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        client_id: process.env.YOUTUBE_CLIENT_ID,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET,
        refresh_token: socialAccount.refreshToken,
        grant_type: "refresh_token",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, expires_in } = tokenResponse.data;

    socialAccount.accessToken = access_token;
    socialAccount.tokenExpiry = new Date(
      Date.now() + expires_in * 1000
    );

    await socialAccount.save();

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully.",
      accessToken: access_token,
      expiresIn: expires_in,
      expiryDate: socialAccount.tokenExpiry,
    });
  } catch (error) {
    console.error(
      "YouTube Refresh Token Error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to refresh YouTube access token.",
      error: error.response?.data || error.message,
    });
  }
});
router.post("/linkedin/post-image", async (req, res) => {
  try {
    const { accessToken, imageUrl, caption } = req.body;

    // Step 1: Register the image upload
    const registerResponse = await axios.post(
      "https://api.linkedin.com/v2/assets?action=registerUpload",
      {
        registerUploadRequest: {
          owner: "urn:li:person:YOUR_PERSON_URN", // Replace with the actual person URN
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          serviceRelationships: [
            {
              identifier: "urn:li:userGeneratedContent",
              relationshipType: "OWNER",
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );
    const { uploadUrl, asset } = registerResponse.data;

    // Step 2: Upload the image
    await axios.put(uploadUrl, null, {
      headers: {
        Authorization: `Bearer
  ${accessToken}`,
        "Content-Type": "application/octet-stream",
      },
    });

    // Step 3: Create a post with the uploaded image
    const postResponse = await axios.post(
      "https://api.linkedin.com/v2/ugcPosts",
      {
        author: "urn:li:person:YOUR_PERSON_URN", // Replace with the actual person URN
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: caption,
            },
            shareMediaCategory: "IMAGE",
            media: [
              {
                status: "READY",
                description: {
                  text: caption,
                },
                media: asset,
                title: {
                  text: caption,
                },
              },
            ],
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );
    res.json({
      success: true,
      data: postResponse.data,
    });
  }
  catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
  
});

export default router;
