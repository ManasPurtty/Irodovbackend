const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const multer = require("multer");
const Image = require("./Models/Image");
const dotenv = require("dotenv");

const enrollRoutes = require("./Route/enroll");
// for env variable
require("dotenv").config();
// Database connection
require('./config/mongoose-connect');

// Routers
const ownerRouter = require('./Route/ownerRouter');
const studentRouter = require('./Route/studentRouter');
const resourceRouter = require('./Route/resourceRouter');

const allowedOrigins = [
  'https://irodovplusclasses.in',
  'https://irodovplusclasses.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, '');
    if (
      allowedOrigins.indexOf(origin) !== -1 ||
      allowedOrigins.indexOf(cleanOrigin) !== -1 ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Middleware setup
app.use(express.json()); // Required for JSON body parsing
app.use(express.urlencoded({ extended: true })); // For form submissions
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("welcome");
});

app.use(express.static(path.join(__dirname, 'public')));
app.set("view engine", "ejs");

// Routes
app.use('/owners', ownerRouter);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Upload image
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const image = new Image({
      name: req.body.name,
      image: {
        data: req.file.buffer,
        contentType: req.file.mimetype
      }
    });

    await image.save();
    res.json({ message: "Image uploaded successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
});

app.get("/images", async (req, res) => {
  try {
    const images = await Image.find();
    res.json(images);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch images" });
  }
});

// API Routes
app.use("/api/enroll", enrollRoutes);
app.use("/enroll", enrollRoutes);
app.use("/api/students", studentRouter);
app.use("/api/resources", resourceRouter);

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
