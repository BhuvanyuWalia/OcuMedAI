const Report = require("../models/report");
const User = require("../models/user");
const axios = require("axios");
const FormData = require("form-data");

module.exports.renderNewReportForm = (req, res) => {
  res.render("reports/new_report");
};

module.exports.submitReport = async (req, res) => {
  if (!req.file) {
    req.flash("error", "Image is required.");
    return res.redirect("/reports/new");
  }

  const { age, sex, BMI, smokingStatus } = req.body.report;
  const imageUrl = req.file.path;

  // Fetch image bytes from Cloudinary
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const imageBuffer = Buffer.from(response.data);

  // Prepare form-data for FastAPI
  const form = new FormData();
  form.append("image", imageBuffer, { filename: "image.jpg" });
  form.append("age", age);
  form.append("sex", sex);
  form.append("BMI", BMI);
  form.append("smokingStatus", smokingStatus);

  // Call FastAPI
  let predictions;
  try {
    const apiResponse = await axios.post("https://ocumedsweb.azurewebsites.net/predict", form, {
      headers: form.getHeaders()
    });
    predictions = apiResponse.data;
  } catch (err) {
    console.error("API error:", err.message);
    req.flash("error", "Prediction failed. Try again.");
    return res.redirect("/reports/new");
  }

  // Save to MongoDB
  const report = new Report({
    user: req.user._id,
    age,
    sex,
    BMI,
    smokingStatus,
    imageUrl,
    diabeticRetinopathyLevel: predictions.diabeticRetinopathyLevel,
    hypertensionRisk: predictions.hypertensionRisk,
    hba1cLevel: predictions.hba1cLevel,
    atherosclerosisRisk: predictions.atherosclerosisRisk
    });

  await report.save();
  req.flash("success", "Report generated and saved successfully!");
  res.redirect("/reports");
};

module.exports.listReports = async (req, res) => {
  const reports = await Report.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.render("reports/index", { reports });
};

module.exports.showReport = async (req, res) => {
  const report = await Report.findById(req.params.id).populate("user");
  if (!report) {
    req.flash("error", "Report not found.");
    return res.redirect("/dashboard");
  }
  res.render("reports/show_report", { report });
};
