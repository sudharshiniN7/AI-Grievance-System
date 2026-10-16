const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ROLES = ["passenger", "admin"];

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email address"],
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    role: {
      type: String,
      enum: ROLES,
      default: "passenger",
      required: true,
    },
    isPrimaryAdmin: {
      type: Boolean,
      default: false,
    },
    adminUserId: {
      type: String,
      default: undefined,
      index: {
        unique: true,
        partialFilterExpression: { adminUserId: { $type: "string" } },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(plainPassword, salt);
};

userSchema.methods.verifyPassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    fullName: this.fullName,
    email: this.email,
    phone: this.phone,
    role: this.role,
    isActive: this.isActive,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model("User", userSchema);

module.exports = User;
module.exports.ROLES = ROLES;