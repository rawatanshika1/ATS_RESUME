const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    mode: {
      type: String,
      enum: ['general', 'fresher', 'internship', 'linkedin'],
      default: 'general',
      required: true
    },
    resumeFileName: {
      type: String,
      required: true,
      trim: true
    },
    resumeText: {
      type: String,
      required: true
    },
    jobTitle: {
      type: String,
      trim: true,
      default: ''
    },
    jobDescription: {
      type: String,
      required: true
    },
    parseability: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },
    shareToken: {
      type: String,
      select: false
    },
    shareExpiresAt: {
      type: Date,
      default: null
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Add index for fast querying by user and date
analysisSchema.index({ userId: 1, createdAt: -1 });
analysisSchema.index({ shareToken: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Analysis', analysisSchema);
