const express = require("express");
const router = express.Router();
const Cart = require("../models/cart"); // Model giỏ hàng
const Fruit = require("../models/Fruit"); // Model trái cây (đảm bảo file này đúng)

router.post("/addcart", async (req, res) => {
    try {
        const { userId, fruitId, quantity } = req.body;

        // Kiểm tra sản phẩm có tồn tại không
        const fruit = await Fruit.findById(fruitId);
        if (!fruit) {
            return res.status(404).json({ message: "Trái cây không tồn tại" });
        }

        // Tìm giỏ hàng của user
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            // Nếu chưa có giỏ hàng, tạo mới
            cart = new Cart({
                userId,
                items: [{
                    fruitId,
                    name: fruit.name,
                    price: fruit.price,
                    image: fruit.image,
                    quantity
                }]
            });
        } else {
            // Kiểm tra sản phẩm đã có trong giỏ chưa
            const itemIndex = cart.items.findIndex(item => item.fruitId.equals(fruitId));

            if (itemIndex > -1) {
                // Nếu có, cập nhật số lượng
                cart.items[itemIndex].quantity += quantity;
            } else {
                // Nếu chưa có, thêm mới
                cart.items.push({
                    fruitId,
                    name: fruit.name,
                    price: fruit.price,
                    image: fruit.image,
                    quantity
                });
            }
        }

        await cart.save();
        res.json({ message: "Thêm vào giỏ hàng thành công", cart });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error });
    }
});
 router.post('/api/giohang', async (req,res)=>{
    try{
        const cart = await Cart.find();
        if(!cart){
            return res.status(404).json({message: "Giỏ hàng trống"});
        }
        res.json(cart);
    }catch(error){
        res.status(500).json({message: "Lỗi server", error});
    }
 })

 router.get("/giohang", async function (req, res, next) {
    
    try {
        if (!req.session.user) {
            return res.redirect("/dangnhap");
        }

        const userId = req.session.user._id;
        const cart = await Cart.findOne({ userId }).populate("items.fruitId");

        res.render("giohang", { user: req.session.user, cart: cart ? cart.items : [] });
    } catch (error) {
        console.error("Lỗi khi lấy giỏ hàng:", error);
        res.status(500).send("Lỗi server");
    }
});

router.post("/checkout", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/dangnhap");
        }

        const userId = req.session.user._id;
        const cart = await Cart.findOne({ userId }).populate("items.fruitId");

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Giỏ hàng trống, không thể thanh toán" });
        }

        let totalPrice = cart.items.reduce((sum, item) => sum + (item.fruitId.price * item.quantity), 0);

        // Xóa giỏ hàng sau khi thanh toán
        await Cart.deleteOne({ userId });

        res.json({ message: "Thanh toán thành công!", total: totalPrice });
    } catch (error) {
        console.error("Lỗi khi thanh toán:", error);
        res.status(500).json({ message: "Lỗi server", error });
    }
});
module.exports = router;
