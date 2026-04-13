// controllers/GuidelineController.js
const PostingGuideline = require("../models/Guidelines");

// ✅ Create a new guideline
const createGuideline = async (req, res) => {
  try {
    const attachments = (req.files || []).map(file => ({
      fileName: file.originalname,
      fileUrl: `http://localhost:8000/uploads/guidelines/${file.filename}`, // ✅ updated path
    }));

    const guideline = await PostingGuideline.create({
      ...req.body,
      attachments,
    });

    return res.status(201).json(guideline);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
};

// GET /published
const getPublishedGuidelines = async (req, res) => {
  try {
    const guidelines = await PostingGuideline.find({ status: "published" })
      .sort({ priorityLevel: -1, createdAt: -1 });

    res.json(guidelines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// controllers/GuidelineController.js
const incrementViews = async (req, res) => {
  try {
    const guideline = await PostingGuideline.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!guideline) return res.status(404).json({ message: "Guideline not found" });
    res.json(guideline);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


// ✅ Get all guidelines
const getGuidelines = async (req, res) => {


  try {
      const users = await PostingGuideline.find(); // get ALL documents
      console.log(users);
    } catch (error) {
      console.error(error);
    }

  try {
    const { status, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const guidelines = await PostingGuideline.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(guidelines);
  } catch (err) {
    console.error("Error fetching guidelines:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get a single guideline by ID
const getGuidelineById = async (req, res) => {
  try {
    const guideline = await PostingGuideline.findById(req.params.id)
      .populate("createdBy", "name email");

    if (!guideline) return res.status(404).json({ message: "Guideline not found" });
    res.json(guideline);
  } catch (err) {
    console.error("Error fetching guideline:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update a guideline
const updateGuideline = async (req, res) => {
  try {
    const guideline = await PostingGuideline.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!guideline) return res.status(404).json({ message: "Guideline not found" });
    res.json(guideline);
  } catch (err) {
    console.error("Error updating guideline:", err);
    res.status(400).json({ error: err.message });
  }
};

// ✅ Delete a guideline
const deleteGuideline = async (req, res) => {
  try {
    const guideline = await PostingGuideline.findByIdAndDelete(req.params.id);

    if (!guideline) return res.status(404).json({ message: "Guideline not found" });
    res.json({ message: "Guideline deleted successfully" });
  } catch (err) {
    console.error("Error deleting guideline:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createGuideline,
  getGuidelines,
  getGuidelineById,
  updateGuideline,
  deleteGuideline,
  incrementViews,
};