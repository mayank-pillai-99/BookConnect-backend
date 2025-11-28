const express = require("express");
const profileRouter = express.Router();

const { userAuth } = require("../Middlewares/auth");
const {
  validateEditProfileData,
  validateBookData,
  validateGenreData,
} = require("../utils/validation");

profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user;

    res.send(user);
  } catch (err) {
    res.status(400).send("ERROR : " + err.message);
  }
});

profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    if (!validateEditProfileData(req)) {
      throw new Error("Invalid Edit Request");
    }

    const loggedInUser = req.user;

    Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));

    await loggedInUser.save();

    res.json({
      message: `${loggedInUser.firstName}, your profile updated successfuly`,
      data: loggedInUser,
    });
  } catch (err) {
    res.status(400).send("ERROR : " + err.message);
  }
});

// Add a book to favorite books
profileRouter.post("/profile/books/add", userAuth, async (req, res) => {
  try {
    // Validate book data
    validateBookData(req);

    const loggedInUser = req.user;
    const { title, author } = req.body;

    // Check if book already exists
    const bookExists = loggedInUser.favoriteBooks.some(
      (book) => book.title.toLowerCase() === title.trim().toLowerCase()
    );

    if (bookExists) {
      throw new Error("This book is already in your favorites");
    }

    // Add book to favorites
    loggedInUser.favoriteBooks.push({
      title: title.trim(),
      author: author ? author.trim() : "",
    });

    await loggedInUser.save();

    res.json({
      message: "Book added to favorites successfully",
      data: loggedInUser,
    });
  } catch (err) {
    res.status(400).send("ERROR : " + err.message);
  }
});

// Remove a book from favorite books
profileRouter.delete("/profile/books/remove", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const { bookId } = req.body;

    if (!bookId) {
      throw new Error("Book ID is required");
    }

    // Remove book using bookId (_id of the subdocument)
    loggedInUser.favoriteBooks = loggedInUser.favoriteBooks.filter(
      (book) => book._id.toString() !== bookId
    );

    await loggedInUser.save();

    res.json({
      message: "Book removed from favorites successfully",
      data: loggedInUser,
    });
  } catch (err) {
    res.status(400).send("ERROR : " + err.message);
  }
});

// Update favorite genres
profileRouter.patch("/profile/genres", userAuth, async (req, res) => {
  try {
    // Validate genre data
    validateGenreData(req);

    const loggedInUser = req.user;
    const { genres } = req.body;

    // Update genres
    loggedInUser.favoriteGenres = genres;

    await loggedInUser.save();

    res.json({
      message: "Favorite genres updated successfully",
      data: loggedInUser,
    });
  } catch (err) {
    res.status(400).send("ERROR : " + err.message);
  }
});

// Delete user profile
profileRouter.delete("/profile/delete", userAuth, async (req, res) => {
  try {
    const user = req.user;

    // Delete the user from the database
    await user.deleteOne();

    // Clear the cookie
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.json({
      message: "User deleted successfully",
      data: { _id: user._id, firstName: user.firstName, lastName: user.lastName },
    });
  } catch (err) {
    res.status(400).send("ERROR : " + err.message);
  }
});

module.exports = profileRouter;
