const validator = require("validator");

const validateSignUpData = (req) => {
  const { firstName, lastName, emailId, password } = req.body;
  if (!firstName || !lastName) {
    throw new Error("Name is not valid!");
  } else if (!validator.isEmail(emailId)) {
    throw new Error("Email is not valid!");
  } else if (!validator.isStrongPassword(password)) {
    throw new Error("Please enter a strong Password!");
  }
};

const validateEditProfileData = (req) => {
  const allowedEditFields = [
    "firstName",
    "lastName",
    "emailId",
    "photoUrl",
    "gender",
    "age",
    "about",
    "favoriteGenres",
  ];

  const isEditAllowed = Object.keys(req.body).every((field) =>
    allowedEditFields.includes(field)
  );

  return isEditAllowed;
};

const validateBookData = (req) => {
  const { title, author } = req.body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    throw new Error("Book title is required and must be a valid string");
  }

  if (author && typeof author !== "string") {
    throw new Error("Author must be a valid string");
  }

  return true;
};

const validateGenreData = (req) => {
  const { genres } = req.body;

  if (!Array.isArray(genres)) {
    throw new Error("Genres must be an array");
  }

  const validGenres = [
    "Fiction",
    "Non-Fiction",
    "Mystery",
    "Romance",
    "Science Fiction",
    "Fantasy",
    "Biography",
    "History",
    "Self-Help",
    "Poetry",
    "Thriller",
    "Horror",
    "Adventure",
    "Other",
  ];

  const invalidGenres = genres.filter((genre) => !validGenres.includes(genre));

  if (invalidGenres.length > 0) {
    throw new Error(
      `Invalid genres: ${invalidGenres.join(", ")}. Valid genres are: ${validGenres.join(", ")}`
    );
  }

  return true;
};

module.exports = {
  validateSignUpData,
  validateEditProfileData,
  validateBookData,
  validateGenreData,
};
