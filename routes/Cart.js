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

module.exports = router;
