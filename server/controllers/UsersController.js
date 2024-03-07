const db = require("../model/dbConnection");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

function tokenGenerator({ id, role, username, email }) {
  const payload = { id, role, username, email };
  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET);
  return accessToken;
}

const handleCreateNewUser = async (req, res) => {
  const { username, email, password, role } = req.body;
  const acceptLanguage = req.headers["accept-language"];
  const language =
    acceptLanguage && acceptLanguage.includes("ar") ? "arabic" : "english";

  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;

  try {
    if (!usernameRegex.test(username)) {
      const errorMessage =
        language === "arabic" ? "اسم المستخدم غير صالح." : "Invalid username.";
      return res.status(400).json({ success: false, message: errorMessage });
    }

    if (!emailRegex.test(email)) {
      const errorMessage =
        language === "arabic"
          ? "البريد الإلكتروني غير صالح."
          : "Invalid email.";
      return res.status(400).json({ success: false, message: errorMessage });
    }

    if (!passwordRegex.test(password)) {
      const errorMessage =
        language === "arabic"
          ? "كلمة المرور يجب أن تحتوي على الأقل 8 أحرف، واحدة كبيرة وواحدة صغيرة، ورقم."
          : "Password must be at least 8 characters long, with one uppercase letter, one lowercase letter, and one number.";
      return res.status(400).json({ success: false, message: errorMessage });
    }

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
      role,
    ]);

    const {
      id,
      role: newRole,
      username: newName,
      email: newEmail,
    } = newUser.rows[0];
    const token = tokenGenerator({
      id,
      username: newName,
      email: newEmail,
      role: newRole,
    });

    const successMessage =
      language === "arabic"
        ? "تم إنشاء المستخدم بنجاح. "
        : "User created successfully.";
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
    const query = "SELECT * FROM public.user WHERE email = $1";
    const { rows } = await db.query(query, [email]);

    if (rows.length === 0) {
      return res.status(401).json({
        message:
          language === "arabic"
            ? "عنوان البريد الإلكتروني أو كلمة المرور غير صحيحة"
            : "Invalid email or password",
      });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({
        message:
          language === "arabic"
            ? "عنوان البريد الإلكتروني أو كلمة المرور غير صحيحة"
            : "Invalid email or password",
      });
    }

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
