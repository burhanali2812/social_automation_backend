import express from "express";
import Company from "../models/Company.js";
import authMiddleware from "../authMiddleware/authMiddleware.js";

const router = express.Router();

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
      facebook,
      instagram,
      linkedin,
      youtube,
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
      socialMediaLinks: {
        facebook: facebook || null,
        instagram: instagram || null,
        linkedin: linkedin || null,
        youtube: youtube || null,
      },
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

router.get("/getAllCompanies", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admins only.",
    });
  }
  try {
    const companies = await Company.find().sort({ createdAt: -1 }); 
    if (!companies || companies.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No companies found.",
      });
    }
    return res.status(200).json({
      success: true,
      data: companies,
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
router.delete("/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admins only.",
    });
  }
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found.",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Company deleted successfully.",
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

export default router;