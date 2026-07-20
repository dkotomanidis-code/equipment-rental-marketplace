const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authenticateToken = require('../middleware/auth');
const { users, equipment } = require('../database/store');

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Get all equipment
router.get('/', (req, res) => {
  const { category, search } = req.query;
  let filtered = equipment;

  if (category) {
    filtered = filtered.filter((e) => e.category === category);
  }

  if (search) {
    filtered = filtered.filter(
      (e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.description.toLowerCase().includes(search.toLowerCase())
    );
  }

  res.json(filtered);
});

// Get equipment listed by a specific owner
router.get('/owner/:userId', (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const ownerItems = equipment.filter((e) => e.ownerId === userId);
  res.json(ownerItems);
});

// Get single equipment
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const item = equipment.find((e) => e.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Equipment not found' });
  }
  res.json(item);
});

// Create equipment (requires auth)
router.post('/', writeLimiter, authenticateToken, (req, res) => {
  const { name, description, category, pricePerDay, location, imageUrl } = req.body;

  if (!name || !pricePerDay) {
    return res.status(400).json({ error: 'Name and price per day are required' });
  }

  const owner = users.find((u) => u.id === req.user.id);

  const newEquipment = {
    id: Date.now(),
    ownerId: req.user.id,
    ownerName: owner ? owner.username : 'Unknown',
    name,
    description,
    category,
    pricePerDay: parseFloat(pricePerDay),
    location,
    imageUrl: imageUrl || null,
    availabilityStatus: true,
    createdAt: new Date(),
  };

  equipment.push(newEquipment);
  res.status(201).json(newEquipment);
});

// Update equipment (only owner can edit)
router.put('/:id', writeLimiter, authenticateToken, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const item = equipment.find((e) => e.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Equipment not found' });
  }

  if (item.ownerId !== req.user.id) {
    return res.status(403).json({ error: 'You can only edit your own listings' });
  }

  const { name, description, category, pricePerDay, location, imageUrl } = req.body;
  Object.assign(item, {
    ...(name !== undefined && { name }),
    ...(description !== undefined && { description }),
    ...(category !== undefined && { category }),
    ...(pricePerDay !== undefined && { pricePerDay: parseFloat(pricePerDay) }),
    ...(location !== undefined && { location }),
    ...(imageUrl !== undefined && { imageUrl }),
  });
  res.json(item);
});

// Delete equipment (only owner can delete)
router.delete('/:id', writeLimiter, authenticateToken, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = equipment.findIndex((e) => e.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Equipment not found' });
  }

  if (equipment[index].ownerId !== req.user.id) {
    return res.status(403).json({ error: 'You can only delete your own listings' });
  }

  equipment.splice(index, 1);
  res.json({ message: 'Equipment deleted' });
});

module.exports = router;
