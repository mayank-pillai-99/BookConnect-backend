const express = require("express");
const userRouter = express.Router();

const { userAuth } = require("../Middlewares/auth");
const ConnectionRequest = require("../Models/connectionRequest");
const User = require("../Models/user");

const USER_SAFE_DATA = "firstName lastName photoUrl age gender about favoriteBooks favoriteGenres";

// Get all the pending connection request for the loggedIn user
userRouter.get("/user/requests/received", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: "interested",
    }).populate("fromUserId", USER_SAFE_DATA);
    // }).populate("fromUserId", ["firstName", "lastName"]);

    const data = connectionRequests.filter((req) => req.fromUserId);

    res.json({
      message: "Data fetched successfully",
      data: data,
    });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

userRouter.get("/user/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { toUserId: loggedInUser._id, status: "accepted" },
        { fromUserId: loggedInUser._id, status: "accepted" },
      ],
    })
      .populate("fromUserId", USER_SAFE_DATA)
      .populate("toUserId", USER_SAFE_DATA);

    const data = connectionRequests
      .map((row) => {
        // Handle case where a user was deleted but the connection request still exists
        if (!row.fromUserId || !row.toUserId) {
          return null;
        }

        if (row.fromUserId._id.toString() === loggedInUser._id.toString()) {
          return row.toUserId;
        }
        return row.fromUserId;
      })
      .filter((row) => row !== null);

    res.json({ data });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

userRouter.get("/feed", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    // Extract query parameters
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;

    const { search, genre, book, sort } = req.query;

    // Get all connection requests to hide connected users
    const connectionRequests = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
    }).select("fromUserId  toUserId");

    const hideUsersFromFeed = new Set();
    connectionRequests.forEach((req) => {
      hideUsersFromFeed.add(req.fromUserId.toString());
      hideUsersFromFeed.add(req.toUserId.toString());
    });

    // Build filter object
    const filters = {
      $and: [
        { _id: { $nin: Array.from(hideUsersFromFeed) } },
        { _id: { $ne: loggedInUser._id } },
      ],
    };

    // Add search filter (search by first name or last name)
    if (search && search.trim() !== "") {
      filters.$and.push({
        $or: [
          { firstName: { $regex: search.trim(), $options: "i" } },
          { lastName: { $regex: search.trim(), $options: "i" } },
        ],
      });
    }

    // Add genre filter
    if (genre && genre.trim() !== "") {
      filters.$and.push({ favoriteGenres: genre.trim() });
    }

    // Add book filter (search in book titles)
    if (book && book.trim() !== "") {
      filters.$and.push({
        "favoriteBooks.title": { $regex: book.trim(), $options: "i" },
      });
    }

    // Build sort object
    let sortOption = {};
    if (sort === "name") {
      sortOption = { firstName: 1, lastName: 1 };
    } else if (sort === "newest") {
      sortOption = { createdAt: -1 };
    } else if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    }

    // Execute query with filters and sorting
    const users = await User.find(filters)
      .select(USER_SAFE_DATA)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    res.json({ data: users });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
module.exports = userRouter;
