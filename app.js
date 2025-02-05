require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app = express();

// Cấu hình EJS
app.set('view engine', 'ejs');
app.set('views', './views');

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Kết nối MongoDB
mongoose.connect(process.env.Mongodb_url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
})
  .then(() => console.log('Kết nối với MongoDB thành công'))
  .catch((err) => console.error('Lỗi kết nối với MongoDB:', err));

// Secret key từ .env
const JWT_SECRET = process.env.JWT_SECRET || 'my-secret';

// Tạo Schema và Model
const fruitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String, required: true },
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: {type: String, required: true, unique: true}
});

// Hash mật khẩu trước khi lưu
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const Fruit = mongoose.model('Fruit', fruitSchema);
const User = mongoose.model('User', userSchema);

// API cho Users


app.post('/api/login', async (req, res) => {
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

      res.status(200).json({ message: 'Đăng nhập thành công!' });
  } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ!' });
  }
});


app.get('/api/protected', (req, res) => {
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

// API cho Fruits
app.get('/api/fruits', async (req, res) => {
  try {
    const fruits = await Fruit.find();
    res.json(fruits);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách trái cây' });
  }
});

app.post('/api/fruits', async (req, res) => {
  const { name, price, quantity, image } = req.body;
  try {
    const newFruit = new Fruit({ name, price, quantity, image });
    await newFruit.save();
    res.status(201).json(newFruit);
  } catch (err) {
    res.status(400).json({ message: 'Lỗi khi thêm trái cây mới' });
  }
});

app.put('/api/fruits/:id', async (req, res) => {
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

app.delete('/api/fruits/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await Fruit.findByIdAndDelete(id);
    res.json({ message: 'Đã xóa trái cây' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi xóa trái cây' });
  }
});

// Trang chủ
app.get('/', async (req, res) => {
  try {
    const fruits = await Fruit.find();
    res.render('index', { fruits });
  } catch (err) {
    res.status(500).send('Lỗi khi tải trang chủ');
  }
});

// Trang danh sách trái cây
app.get('/fruits', async (req, res) => {
  try {
    const fruits = await Fruit.find();
    res.render('fruits', { fruits });
  } catch (err) {
    res.status(500).send('Lỗi khi tải danh sách trái cây');
  }
});

app.get('/dangnhap', (req, res) => {
  res.render('dangnhap'); // Render file views/login.ejs
});




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
        await newUser.save()
        res.status(200).json({ message: 'Đăng ký thành công! Email xác nhận đã được gửi.' });
    } catch (error) {
        console.error('Lỗi khi gửi email:', error);
        res.status(500).json({ error: 'Đăng ký thất bại, không thể gửi email.' });
    }
});
 app.get('/dangki', async (req, res) => {
  res.render('dangki'); // Render file views/register.ejs
 })

// Server
const PORT =  process.env.Port || 1000;;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}/dangki`);
});
