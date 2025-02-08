const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Fruit = require('../models/Fruit'); // Assuming you have a Fruit model
const User = require('../models/user'); // Assuming you have a User model

const router = express.Router();

// Trang chủ
router.get('/', async (req, res) => {
  try {
    const fruits = await Fruit.find();
    const user = req.session.user;
    res.render('index', { user });
  } catch (err) {
    res.status(500).send('Lỗi khi tải trang chủ');
      }
});

router.get("/about", function (req, res, next) {
  const user = req.session.user;

  res.render("about", { user });
});

// localhost:3000/contact
router.get("/contact", function (req, res, next) {
  const user = req.session.user;

  res.render("contact", { user });
});

// localhost:3000/post
router.get("/post", function (req, res, next) {
  const user = req.session.user;

  res.render("post", { user });
});

router.get("/post2", function (req, res, next) {
  const user = req.session.user;

  res.render("post2", { user });
});

router.get("/post3", function (req, res, next) {
  const user = req.session.user;

  res.render("post3",{ user });
});

router.get("/dangnhap", function (req, res, next) {
  res.render("dangnhap");
});

router.get("/dangki", function (req, res, next) {
  res.render("dangki");
});

router.get("/logout", function (req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Lỗi khi đăng xuất');
    }
    res.redirect('/dangnhap');
  });
});

// Trang danh sách trái cây
router.get('/api/user', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).send('Lỗi khi tải danh sách người dùng');
  }
});


// API cho Fruits
router.get('/api/fruits', async (req, res) => {
  try {
    const fruits = await Fruit.find();
    res.json(fruits);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách trái cây' });
  }
});

router.post('/api/fruits', async (req, res) => {
    const { name, price, quantity, image } = req.body;
  try {
    const newFruit = new Fruit({ name, price, quantity, image });
    await newFruit.save();
    res.status(201).json(newFruit);
  } catch (err) {
    res.status(400).json({ message: 'Lỗi khi thêm trái cây mới' });
  }
});

router.put('/api/fruits/:id', async (req, res) => {
  const { id } = req.params;
  const { name, price, quantity, image } = req.body;
  try {
    const updatedFruit = await Fruit.findByIdAndUpdate(
      id,
      { name, price, quantity, image },
      { new: true }
    );
    res.json(updatedFruit);
  } catch (err) {
    res.status(400).json({ message: 'Lỗi khi cập nhật trái cây' });
  }
});

router.delete('/api/fruits/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await Fruit.findByIdAndDelete(id);
    res.json({ message: 'Đã xóa trái cây' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi xóa trái cây' });
  }
});

// API cho Users
router.post('/api/login', async (req, res) => {
  const { name, password } = req.body;

  try {
// Tìm người dùng bằng email
    const user = await User.findOne({ name });
  if (!user) {
return res.status(404).json({ error: 'Người dùng không tồn tại!' });
  }
// So sánh mật khẩu
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          return res.status(400).json({ error: 'Sai mật khẩu!' });
      }
      req.session.user = user;
      res.status(200).json({ message: 'Đăng nhập thành công!' });
  } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ!' });
  }
});

router.get('/api/protected', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log(token)
  if (!token) {
    return res.status(401).json({ message: 'Không có token' });
  }
  console.log('JWT token: ' + JWT_SECRET)
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ message: 'Truy cập thành công', user: decoded });
  } catch (err) {
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
});

module.exports = router;
