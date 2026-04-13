const multer = require("multer"); 
const path = require("path");
const fs = require("fs");

// =======================
// ✅ Fixed folder for guideline uploads
// =======================
const guidelineDir = path.join(__dirname, "../uploads/guidelines");
if (!fs.existsSync(guidelineDir)) fs.mkdirSync(guidelineDir, { recursive: true });

// Storage configuration for guidelines
const guidelineStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("Saving guideline file to:", guidelineDir); // 🔹 debug destination
    cb(null, guidelineDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    console.log("Uploading guideline file:", file.originalname, "as", uniqueSuffix + "-" + file.originalname); // 🔹 debug filename
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

// =======================
// ✅ Fixed folder for inventory/proof uploads (goods/monetary)
// =======================
const proofDir = path.join(__dirname, "../uploads/proofs");
if (!fs.existsSync(proofDir)) fs.mkdirSync(proofDir, { recursive: true });

// Storage configuration for proofs
const proofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("Saving proof file to:", proofDir); // 🔹 debug destination
    cb(null, proofDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    console.log("Uploading proof file:", file.originalname, "as", uniqueSuffix + "-" + file.originalname); // 🔹 debug filename
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

// Accept only images and PDFs for proofs
const proofFileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|pdf/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext)) {
    console.log("Proof file accepted:", file.originalname);
    cb(null, true);
  } else {
    cb(new Error("Only images and PDF files are allowed for proofs"));
  }
};

const uploadDir = path.join(__dirname, "../uploads/guidelines");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => cb(null, true);

// =======================
// ✅ Multer instances
// =======================
const uploadGuideline = multer({ storage: guidelineStorage, fileFilter: (req, file, cb) => cb(null, true) });
const uploadProof = multer({ storage: proofStorage, fileFilter: proofFileFilter });
const upload = multer({ storage, fileFilter });

// Debug helper (optional)
uploadGuideline.debugMiddleware = (req, res, next) => {
  console.log("Request files (guideline):", req.files);
  console.log("Request body (guideline):", req.body);
  next();
};

uploadProof.debugMiddleware = (req, res, next) => {
  console.log("Request files (proof):", req.files);
  console.log("Request body (proof):", req.body);
  next();
};

// =======================
// ✅ Export
// =======================
module.exports = {
  uploadGuideline,
  uploadProof,
  upload
};