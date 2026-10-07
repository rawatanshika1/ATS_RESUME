const mongoose = require('mongoose');

const isPlainObject = (value) => (
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
);

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120
    },
    templateId: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100
    },
    sections: {
      personalInfo: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
        validate: {
          validator: isPlainObject,
          message: 'Personal information must be an object.'
        }
      },
      summary: {
        type: String,
        default: '',
        maxlength: 5000
      },
      skills: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
        validate: {
          validator: (items) => items.length <= 100,
          message: 'Skills cannot contain more than 100 items.'
        }
      },
      experience: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
        validate: {
          validator: (items) => items.length <= 50 && items.every(isPlainObject),
          message: 'Experience must be an array of up to 50 objects.'
        }
      },
      projects: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
        validate: {
          validator: (items) => items.length <= 50 && items.every(isPlainObject),
          message: 'Projects must be an array of up to 50 objects.'
        }
      },
      education: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
        validate: {
          validator: (items) => items.length <= 50 && items.every(isPlainObject),
          message: 'Education must be an array of up to 50 objects.'
        }
      },
      certifications: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
        validate: {
          validator: (items) => items.length <= 50 && items.every(isPlainObject),
          message: 'Certifications must be an array of up to 50 objects.'
        }
      }
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.userId;
        delete ret.__v;
        return ret;
      }
    }
  }
);

resumeSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('Resume', resumeSchema);
