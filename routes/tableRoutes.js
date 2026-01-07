const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { protect, restaurantOnly, ensureOwnRestaurant } = require('../middleware/auth');

// All routes require authentication
router.use(protect, restaurantOnly, ensureOwnRestaurant);

// Get all tables for the authenticated restaurant
router.get('/', tableController.getTables);

// Get available tables
router.get('/available', tableController.getAvailableTables);

// Get single table
router.get('/:id', tableController.getTable);

// Create new table
router.post('/', tableController.createTable);

// Update table
router.put('/:id', tableController.updateTable);

// Delete table
router.delete('/:id', tableController.deleteTable);

// Update table status
router.patch('/:id/status', tableController.updateTableStatus);

// Update table position
router.patch('/:id/position', tableController.updateTablePosition);

// Assign order to table
router.post('/:id/assign-order', tableController.assignOrder);

// Create reservation
router.post('/:id/reservation', tableController.createReservation);

// Cancel reservation
router.delete('/:id/reservation', tableController.cancelReservation);

// Merge tables
router.post('/merge', tableController.mergeTables);

// Split tables
router.post('/split', tableController.splitTables);

module.exports = router;
