// =========================
// IMPORTS (TOP OF FILE// IMPORTS (TOP OF FILE)
const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// =========================
// ROUTER INIT
// =========================
const router = express.Router();

// =========================
// CONTROLLERS & MODELS
// =========================
const userController = require("../controllers/userController");
const UserModel = require("../models/User");

// =========================
// USER ROUTES
// =========================
router.get("/users", userController.getUsers);
router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);

router.put("/update/:id", userController.updateUser);
router.put("/archive/:id", userController.archiveUser);
router.put("/restore/:id", userController.restoreUser);

router.get("/verify/:token", userController.verifyEmail);

router.post("/send-otp", userController.sendOtp);
router.post("/verify-otp", userController.verifyOtp);

router.put("/location/:id", userController.updateLocation);
router.put("/twofactor/:id", userController.toggleTwoFactor);

router.get("/:id", userController.getUserById);

// =========================
// AVATAR UPLOAD SETUP
// =========================

// ✅ Ensure avatars directory exists
const avatarsDir = path.join(__dirname, "../uploads/avatars");
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

// ✅ Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.params.id}-${Date.now()}${ext}`);
  },
});

// ✅ Accept images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

// =========================
// AVATAR UPLOAD ROUTE
// IMPORTANT: POST (NOT PUT)
// =========================
router.post(
  "/avatar/:id",
  upload.single("avatar"), // MUST MATCH FormData.append("avatar")
  async (req, res) => {
    try {
      console.log("✅ Uploaded file:", req.file);

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      const user = await UserModel.findByIdAndUpdate(
        req.params.id,
        { avatar: avatarUrl },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "Avatar updated successfully",
        avatar: avatarUrl,
        user,
      });
    } catch (err) {
      console.error("AVATAR UPLOAD ERROR:", err);
      res.status(500).json({ message: "Avatar upload failed" });
    }
  }
);

// =========================
// EXPORT ROUTER
// =========================
module.exports = router;
