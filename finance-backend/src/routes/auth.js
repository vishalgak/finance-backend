const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authenticate = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../validators/routeValidators');

/**
 * @route   POST /register
 * @desc    Register a new user
 */
router.post('/register', validateRegister, authController.register);

/**
 * @route   POST /login
 * @desc    Login an existing user
 */
router.post('/login', validateLogin, authController.login);

/**
 * @route   GET /me
 * @desc    Get current authenticated user profile
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @route   PUT /change-password
 * @desc    Change authenticated user's password
 */
router.put('/change-password', authenticate, authController.changePassword);

module.exports = router;
