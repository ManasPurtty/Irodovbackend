const express = require('express');
const router = express.Router();
const multer = require('multer');
const Resource = require('../Models/Resource');

// Multer memory storage configuration with PDF validation
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 30 * 1024 * 1024 // 30 MB maximum
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files (.pdf) are allowed!'), false);
    }
  }
});

// 1. UPLOAD PDF CLASS MATERIAL (ADMIN)
router.post('/upload', (req, res) => {
  upload.single('pdf')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'File upload error' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Please select a PDF file to upload' });
      }

      const { title, description, subject, classGrade, chapter } = req.body;

      if (!title || title.trim() === '') {
        return res.status(400).json({ success: false, message: 'Title is required for the resource' });
      }

      const resource = new Resource({
        title: title.trim(),
        description: description ? description.trim() : '',
        subject: subject ? subject.trim() : 'Physics',
        classGrade: classGrade ? classGrade.trim() : 'All Classes',
        chapter: chapter ? chapter.trim() : '',
        pdf: {
          data: req.file.buffer,
          contentType: req.file.mimetype || 'application/pdf',
          fileName: req.file.originalname,
          fileSize: req.file.size
        },
        uploadedBy: 'JD Sir (Admin)'
      });

      await resource.save();

      return res.status(201).json({
        success: true,
        message: 'Class material PDF uploaded successfully!',
        resource: {
          _id: resource._id,
          title: resource.title,
          description: resource.description,
          subject: resource.subject,
          classGrade: resource.classGrade,
          chapter: resource.chapter,
          fileName: resource.pdf.fileName,
          fileSize: resource.pdf.fileSize,
          createdAt: resource.createdAt
        }
      });
    } catch (error) {
      console.error('Resource upload error:', error);
      return res.status(500).json({ success: false, message: 'Server error while saving resource' });
    }
  });
});

// 2. GET ALL RESOURCES (Metadata list - excludes large PDF binary data for speed)
router.get('/', async (req, res) => {
  try {
    const { subject, classGrade, search } = req.query;

    const query = {};

    if (subject && subject !== 'All') {
      query.subject = subject;
    }

    if (classGrade && classGrade !== 'All') {
      query.classGrade = classGrade;
    }

    if (search && search.trim() !== '') {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { chapter: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const resources = await Resource.find(query)
      .select('-pdf.data')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: resources.length,
      resources
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch class materials' });
  }
});

// 3. VIEW PDF (INLINE IN BROWSER)
router.get('/:id/view', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource || !resource.pdf || !resource.pdf.data) {
      return res.status(404).send('PDF not found');
    }

    const sanitizedFileName = encodeURIComponent(resource.pdf.fileName || 'material.pdf');
    res.setHeader('Content-Type', resource.pdf.contentType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${sanitizedFileName}"; filename*=UTF-8''${sanitizedFileName}`);
    res.setHeader('Content-Length', resource.pdf.data.length);

    return res.send(resource.pdf.data);
  } catch (error) {
    console.error('Error viewing PDF:', error);
    return res.status(500).send('Error loading PDF');
  }
});

// 4. DOWNLOAD PDF (ATTACHMENT)
router.get('/:id/download', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource || !resource.pdf || !resource.pdf.data) {
      return res.status(404).send('PDF not found');
    }

    const sanitizedFileName = encodeURIComponent(resource.pdf.fileName || 'material.pdf');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFileName}"; filename*=UTF-8''${sanitizedFileName}`);
    res.setHeader('Content-Length', resource.pdf.data.length);

    return res.send(resource.pdf.data);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    return res.status(500).send('Error downloading PDF');
  }
});

// 5. DELETE RESOURCE (ADMIN)
router.delete('/:id', async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Resource deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting resource:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete resource' });
  }
});

module.exports = router;
