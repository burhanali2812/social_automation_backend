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
        const { accountName, accessToken, tokenExpiry } = req.body;
        const updatedAccount = await SocialAccount.findByIdAndUpdate(id, { accountName, accessToken, tokenExpiry }, { new: true });
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
export default router;