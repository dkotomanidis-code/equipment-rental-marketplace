const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock database for demo (replace with actual DB)
const users = [];

// Sign Up
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Check if user exists
    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: Date.now(),
      email,
      password: hashedPassword,
    };

    users.push(user);

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: 'Signup error: ' + err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;