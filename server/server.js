require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { connectToDatabase, getDb, closeDatabase } = require("./db");

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Constants:
const PASS_CHAR_LIMIT = 64;
const PASS_CHAR_MIN = 8;

app.use(cors());
app.use(express.json());

// Sign-up:
//  validate input, check username, hash password, then insert.
app.post("/api/signup", async (req, res) => {
  try {
    const { firstName, lastName, username, password } = req.body || {};

    // Check if all 
    if (![firstName, lastName, username, password].every(
      value => typeof value === "string" && value.trim().length > 0
    )) {
      return res.status(400).json({
        success: false,
        message: "Please complete all four signup fields."
      });
    }

    // trim user inputs
    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const cleanUsername = username.trim();

    // Password to small
    if (password.length < PASS_CHAR_MIN) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long."
      });
    }

    // Password to large
    if (cleanUsername.length > PASS_CHAR_LIMIT) {
      return res.status(400).json({
        success: false,
        message: "Username must be 64 characters or fewer."
      });
    }

    const users = getDb().collection("users");
    const existingUser = await users.findOne({ username: cleanUsername });

    if (existingUser) {
      return res.status(409).json({
        message: "That username is already used."
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Make user object form inputs to be sent to database
    const newUser = {
      f_name: cleanFirst,
      l_name: cleanLast,
      username: cleanUsername,
      password: hashedPassword
    };

    // Insert user into users table
    const result = await users.insertOne(newUser);

    return res.status(201).json({
      message: "Account created successfully. You can now log in.",
      userId: result.insertedId
    });
  } catch (error) {
    // MongoDB's unique index(race condition)
    if (error && error.code === 11000) {
      return res.status(409).json({
        message: "That username is already taken. Please choose another."
      });
    }
    console.error("Signup error:", error);
    return res.status(500).json({
      message: "A server or database error occurred. Please try again."
    });
  }
});

// Login: find by username and compare the entered password to its hash.
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (![username, password].every(
      value => typeof value === "string" && value.trim().length > 0
    )) {
      return res.status(400).json({
        message: "Please enter both username and password."
      });
    }

    const user = await getDb().collection("users").findOne({
      username: username.trim()
    });

    // Use the same response for an unknown username and wrong password.
    if (!user) {
      return res.status(401).json({
        message: "Invalid username or password."
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid username or password."
      });
    }

    return res.status(200).json({
      message: `Login successful. Welcome, ${user.f_name}!`
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "A server or database error occurred. Please try again."
    });
  }
});

async function startServer() {
  try {
    await connectToDatabase();
    const server = app.listen(PORT, () => {
      console.log(`Express server listening at http://localhost:${PORT}`);
    });

    const shutdown = async () => {
      server.close(async () => {
        await closeDatabase();
        process.exit(0);
      });
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Could not start server:", error.message);
    process.exit(1);
  }
}

startServer();