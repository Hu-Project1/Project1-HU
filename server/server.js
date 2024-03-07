require("dotenv").config();
const express = require("express");
const cors = require("cors");
const UserRouter = require("./routers/Users");
// const AdminRouter = require("./routers/admin");
// const ContactRouter = require("./routers/contactUs");
// const BlogsRouter = require("./routers/blogs");
// const WishlistRouter = require("./routers/wishlist");
const app = express();
const PORT = process.env.PORT;
app.use(cors());
app.use(express.json());

app.use(UserRouter);
// app.use(AdminRouter);
// app.use(BlogsRouter);
// app.use(ContactRouter);
// app.use(WishlistRouter);

app.get("/", (req, res) => {
  res.send({ message: "Welcome to my API" });
});

app.listen(PORT, () => {
  console.log(`The server is running on port ${PORT}`);
});
