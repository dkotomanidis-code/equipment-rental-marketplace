const express = require('express');
const router = express.Router();

// Mock database (replace with actual DB)
const users = [];
const verificationLogs = [];
const trustBadges = [];

// Middleware to verify token
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    req.userId = decoded.id || 1;
  } catch {
    req.userId = 1;
  }
  next();
};

// GET user profile by ID
router.get('/:userId', (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's badges
    const userBadges = trustBadges.filter(b => b.userId === userId);

    // Don't send sensitive data publicly
    const publicProfile = {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
      bio: user.bio,
      isOwner: user.isOwner,
      verificationStatus: user.verificationStatus,
      idVerified: user.idVerified,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      trustScore: user.trustScore,
      totalRentals: user.totalRentals,
      badges: userBadges,
      createdAt: user.createdAt,
    };

    res.json(publicProfile);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile: ' + err.message });
  }
});

// GET my profile (authenticated)
router.get('/profile/me', authMiddleware, (req, res) => {
  try {
    const user = users.find(u => u.id === req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userBadges = trustBadges.filter(b => b.userId === req.userId);
    const verificationHistory = verificationLogs.filter(v => v.userId === req.userId);

    const profile = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      profilePicture: user.profilePicture,
      bio: user.bio,
      isRenter: user.isRenter,
      isOwner: user.isOwner,
      verificationStatus: user.verificationStatus,
      idVerified: user.idVerified,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      trustScore: user.trustScore,
      totalRentals: user.totalRentals,
      totalEarnings: user.totalEarnings,
      badges: userBadges,
      verificationHistory: verificationHistory,
      createdAt: user.createdAt,
    };

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile: ' + err.message });
  }
});

// UPDATE profile (authenticated)
router.put('/profile/update', authMiddleware, (req, res) => {
  try {
    let user = users.find(u => u.id === req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { firstName, lastName, phone, profilePicture, bio, isOwner } = req.body;

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (profilePicture) user.profilePicture = profilePicture;
    if (bio) user.bio = bio;
    if (isOwner !== undefined) user.isOwner = isOwner;

    user.updatedAt = new Date().toISOString();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        profilePicture: user.profilePicture,
        bio: user.bio,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile: ' + err.message });
  }
});

// REQUEST ID verification (authenticated)
router.post('/verification/request-id', authMiddleware, (req, res) => {
  try {
    const { idDocumentUrl } = req.body;

    if (!idDocumentUrl) {
      return res.status(400).json({ message: 'ID document URL is required' });
    }

    const user = users.find(u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.idDocumentUrl = idDocumentUrl;
    user.verificationStatus = 'pending';

    const log = {
      id: verificationLogs.length + 1,
      userId: req.userId,
      verificationType: 'id',
      status: 'pending',
      documentUrl: idDocumentUrl,
      createdAt: new Date().toISOString(),
    };

    verificationLogs.push(log);

    res.status(201).json({
      message: 'ID verification request submitted. Please wait for admin review.',
      verification: log,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error requesting verification: ' + err.message });
  }
});

// REQUEST phone verification (authenticated)
router.post('/verification/request-phone', authMiddleware, (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const user = users.find(u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.phone = phone;
    user.phoneVerified = true; // In real app, send OTP first

    const log = {
      id: verificationLogs.length + 1,
      userId: req.userId,
      verificationType: 'phone',
      status: 'verified',
      verifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    verificationLogs.push(log);

    res.json({
      message: 'Phone verified successfully',
      verification: log,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error verifying phone: ' + err.message });
  }
});

// REQUEST email verification (authenticated)
router.post('/verification/request-email', authMiddleware, (req, res) => {
  try {
    const user = users.find(u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.emailVerified = true; // In real app, send verification email

    const log = {
      id: verificationLogs.length + 1,
      userId: req.userId,
      verificationType: 'email',
      status: 'verified',
      verifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    verificationLogs.push(log);

    res.json({
      message: 'Email verified successfully',
      verification: log,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error verifying email: ' + err.message });
  }
});

// GET verification status
router.get('/verification/status/:userId', (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      userId: user.id,
      verificationStatus: user.verificationStatus,
      idVerified: user.idVerified,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      verificationDate: user.verificationDate,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching verification status: ' + err.message });
  }
});

// GET trust badges
router.get('/:userId/badges', (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const badges = trustBadges.filter(b => b.userId === userId);

    res.json(badges);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching badges: ' + err.message });
  }
});

// GET user trust score
router.get('/:userId/trust-score', (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const badges = trustBadges.filter(b => b.userId === userId);

    res.json({
      userId: user.id,
      trustScore: user.trustScore,
      totalRentals: user.totalRentals,
      badges: badges,
      verifications: {
        idVerified: user.idVerified,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching trust score: ' + err.message });
  }
});

module.exports = router;