const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { protect, restaurantOnly, ensureOwnRestaurant } = require('../middleware/auth');

// Public routes
router.post('/login', staffController.staffLogin);

// Protected routes - require authentication
router.use(protect, restaurantOnly, ensureOwnRestaurant);

// Get all staff for the authenticated restaurant
router.get('/', staffController.getAllStaff);

// Get active staff
router.get('/active', staffController.getActiveStaff);

// Get staff by role
router.get('/role/:role', staffController.getStaffByRole);

// Get online staff
router.get('/online', staffController.getOnlineStaff);

// Get single staff member
router.get('/:id', staffController.getStaff);

// Create new staff member (requires manage staff permission)
router.post('/', staffController.createStaff);

// Update staff member (requires manage staff permission)
router.put('/:id', staffController.updateStaff);

// Update staff password
router.patch('/:id/password', staffController.updatePassword);

// Delete staff member (requires manage staff permission)
router.delete('/:id', staffController.deleteStaff);

// Update staff status (requires manage staff permission)
router.patch('/:id/status', staffController.updateStatus);

// Shift management
router.post('/:id/shifts', staffController.addShift);
router.patch('/:id/shifts/:shiftId', staffController.updateShift);

// Activity tracking
router.get('/:id/activities', staffController.getActivities);

// Logout
router.post('/:id/logout', staffController.staffLogout);

module.exports = router;
