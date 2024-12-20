const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path')
const cron = require('node-cron');
const reviewModel = require('./models/reviewModel');  // Path to your review model
require('dotenv').config();


const app = express();

const router = require('./routes/routes');
const connectDB = require('./config/dbConfig');
const blogPostModel = require('./models/blogPostModel');

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json())
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend URL
}));
app.use(cookieParser());

// Remove older reviews
cron.schedule('*/2 * * * *', async () => {
  const blogPosts = await blogPostModel.find();

  blogPosts.forEach(async (blogPost) => {
    const currentTime = new Date();
    const validReviews = blogPost.reviews.filter(
      (review) => new Date(review.addedAt).getTime() > currentTime.getTime() - 7 * 24 * 60 * 60 * 1000
    );

    if (validReviews.length !== blogPost.reviews.length) {
      blogPost.reviews = validReviews;
      await blogPost.save();
    }
  });

  console.log('Expired reviews cleaned up.');
});

app.use('/', router);

connectDB()
let port = 4000;
app.listen(port, () => console.log(`Server Connected at ${port}`))

