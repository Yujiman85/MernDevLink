const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");

const Profile = require("../../models/Profile");
const User = require("../../models/User");

// @route   GET api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get("/me", auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id }).populate(
			"user",
			["name", "avatar"]
		);

		if (!profile) {
			return res
				.status(400)
				.json({ msg: "There is no profile for this user!" });
		}

		res.json(profile);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server error.");
	}
});

// @route   POST api/profile
// @desc    Create or update a user profile
// @access  Private

router.post(
	"/",
	[
		auth,
		[
			check("status", "Status is required.").not().isEmpty(),
			check("skills", "Skills are required!").not().isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const profileFields = {};
		profileFields.user = req.user.id;

		const standardFields = [
			"handle",
			"company",
			"location",
			"bio",
			"status",
			"githubusername",
		];

		const socialFields = [
			"youtube",
			"twitter",
			"facebook",
			"linkedin",
			"instagram",
		];

		if (req.body.skills) {
			profileFields.skills = req.body.skills
				.split(",")
				.map((skill) => skill.trim());
			console.log(profileFields.skills);
		}

		standardFields.forEach((field) => {
			if (req.body[field]) profileFields[field] = req.body[field];
		});

		profileFields.social = {};

		socialFields.forEach((field) => {
			if (req.body[field]) profileFields.social[field] = req.body[field];
		});

		try {
			let profile = await Profile.findOne({ user: req.user.id });

			// If a profile is found
			if (profile) {
				// Update profile
				profile = await Profile.findOneAndUpdate(
					{ user: req.user.id },
					{ $set: profileFields },
					{ new: true }
				);

				return res.json(profile);
			}

			// Create profile If there is none
			profile = new Profile(profileFields);

			await profile.save();
			res.json(profile);
		} catch (err) {
			console.error(err.message);
			res.status(500).send("Server error.");
		}
	}
);

module.exports = router;
