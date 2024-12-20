const User = require("../models/userModel");
const { signupSchema, loginSchema, blogSchema, reviewSchema } = require("../schemas/user.schema");
const { z } = require("zod");
const bcrypt = require("bcrypt");
const { generateToken } = require("../middlewares/jwtAuth");
const blogPostModel = require("../models/blogPostModel");
const reviewModel = require("../models/reviewModel");

module.exports = {
  signup: async (req, res) => {
    try {
      const validatedData = signupSchema.parse(req.body);
      const { name, email, password } = validatedData;
      const hashedPass = await bcrypt.hash(password, 10);

      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ errMsg: 'Email already in use.' });
      }

      const newUser = new User({ name, email, password: hashedPass });
      await newUser.save();

      const token = generateToken(newUser._id);
      console.log("token:", token, "newuser:", newUser);

      return res.status(201).json({
        message: 'User created successfully!',
        name: newUser.name,
        email: newUser.email,
        token,
        id: newUser._id,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          zodValidationErrors: error.errors.map((err) => ({
            field: err.path[0],
            message: err.message,
          })),
        });
      }

      console.error(error);
      return res.status(500).json({ errMsg: 'Internal server error' });
    }
  },

  login: async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { email, password } = validatedData;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ errMsg: 'User not found!' });
      }

      const passMatch = await bcrypt.compare(password, user.password);
      if (!passMatch) {
        return res.status(401).json({ errMsg: 'Your password is incorrect!' });
      }

      const token = generateToken(user._id);

      return res.status(200).json({
        name: user.name,
        email: user.email,
        token,
        id: user._id,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          zodValidationErrors: error.errors.map((err) => ({
            field: err.path[0],
            message: err.message,
          })),
        });
      }

      console.error(error);
      return res.status(500).json({ errMsg: 'Something went wrong during login' });
    }
  },
  handleCreateBlog: async (req, res) => {
    try {

      const sectionsData = req.body.sections ? JSON.parse(req.body.sections) : [];
      req.body.sections = sectionsData;

      const mainImage = req.files?.mainImage?.[0];
      console.log("mainImage;", mainImage);

      req.body.mainImage = mainImage
        ? `/uploads/${mainImage.filename}`
        : "";

      // Validate using Zod schema
      const validatedData = blogSchema.parse(req.body); // This will throw an error if validation fails
      console.log(validatedData);

      // Process and store images if validation passes
      const sectionImages = req.files.sectionImages || [];
      const processedSections = validatedData.sections.map((section, index) => ({
        heading: section.heading,
        description: section.description,
        image: sectionImages[index] ? `/uploads/${sectionImages[index].filename}` : null,
      }));

      const mainImagePath = mainImage?.filename
        ? `/uploads/${req.files.mainImage[0].filename}`
        : null;

      const newBlog = new blogPostModel({
        title: validatedData.title,
        subTitle: validatedData.subTitle,
        category: validatedData.category,
        baseShortDescription: validatedData.baseShortDescription,
        authorName: validatedData.authorName,
        sections: processedSections,
        mainImage: mainImagePath,
        sectionImages: sectionImages.map(img => `/uploads/${img.filename}`),
      });

      await newBlog.save();
      console.log("After saving MongoDB:", newBlog);

      res.status(201).json({
        message: "Blog created successfully",
        data: newBlog,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("Validation error:", error.errors);

        // Map Zod errors for frontend
        const formattedErrors = error.errors.map((err) => {
          if (Array.isArray(err.path) && err.path[0] === "sections") {
            const [_, sectionIndex, field] = err.path;
            return {
              path: ["sections", sectionIndex, field].filter(Boolean),
              message: err.message,
            };
          }
          return {
            path: err.path,
            message: err.message,
          };
        });

        return res.status(400).json({ errors: formattedErrors });
      }
      console.error("Error creating blog:", error);
      res.status(500).json({ error: "Failed to create blog" });
    }
  },


  fetchBlogs: async (req, res) => {
    try {
      const { page = 1, limit = 6 } = req.query;

      // Parse page and limit to integers
      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);

      if (isNaN(pageNumber) || isNaN(limitNumber)) {
        return res.status(400).json({ message: 'Invalid page or limit value' });
      }

      // Fetch the blogs with pagination
      const blogs = await blogPostModel.find()
        .sort({ createdAt: -1 }) // Sort by newest first
        .skip((pageNumber - 1) * limitNumber) // Skip based on page number
        .limit(limitNumber);

      if (blogs.length === 0) {
        return res.status(404).json({ message: 'No blogs found' });
      }

      const totalBlogs = await blogPostModel.countDocuments(); // Total count of blogs
      const totalPages = Math.ceil(totalBlogs / limitNumber); // Calculate total pages

      res.status(200).json({
        success: true,
        blogs,
        currentPage: pageNumber,
        totalPages,
        totalBlogs,
      });

    } catch (error) {
      console.log("Error fetching blogs:", error.message);
      res.status(500).json({ error: "Failed to fetch blogs" });
    }
  },
  fetchSingleBlog: async (req, res) => {
    try {
      const { id } = req.params;
      const blog = await blogPostModel.findById(id).populate('reviews')
      console.log(blog);

      if (!blog) {
        return res.status(404).json({ success: false, message: 'Blog not found' });
      }
      res.status(200).json({ success: true, blog });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ success: false, message: 'Error fetching the blog' });
    }
  },
  handleReview: async (req, res) => {
    try {
      const validatedData = reviewSchema.parse(req.body);
      let { reviewText, name } = validatedData;

      reviewText = reviewText.trim();
      name = name ? name.trim() : 'Anonymous';

      if (reviewText === "") {
        return res.status(400).json({ success: false, message: 'Review text cannot be empty.' });
      }

      const { blogPostId } = req.body;

      const blogPost = await blogPostModel.findById(blogPostId);

      if (!blogPost) {
        return res.status(404).json({ success: false, message: 'Blog post not found' });
      }

      // Create and save the review
      const newReview = new reviewModel({
        name: name || 'Anonymous',
        reviewText,
        blogPost: blogPostId,
      });
      await newReview.save();

      console.log('newreview;', newReview);
      blogPost.reviews.push({ reviewId: newReview._id, addedAt: new Date() });
      await blogPost.save();

      const sortedReviews = blogPost.reviews
        .slice()
        .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

      const populatedReviews = await Promise.all(
        sortedReviews.map(async (review) => {
          const populatedReview = await reviewModel.findById(review.reviewId);
          return {
            ...populatedReview.toObject(),
            addedAt: review.addedAt,
          };
        })
      );


      console.log('after added new;', populatedReviews);

      res.status(201).json({
        success: true,
        message: 'Review added successfully',
        reviews: populatedReviews,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          errors: error.errors.map((err) => ({
            field: err.path[0],
            message: err.message,
          })),
        });
      }

      console.error(error);
      res.status(500).json({ success: false, message: 'Error adding the review' });
    }
  },
  fetchReviews: async (req, res) => {
    try {
      const { blogPostId } = req.params;

      // Fetch the blog post
      const blogPost = await blogPostModel.findById(blogPostId);

      if (!blogPost) {
        return res.status(404).json({ success: false, message: 'Blog post not found' });
      }

      const currentTime = new Date();

      // Filter expired reviews
      const validReviews = blogPost.reviews.filter(
        (review) => new Date(review.addedAt).getTime() > currentTime.getTime() - 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
      );

      // Remove expired reviews from the database
      const expiredReviewIds = blogPost.reviews
        .filter((review) => !validReviews.includes(review))
        .map((review) => review.reviewId);

      if (expiredReviewIds.length > 0) {
        await reviewModel.deleteMany({ _id: { $in: expiredReviewIds } });
        blogPost.reviews = validReviews;
        await blogPost.save();
      }

      // Sort valid reviews by `addedAt` in descending order
      const sortedValidReviews = validReviews.slice().sort(
        (a, b) => new Date(b.addedAt) - new Date(a.addedAt)
      );

      // Populate the sorted valid reviews
      const populatedReviews = await Promise.all(
        sortedValidReviews.map(async (review) => {
          const populatedReview = await reviewModel.findById(review.reviewId);
          return {
            ...populatedReview.toObject(),
            addedAt: review.addedAt,
          };
        })
      );
      console.log('populatedReviewsfetched;', populatedReviews);


      res.status(200).json({ reviews: populatedReviews });
    } catch (error) {
      console.error('Error fetching reviews:', error.message);
      res.status(500).json({ success: false, message: 'Error fetching reviews' });
    }
  }

}