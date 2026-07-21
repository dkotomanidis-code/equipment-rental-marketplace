const express = require('express');
const router = express.Router();

// Shared mock database (in-memory for demo)
// In production this would be replaced with a real DB
const ownerEquipment = [];
const rentalHistory = [];

// GET /api/owner/equipment - Get all equipment for the logged-in owner
router.get('/', (req, res) => {
  const ownerId = req.user?.id || 1;
  const items = ownerEquipment.filter((e) => e.ownerId === ownerId);
  res.json(items);
});

// GET /api/owner/equipment/:id/rentals - Get rental history for an equipment item
router.get('/:id/rentals', (req, res) => {
  const ownerId = req.user?.id || 1;
  const item = ownerEquipment.find((e) => e.id == req.params.id && e.ownerId === ownerId);
  if (!item) {
    return res.status(404).json({ error: 'Equipment not found' });
  }
  const history = rentalHistory.filter((r) => r.equipmentId == req.params.id);
  res.json(history);
});

// POST /api/owner/equipment - Add new equipment
router.post('/', (req, res) => {
  const { name, description, category, pricePerDay, condition, year, location, imageUrl } = req.body;

  if (!name || !pricePerDay) {
    return res.status(400).json({ error: 'name and pricePerDay are required' });
  }

  const newItem = {
    id: Date.now(),
    ownerId: req.user?.id || 1,
    name,
    description: description || '',
    category: category || 'other',
    pricePerDay: parseFloat(pricePerDay),
    condition: condition || 'good',
    year: year ? parseInt(year, 10) : null,
    location: location || '',
    imageUrl: imageUrl || '',
    availabilityStatus: true,
    createdAt: new Date(),
  };

  ownerEquipment.push(newItem);
  res.status(201).json(newItem);
});

// PUT /api/owner/equipment/:id - Update equipment details
router.put('/:id', (req, res) => {
  const ownerId = req.user?.id || 1;
  const item = ownerEquipment.find((e) => e.id == req.params.id && e.ownerId === ownerId);
  if (!item) {
    return res.status(404).json({ error: 'Equipment not found' });
  }

  const { name, description, category, pricePerDay, condition, year, location, imageUrl } = req.body;
  if (name !== undefined) item.name = name;
  if (description !== undefined) item.description = description;
  if (category !== undefined) item.category = category;
  if (pricePerDay !== undefined) item.pricePerDay = parseFloat(pricePerDay);
  if (condition !== undefined) item.condition = condition;
  if (year !== undefined) item.year = year ? parseInt(year, 10) : null;
  if (location !== undefined) item.location = location;
  if (imageUrl !== undefined) item.imageUrl = imageUrl;

  res.json(item);
});

// PATCH /api/owner/equipment/:id/toggle-availability - Toggle active/inactive
router.patch('/:id/toggle-availability', (req, res) => {
  const ownerId = req.user?.id || 1;
  const item = ownerEquipment.find((e) => e.id == req.params.id && e.ownerId === ownerId);
  if (!item) {
    return res.status(404).json({ error: 'Equipment not found' });
  }

  item.availabilityStatus = !item.availabilityStatus;
  res.json(item);
});

// DELETE /api/owner/equipment/:id - Remove equipment listing
router.delete('/:id', (req, res) => {
  const ownerId = req.user?.id || 1;
  const index = ownerEquipment.findIndex((e) => e.id == req.params.id && e.ownerId === ownerId);
  if (index === -1) {
    return res.status(404).json({ error: 'Equipment not found' });
  }

  ownerEquipment.splice(index, 1);
  res.json({ message: 'Equipment deleted' });
});

module.exports = router;
