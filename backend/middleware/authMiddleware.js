const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { COOKIE_NAME } = require("../controllers/authController");

/**
 * Authentication & Authorization Middleware
 * --------------------------------------------
 * protect        — verifies the JWT from the HTTP-only cookie, loads the
 *                   user fresh from the database, and attaches it to
 *                   req.user. Rejects the request if the token is
 *                   missing, invalid, expired, or the user no longer
 *                   exists/is inactive.
 *
 * requireRole()  — authorization layer, used AFTER protect. Restricts a
 *                   route to one or more roles (e.g. requireRole("admin")).
 *
 * requireOwnershipOrAdmin() — for passenger-specific resources where
 *                   either the resource owner OR an admin should be
 *                   allowed through. The actual ownership comparison is
 *                   done in the controller (since it needs to load the
 *                   resource first); this helper just standardizes the
 *                   check once a resource's owning userId is known.
 *
 * The JWT is re-verified against JWT_SECRET on every request (not just
 * trusted from a prior login) — a passenger can never self-assign an
 * admin role by tampering with client-side state, since role is read
 * from the signed token's payload and cross-checked against the
 * database user's actual role on every request, not just trusted
 * from the token alone.
 */

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Verifies the incoming request's auth cookie and attaches req.user.
 */
async function protect(req, res, next) {
  try {
    let token = req.cookies ? req.cookies[COOKIE_NAME] : null;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
      }
      return res.status(401).json({ success: false, message: "Invalid authentication token." });
    }

    // Load the user fresh from the database on every request, rather than
    // trusting the token payload alone — this ensures a deactivated
    // account or a role change takes effect immediately, not only after
    // the token expires.
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ success: false, message: "Account no longer exists." });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "This account has been deactivated." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("protect middleware error:", error.message);
    return res.status(500).json({ success: false, message: "Authentication check failed." });
  }
}

/**
 * Restricts a route to one or more roles. Must run after protect().
 * Usage: router.get("/admin-only", protect, requireRole("admin"), handler)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action.",
      });
    }

    next();
  };
}

/**
 * Standardized check for "resource belongs to this user, OR user is
 * admin". The controller loads the resource and passes its owning
 * user ID in; this function does the comparison consistently so every
 * ownership check in the codebase uses the same logic.
 *
 * Usage inside a controller (NOT as route middleware, since the
 * resource must be loaded first):
 *   if (!isOwnerOrAdmin(req.user, complaint.passengerId)) {
 *     return res.status(403).json({ success: false, message: "..." });
 *   }
 */
function isOwnerOrAdmin(user, resourceOwnerId) {
  if (!user || !resourceOwnerId) return false;
  if (user.role === "admin") return true;
  return user._id.toString() === resourceOwnerId.toString();
}

module.exports = { protect, requireRole, isOwnerOrAdmin };