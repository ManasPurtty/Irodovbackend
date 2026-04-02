const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const multer =require("multer");
const Image = require("./Models/Image");
const dotenv = require("dotenv");


const enrollRoutes = require("./Route/enroll");
//for env variable
require("dotenv").config();
// Database connection
require('./config/mongoose-connect');






// Routers
const ownerRouter = require('./Route/ownerRouter');


app.use(cors({
  origin: 'https://irodovplusclasses.onrender.com', // or '*' for all origins (not recommended for production)
  credentials: true // if you use cookies
}));



// Middleware setup
app.use(express.json()); // Required for JSON body parsing
app.use(express.urlencoded({ extended: true })); // For form submissions
app.use(cookieParser());



app.get("/",(req,res)=>{
  res.send("welcome");
})

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



//
app.use("/api/enroll", enrollRoutes);



// Server start
app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
