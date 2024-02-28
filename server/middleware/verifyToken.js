const jwt = require("jsonwebtoken");

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (authHeader == "Bearer null") return res.json({ error: "Null token" });
  const user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  req.user = {
    id: user.id,
    role: user.role,
    username: user.username,
    email: user.email,
  };
  next();
};

module.exports = { verifyJWT };
