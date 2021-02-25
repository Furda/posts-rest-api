const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator");

const Post = require("../models/post");
const User = require("../models/user");

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const itemsPerPage = 2;
  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate("creator")
      .skip((currentPage - 1) * itemsPerPage)
      .limit(itemsPerPage);
    if (!posts) {
      const error = new Error("Posts not found.");
      error.statusCode(404);
      throw error;
    }
    res.status(200).json({
      message: "Posts fetched successfully!",
      posts: posts,
      totalItems: totalItems,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("validation failed, entered data is incorrect.");
    error.statusCode(422);
    throw error;
  }

  if (!req.file) {
    const error = new Error("No image provided.");
    error.statusCode(422);
    throw error;
  }

  const imageUrl = req.file.path.replace("\\", "/");
  const title = req.body.title;
  const content = req.body.content;
  let post = new Post({
    title: title,
    imageUrl: imageUrl,
    content: content,
    creator: req.userId,
  });

  try {
    post = await post.save();

    let user = await User.findById(req.userId);
    user.posts.push(post);
    user = await user.save();

    res.status(201).json({
      message: "Post created successfully!",
      post: post,
      creator: { _id: user._id, name: user.name },
    });

    // for tests validation purpose
    return user;
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      message: "Posts fetched successfully!",
      post: post,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
  const postId = req.params.postId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("validation failed, entered data is incorrect.");
    error.statusCode(422);
    throw error;
  }
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path.replace("\\", "/");
  }

  if (!imageUrl) {
    const error = new Error("No file picked.");
    error.statusCode = 422;
    throw error;
  }
  try {
    let post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }
    if (post.creator.toString() !== req.userId.toString()) {
      const error = new Error("No authorized!");
      error.statusCode = 403;
      throw error;
    }
    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }
    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;
    post = await post.save();
    res.status(200).json({ message: "Post updated successfully!", post: post });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }
    if (post.creator.toString() !== req.userId.toString()) {
      const error = new Error("No authorized!");
      error.statusCode = 403;
      throw error;
    }
    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(postId);
    let user = await User.findById(req.userId);
    user.posts.pull(postId);
    user = await user.save;
    res.status(200).json({ message: "Post deleted successfully!" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
