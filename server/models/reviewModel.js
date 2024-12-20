const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: false },
    reviewText: { type: String, required: true },
    blogPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'blogPost',
      required: true,
    },
    createdAt: { 
      type: Date, 
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);
reviewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 }); // 7 days in seconds

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
