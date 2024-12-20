const mongoose = require('mongoose')

const SectionSchema = new mongoose.Schema({
  heading: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String },
});

const BlogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subTitle: { type: String, required: true },
    category: { type: String, required: true },
    baseShortDescription: { type: String, required: true },
    mainImage: { type: String },
    authorName: { type: String, required: true },
    sections: [SectionSchema],
    reviews: [
      {
        reviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review' },
        addedAt: { type: Date, default: Date.now }, // Track when the review was added
      },
    ],
  },
  { timestamps: true }
);

const blogPostModel = mongoose.model('blogPost', BlogPostSchema)
module.exports = blogPostModel