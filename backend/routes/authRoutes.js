const express = require("express");
const router = express.Router();

const {
  register,
  login,
  logout,
  getCurrentUser,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

/**
 * Auth Routes
 * -------------
 * Base path (mounted in server.js): /api/auth
 */

// POST /api/auth/register  -> public passenger registration
router.post("/register", register);

// POST /api/auth/login     -> passenger (email) or admin (email or adminUserId) login
router.post("/login", login);

// POST /api/auth/logout    -> clears the auth cookie (safe even if not logged in)
router.post("/logout", logout);

// GET  /api/auth/me        -> returns the current authenticated user; requires a valid session
router.get("/me", protect, getCurrentUser);

module.exports = router;