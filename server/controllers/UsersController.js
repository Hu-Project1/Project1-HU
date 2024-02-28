const db = require("../model/dbConnection");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

function tokenGenerator({ id, role, username, email }) {
  const payload = { id, role, username, email };
  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET);
  return accessToken;
}

const handleCreateNewUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    let sql = "SELECT * FROM public.user WHERE email = $1";
    const oldUser = await db.query(sql, [email]);

    if (oldUser.rows.length !== 0) {
      return res.status(409).send("User Already Exists.");
    }

    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    sql =
      'INSERT INTO "user" (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *';
    const newUser = await db.query(sql, [
      username,
      email,
      hashedPassword,
      "user",
    ]);

    const { id, role, username: newName, email: newEmail } = newUser.rows[0];
    const token = tokenGenerator({
      id,
      role,
      username: newName,
      email: newEmail,
    });

    console.log("User created successfully. Token:", token);
    res.status(201).json({ token });
  } catch (error) {
    console.error("An error occurred during user creation:", error);
    res.status(500).json({ error: "An error occurred during user creation" });
  }
};

module.exports = {
  handleCreateNewUser,
};
