require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const postRoute = require('./routes/post');

const app = express();

const session = require('express-session');

app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Cập nhật cấu hình session
}));

// Cấu hình EJS
app.set('view engine', 'ejs');
app.set('views', './views');

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Kết nối MongoDB
mongoose.connect(process.env.Mongodb_url, {
  serverSelectionTimeoutMS: 30000,
})
  .then(() => console.log('Kết nối với MongoDB thành công'))
  .catch((err) => console.error('Lỗi kết nối với MongoDB:', err));

// Secret key từ .env
const JWT_SECRET = process.env.JWT_SECRET || 'my-secret';

// Tạo Schema và Model
const Fruit = require('./models/Fruit');
const User = require('./models/user');

// API cho Users
app.use('/', postRoute);

// Middleware xác thực JWT
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']; // Lấy token từ header
  if (!token) return res.status(401).json({ message: 'Không có token, truy cập bị từ chối!' });

  // Xác thực token
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token không hợp lệ!' });

    req.user = user; // Lưu thông tin user vào request
    next();
  });
};

// API yêu cầu xác thực token
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Chào mừng bạn đến với trang bảo mật!', userId: req.user.userId });
});

// Cấu hình middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public')); // Để phục vụ file HTML và tài nguyên tĩnh (CSS, ảnh)

// Cấu hình Nodemailer
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// API xử lý đăng ký
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    // Kiểm tra thông tin đầu vào
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin!' });
    }

    // Nội dung email
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Xác nhận đăng ký tài khoản',
        text: `Xin chào ${name},\n\nCảm ơn bạn đã đăng ký tài khoản tại hệ thống của chúng tôi.\n\nChúc bạn một ngày tốt lành!`,
    };

    try {
        // Gửi email
        await transporter.sendMail(mailOptions);
        const newUser = new User({ name, password, email });
        await newUser.save();
        res.status(200).json({ message: 'Đăng ký thành công! Email xác nhận đã được gửi.' });
        
    } catch (error) {
        console.error('Lỗi khi gửi email:', error);
        res.status(500).json({ error: 'Đăng ký thất bại, không thể gửi email.' });
    }
});

// API xử lý đăng xuất
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Đăng xuất thất bại!' });
    }
    res.status(200).json({ message: 'Đăng xuất thành công!' });
  });
});

// Server
const PORT =  process.env.Port || 1000;;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}/dangki`);
});
