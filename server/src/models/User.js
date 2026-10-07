const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required']
    }
  },
  {
    timestamps: true
  }
);

// Method to strip sensitive fields when converting to JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.passwordHash;
  delete user.__v;
  return user;
};

module.exports = mongoose.model('User', userSchema);
