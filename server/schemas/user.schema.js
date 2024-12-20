const { z } = require('zod');

// User Signup Schema
const signupSchema = z.object({
    name: z.string()
        .min(1, "Name is required").max(40, "Name is too long"),
    email: z.string()
        .email("Invalid email format")
        .nonempty("Email is required"),
    password: z.string()
        .min(8, "Password must be at least 8 characters long"),
});

const loginSchema = z.object({
    email: z.string()
        .email("Invalid email format")
        .nonempty("Email is required"),
    password: z.string()
        .min(8, "Password must be at least 8 characters long")
        .nonempty("Password is required"),
});

const blogSchema = z.object({
    title: z.string().min(1, "Title is required").max(200, "Title is too long"),
    subTitle: z.string().min(1, "Sub title is required").max(500, "Sub title is too long"),
    category: z.string().min(1, "Category is required"),
    baseShortDescription: z.string().min(1, "Base short description is required"),
    authorName: z.string().min(1, "Author name is required").max(50, "Title is too long"),

    sections: z.array(
        z.object({
            heading: z.string().min(1, "Section heading is required"),
            description: z.string().min(1, "Section description is required"),
        })
    ),
    mainImage: z.string().nonempty("This image is required"),
});

const reviewSchema = z.object({
    reviewText: z.string().min(1, 'Review text is required').max(500, 'Review text cannot exceed 500 characters'),
    name: z.string().optional(),
});

module.exports = {
    signupSchema,
    loginSchema,
    blogSchema,
    reviewSchema
};
