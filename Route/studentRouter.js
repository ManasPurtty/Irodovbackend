const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Student = require('../Models/Student');

const JWT_SECRET = process.env.JWT_KEY || 'irodov_default_jwt_secret_key_2025';

// Helper to generate token for student
const generateStudentToken = (student) => {
  return jwt.sign(
    { id: student._id, email: student.email, role: 'student', fullname: student.fullname },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Middleware to authenticate student token
const authenticateStudent = (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.studentToken) {
    token = req.cookies.studentToken;
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authorization token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.student = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// 1. REGISTER STUDENT
router.post('/register', async (req, res) => {
  try {
    const { fullname, email, password, phone, classGrade } = req.body;

    if (!fullname || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if student already exists
    const existingStudent = await Student.findOne({ email: normalizedEmail });
    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: 'A student account with this email already exists. Please login instead.'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create student
    const newStudent = new Student({
      fullname: fullname.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone ? phone.trim() : '',
      classGrade: classGrade ? classGrade.trim() : 'Class 12'
    });

    await newStudent.save();

    const token = generateStudentToken(newStudent);

    // Set HTTP-only cookie
    res.cookie('studentToken', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(201).json({
      success: true,
      message: 'Student registered successfully!',
      token,
      student: {
        id: newStudent._id,
        fullname: newStudent.fullname,
        email: newStudent.email,
        phone: newStudent.phone,
        classGrade: newStudent.classGrade,
        createdAt: newStudent.createdAt,
        role: 'student'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
});

// 2. LOGIN STUDENT
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find student
    const student = await Student.findOne({ email: normalizedEmail });
    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateStudentToken(student);

    res.cookie('studentToken', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      student: {
        id: student._id,
        fullname: student.fullname,
        email: student.email,
        phone: student.phone,
        classGrade: student.classGrade,
        createdAt: student.createdAt,
        role: 'student'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login'
    });
  }
});

// 3. GET CURRENT STUDENT PROFILE
router.get('/me', authenticateStudent, async (req, res) => {
  try {
    const student = await Student.findById(req.student.id).select('-password');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    return res.status(200).json({
      success: true,
      student: {
        ...student.toObject(),
        role: 'student'
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile' });
  }
});

// 4. GET ALL STUDENTS (For Admin dashboard)
router.get('/all', async (req, res) => {
  try {
    const students = await Student.find().select('-password').sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch students' });
  }
});

// 5. LOGOUT
router.post('/logout', (req, res) => {
  res.clearCookie('studentToken');
  res.clearCookie('token');
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
