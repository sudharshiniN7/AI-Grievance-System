const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Auth Controller
 * -----------------
 * Handles passenger registration, login (passenger or the designated
 * admin), logout, and returning the current authenticated user.
 *
 * Security posture:
 * - Passwords are never logged, returned, or compared in plaintext
 *   outside User.verifyPassword() (bcrypt).
 * - JWTs are issued and verified server-side only, stored in an
 *   HTTP-only cookie — never returned in the JSON response body.
 * - Public registration can NEVER set role to "admin" — the request
 *   body's role/isPrimaryAdmin/adminUserId fields are never read here.
 * - Login does not reveal whether a given email/ID exists: both "no
 *   such account" and "wrong password" return the same generic message.
 */

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";
const COOKIE_NAME = "grievance_auth_token";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days, matches JWT_EXPIRES_IN

if (!JWT_SECRET) {
  // Fail loudly at startup rather than silently signing tokens with
  // `undefined`, which would make every token forgeable/unverifiable.
  throw new Error(
    "JWT_SECRET is not set in backend/.env. Authentication cannot start without it."
  );
}

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

/**
 * Builds cookie options appropriate to the environment. In production,
 * cookies are sent only over HTTPS and allow cross-site use (needed when
 * frontend and backend are deployed on different domains). In
 * development, "lax" + non-secure works over plain localhost HTTP.
 */
function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    partitioned: isProduction,
    maxAge: COOKIE_MAX_AGE_MS,
    path: "/",
  };
}

function signToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, getCookieOptions());
}

/**
 * POST /api/auth/register
 * Public passenger registration. Always creates role: "passenger" —
 * the request body's role (if any) is ignored entirely, not just
 * overridden after reading it, so there is no code path where a
 * client-supplied role value is ever consulted.
 */
async function register(req, res) {
  try {
    const { fullName, email, password, phone } = req.body;
    const errors = [];

    if (!fullName || !fullName.trim()) {
      errors.push("Full name is required.");
    }

    if (!email || !email.trim()) {
      errors.push("Email is required.");
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.push("Enter a valid email address.");
    }

    if (!password || password.length < 8) {
      errors.push("Password must be at least 8 characters long.");
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(" ") });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      // Deliberately generic — does not confirm whether the email
      // belongs to a passenger or admin account.
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const user = new User({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: phone ? phone.trim() : null,
      role: "passenger", // hardcoded — never derived from req.body
      isPrimaryAdmin: false,
    });

    await user.setPassword(password);
    await user.save();

    const token = signToken(user);
    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: user.toSafeJSON(),
      token,
    });
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.adminUserId) {
        return res.status(409).json({
          success: false,
          message: "An account with this user ID already exists.",
        });
      }
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(" ") });
    }
    console.error("register error:", error.message);
    return res.status(500).json({ success: false, message: "Registration failed." });
  }
}

/**
 * POST /api/auth/login
 * Accepts either an email or an admin user ID as "identifier" — this
 * lets the single admin account log in with their configured
 * ADMIN_USER_ID, while passengers always use email. Returns the same
 * generic error for "no such account" and "wrong password" so login
 * cannot be used to enumerate registered emails.
 */
async function login(req, res) {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !identifier.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Identifier (email or admin user ID) and password are required.",
      });
    }

    const trimmedIdentifier = identifier.trim();
    const normalizedEmail = trimmedIdentifier.toLowerCase();

    // passwordHash has select:false on the schema — must explicitly
    // request it here, or verifyPassword() would compare against undefined.
    const user = await User.findOne({
      $or: [{ email: normalizedEmail }, { adminUserId: trimmedIdentifier }],
    }).select("+passwordHash");

    const GENERIC_INVALID = { success: false, message: "Invalid credentials." };

    if (!user) {
      return res.status(401).json(GENERIC_INVALID);
    }

    const passwordMatches = await user.verifyPassword(password);
    if (!passwordMatches) {
      return res.status(401).json(GENERIC_INVALID);
    }

    if (!user.isActive) {
      // Only reached after a correct password, so this does not help
      // an attacker enumerate accounts any further than they already could.
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated. Contact support.",
      });
    }

    const token = signToken(user);
    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      user: user.toSafeJSON(),
      token,
    });
  } catch (error) {
    console.error("login error:", error.message);
    return res.status(500).json({ success: false, message: "Login failed." });
  }
}

/**
 * POST /api/auth/logout
 * Clears the auth cookie. Safe to call even if no cookie is present.
 */
async function logout(req, res) {
  res.clearCookie(COOKIE_NAME, { ...getCookieOptions(), maxAge: undefined });
  return res.status(200).json({ success: true, message: "Logged out successfully." });
}

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's safe data. Requires the
 * `protect` middleware (next file) to have already run and attached
 * req.user.
 */
async function getCurrentUser(req, res) {
  // req.user is attached by the authentication middleware after verifying
  // the JWT and loading the user fresh from the database.
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Not authenticated." });
  }

  return res.status(200).json({
    success: true,
    user: req.user.toSafeJSON(),
  });
}

/**
 * Automatically provisions the primary admin account if configured in env
 * and no primary admin exists yet. Useful for cloud environments like Render
 * where interactive terminal access is not available.
 */
async function autoSeedAdminIfConfigured() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_USER_ID, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_USER_ID) {
    return;
  }
  try {
    const existingAdmin = await User.findOne({
      $or: [
        { isPrimaryAdmin: true },
        { email: ADMIN_EMAIL.trim().toLowerCase() },
        { adminUserId: ADMIN_USER_ID.trim() },
      ],
    });
    if (existingAdmin) {
      console.log(`Admin account verified (${existingAdmin.email})`);
      return;
    }
    const admin = new User({
      fullName: (ADMIN_NAME || "System Administrator").trim(),
      email: ADMIN_EMAIL.trim().toLowerCase(),
      role: "admin",
      isPrimaryAdmin: true,
      adminUserId: ADMIN_USER_ID.trim(),
      isActive: true,
    });
    await admin.setPassword(ADMIN_PASSWORD);
    await admin.save();
    console.log(`Administrator account provisioned automatically for: ${admin.email}`);
  } catch (err) {
    console.error("Auto-seed admin check failed:", err.message);
  }
}

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  autoSeedAdminIfConfigured,
  COOKIE_NAME, // exported so the auth middleware reads the same cookie name
};