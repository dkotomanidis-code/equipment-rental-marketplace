const express = require('express');
const router = express.Router();

// Mock database
const equipment = [];

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

// Get single equipment
router.get('/:id', (req, res) => {
  const item = equipment.find((e) => e.id == req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Equipment not found' });
  }
  res.json(item);
});

// Create equipment (owner only)
router.post('/', (req, res) => {
  const { name, description, category, pricePerDay, location } = req.body;

  const newEquipment = {
    id: Date.now(),
    ownerId: req.user?.id || 1,
    name,
    description,
    category,
    pricePerDay,
    location,
    availabilityStatus: true,
    createdAt: new Date(),
  };

  equipment.push(newEquipment);
  res.status(201).json(newEquipment);
});

// Update equipment
router.put('/:id', (req, res) => {
  const item = equipment.find((e) => e.id == req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Equipment not found' });
  }

  Object.assign(item, req.body);
  res.json(item);
});

// Delete equipment
router.delete('/:id', (req, res) => {
  const index = equipment.findIndex((e) => e.id == req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Equipment not found' });
  }

  equipment.splice(index, 1);
  res.json({ message: 'Equipment deleted' });
});

module.exports = router;
