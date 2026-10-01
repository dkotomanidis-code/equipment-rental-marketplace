const express = require('express');
const router = express.Router();

// Mock database (replace with actual DB)
const equipment = [];
let equipmentIdCounter = 1;

// Middleware to verify token
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  // For demo, we'll extract user ID from token (in production, verify JWT)
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    req.userId = decoded.id || 1; // Default to user 1 for demo
  } catch {
    req.userId = 1; // Default to user 1 for demo
  }
  next();
};

// GET all equipment (public)
router.get('/', (req, res) => {
  try {
    const { search, category } = req.query;
    let results = equipment;

    if (search) {
      results = results.filter(
        (item) =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (category) {
      results = results.filter((item) => item.category === category);
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching equipment: ' + err.message });
  }
});

// GET my equipment (authenticated)
router.get('/my-equipment', authMiddleware, (req, res) => {
  try {
    const myEquipment = equipment.filter((item) => item.ownerId === req.userId);
    res.json(myEquipment);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching equipment: ' + err.message });
  }
});

// GET single equipment by ID
router.get('/:id', (req, res) => {
  try {
    const item = equipment.find((e) => e.id === parseInt(req.params.id));
    if (!item) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching equipment: ' + err.message });
  }
});

// CREATE equipment (authenticated)
router.post('/', authMiddleware, (req, res) => {
  try {
    const {
      name,
      category,
      year,
      model,
      manufacturer,
      condition,
      description,
      features,
      pricePerDay,
      location,
      imageUrl,
      comments,
    } = req.body;

    // Validate required fields
    if (!name || !category || !pricePerDay || !description) {
      return res.status(400).json({
        message: 'Missing required fields: name, category, pricePerDay, description',
      });
    }

    const newEquipment = {
      id: equipmentIdCounter++,
      ownerId: req.userId,
      name,
      category,
      year: year || new Date().getFullYear(),
      model: model || '',
      manufacturer: manufacturer || '',
      condition: condition || 'good',
      description,
      features: features || '',
      pricePerDay: parseFloat(pricePerDay),
      location: location || '',
      imageUrl: imageUrl || 'https://via.placeholder.com/300',
      comments: comments || '',
      availability: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    equipment.push(newEquipment);

    res.status(201).json({
      message: 'Equipment listed successfully',
      equipment: newEquipment,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error creating equipment: ' + err.message });
  }
});

// UPDATE equipment (authenticated, owner only)
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const item = equipment.find((e) => e.id === parseInt(req.params.id));

    if (!item) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    if (item.ownerId !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized to update this equipment' });
    }

    const { name, category, year, model, manufacturer, condition, description, features, pricePerDay, location, imageUrl, comments, availability } = req.body;

    if (name) item.name = name;
    if (category) item.category = category;
    if (year) item.year = year;
    if (model) item.model = model;
    if (manufacturer) item.manufacturer = manufacturer;
    if (condition) item.condition = condition;
    if (description) item.description = description;
    if (features) item.features = features;
    if (pricePerDay) item.pricePerDay = parseFloat(pricePerDay);
    if (location) item.location = location;
    if (imageUrl) item.imageUrl = imageUrl;
    if (comments) item.comments = comments;
    if (availability !== undefined) item.availability = availability;

    item.updatedAt = new Date().toISOString();

    res.json({
      message: 'Equipment updated successfully',
      equipment: item,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error updating equipment: ' + err.message });
  }
});

// DELETE equipment (authenticated, owner only)
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const index = equipment.findIndex((e) => e.id === parseInt(req.params.id));

    if (index === -1) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    if (equipment[index].ownerId !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this equipment' });
    }

    const deleted = equipment.splice(index, 1);

    res.json({
      message: 'Equipment deleted successfully',
      equipment: deleted[0],
    });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting equipment: ' + err.message });
  }
});

module.exports = router;