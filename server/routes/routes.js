const express = require('express');
const { signup, login, handleCreateBlog, fetchBlogs, fetchSingleBlog, handleReview, fetchReviews } = require('../controllers/controller');
const { verifyTokenUser } = require('../middlewares/jwtAuth');
const upload = require('../middlewares/multer');
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post("/create_blog", verifyTokenUser, upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "sectionImages", maxCount: 10 },
]), handleCreateBlog);
router.get('/fetchBlogs',fetchBlogs)
router.get('/fetchSingleBlog/:id' , fetchSingleBlog);
router.post('/addReview',handleReview)
router.get('/fetchReviews/:blogPostId',fetchReviews)


module.exports = router;