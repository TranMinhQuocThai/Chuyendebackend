// db.js
const mongoose = require('mongoose');
// Thay 'myDatabase' bằng tên cơ sở dữ liệu của bạn trong MongoDB
const uri = 'mongodb://localhost:27017/';

// Kết nối tới MongoDB mà không cần các tùy chọn deprecated
mongoose.connect(uri, {
    serverSelectionTimeoutMS: 30000, // Thời gian chờ khi không thể kết nối tới server (30 giây)
})
.then(() => {
    console.log('Kết nối với MongoDB thành công');
    // Tiến hành các truy vấn MongoDB ở đây
})
.catch((err) => {
    console.error('Lỗi kết nối với MongoDB:', err);
});

module.exports = mongoose;