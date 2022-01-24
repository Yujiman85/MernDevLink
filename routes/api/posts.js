const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");

const Post = require("../../models/Post");
const Profile = require("../../models/Profile");
const User = require("../../models/User");

// @route   Post api/posts
// @desc    Create a post
// @access  Private

router.post(
	"/",
	[auth, [check("text", "Text is required.").not().isEmpty()]],
	async (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const user = await User.findById(req.user.id).select("-password");

			const newPost = new Post({
				text: req.body.text,
				name: user.name,
				avatar: user.avatar,
				user: req.user.id,
			});

			const post = await newPost.save();

			res.json(newPost);
		} catch (err) {
			console.error(err.message);
			res.status(500).send("Server error.");
		}
	}
);

// @route   GET api/posts
// @desc    Get all posts
// @access  Private

router.get("/", auth, async (req, res) => {
	try {
		const posts = await Post.find().sort({ date: -1 });
		res.json(posts);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server error.");
	}
});

// @route   GET api/posts/:id
// @desc    Get post by ID
// @access  Private

router.get("/:id", auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		if (!post) {
			return res.status(404).json({ msg: "Post not found." });
		}

		res.json(post);
	} catch (err) {
		console.error(err.message);

		if (err.kind === "ObjectId") {
			return res.status(404).json({ msg: "Post not found." });
		}

		res.status(500).send("Server error.");
	}
});

// @route   DELETE api/posts/:id
// @desc    Delete post by ID
// @access  Private

router.delete("/:id", auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		if (!post) {
			return res.status(404).json({ msg: "Post not found." });
		}

		if (post.user.toString() !== req.user.id) {
			return res
				.status(401)
				.json({ msg: "User not authorized to perform this action." });
		}

		await post.remove();

		res.json({ msg: "Post removed." });
	} catch (err) {
		console.error(err.message);

		if (err.kind === "ObjectId") {
			return res.status(404).json({ msg: "Post not found." });
		}

		res.status(500).send("Server error.");
	}
});

// @route   POST api/posts/likes/:post_id
// @desc    Like and unlike a post
// @access  Private

router.post("/likes/:post_id", auth, async (req, res) => {
	const post = await Post.findById(req.params.post_id);

	if (!post) {
		return res.status(404).json({ msg: "Post not found." });
	}

	const index = post.likes.findIndex((like) => like.user == req.user.id);

	// Checks if user liked the post already
	index === -1
		? post.likes.push({ user: req.user.id })
		: post.likes.splice(index, 1);

	await post.save();

	res.json(post);
});

// @route   Post api/posts/comments/:id
// @desc    Add a comment to a post
// @access  Private

router.post(
	"/comments/:id",
	[auth, [check("text", "Text is required.").not().isEmpty()]],
	async (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const user = await User.findById(req.user.id).select("-password");
			const post = await Post.findById(req.params.id);

			const newComment = {
				text: req.body.text,
				name: user.name,
				avatar: user.avatar,
				user: req.user.id,
			};

			post.comments.unshift(newComment);

			await post.save();

			res.json(post.comments);
		} catch (err) {
			console.error(err.message);
			res.status(500).send("Server error.");
		}
	}
);

// @route   DELETE api/posts/comments/:post_id/:comment_id
// @desc    Delete a comment from a post
// @access  Private

router.delete("/comments/:post_id/:comment_id", auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);

		// Find the specific comment
		const comment = post.comments.find(
			(comment) => comment.id === req.params.comment_id
		);

		// Make sure the comment exists
		if (!comment) {
			return res.status(404).json({ msg: "Comment does not exist." });
		}

		// Check if user made the comment
		if (comment.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: "User not authorized." });
		}

		// Get remove index
		const removeIndex = post.comments
			.map((comment) => comment.id.toString())
			.indexOf(req.params.comment_id);

		post.comments.splice(removeIndex, 1);

		await post.save();

		res.json(post.comments);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server error.");
	}
});

module.exports = router;
