const express = require("express");
const router = express.Router();

const Company = require("../models/Company");
const authMiddleware = require("../authMiddleware/authMiddleware");

router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      companyName,
      companyLogo,
      companyDescription,
      companyType,
      website,
      email,
      phone,
      address,
      defaultGeminiPrompt,
      timezone,
      postingTime,
    } = req.body;
    if (
      !companyName ||
      !companyDescription ||
      !companyType ||
      !email ||
      !phone ||
      !address ||
      !defaultGeminiPrompt
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

 
    const companyExists = await Company.findOne({
      companyName: companyName.trim(),
    });

    if (companyExists) {
      return res.status(409).json({
        success: false,
        message: "Company already exists.",
      });
    }

    const emailExists = await Company.findOne({
      email: email.toLowerCase(),
    });

    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: "Email already exists.",
      });
    }

    const slug = companyName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");

    const company = await Company.create({
      companyName: companyName.trim(),
      companyLogo: companyLogo || null,
      companyDescription: companyDescription.trim(),
      companyType,
      website: website || null,
      email: email.toLowerCase(),
      phone,
      address,
      defaultGeminiPrompt,
      slug,
      timezone: timezone || "Asia/Karachi",
      postingTime: postingTime || "09:00",
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Company created successfully.",
      data: company,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

module.exports = router;