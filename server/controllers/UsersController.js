const db = require("../model/dbConnection");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

function tokenGenerator({ id, role, username }) {
  const payload = { id, role, username };
  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET);
  return accessToken;
}

const handleCreateNewUser = async (req, res) => {
  const { username, email, password } = req.body;
  const acceptLanguage = req.headers["accept-language"];
  const language =
    acceptLanguage && acceptLanguage.includes("ar") ? "arabic" : "english";

  try {
    let sql = "SELECT * FROM public.user WHERE email = $1";
    const oldUser = await db.query(sql, [email]);

    if (oldUser.rows.length !== 0) {
      const errorMessage =
        language === "arabic"
          ? "المستخدم موجود بالفعل."
          : "User Already Exists.";
      return res.status(409).json({ success: false, message: errorMessage });
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

    const successMessage =
      language === "arabic"
        ? "تم إنشاء المستخدم بنجاح. "
        : "User created successfully. Token:";
    res.status(201).json({ success: true, message: successMessage, token });
  } catch (error) {
    console.error("An error occurred during user creation:", error);
    const errorMessage =
      language === "arabic"
        ? "حدث خطأ أثناء إنشاء المستخدم"
        : "An error occurred during user creation";
    res.status(500).json({ success: false, error: errorMessage });
  }
};

const checkUser = async (req, res) => {
  const { email, password } = req.body;
  const acceptLanguage = req.headers["accept-language"];
  const language =
    acceptLanguage && acceptLanguage.includes("ar") ? "arabic" : "english";

  try {
    const query =
      "SELECT * FROM public.user WHERE role = 'user' ORDER BY id ASC";
    const results = await db.query(query);

    for (const user of results.rows) {
      const match = await bcrypt.compare(password, user.password);
      if (user.email === email && match) {
        if (user.state) {
          const errorMessage =
            language === "arabic"
              ? "تم حظر حسابك"
              : "Access denied: Your account is blocked.";
          return res.status(401).json({ message: errorMessage });
        }
        const token = tokenGenerator(user);
        const successMessage =
          language === "arabic"
            ? "تم تسجيل الدخول بنجاح"
            : "User logged in successfully.";
        return res.status(200).json({ message: successMessage, token });
      }
    }
    res.sendStatus(401);
  } catch (error) {
    console.error(error);
    const errorMessage =
      language === "arabic" ? "خطأ داخلي في الخادم" : "Internal server error";
    res.status(500).json({ message: errorMessage });
  }
};

module.exports = {
  handleCreateNewUser,
  checkUser,
};
