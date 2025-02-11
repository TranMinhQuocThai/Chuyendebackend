const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        fruitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fruit', required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        image: { type: String, required: true },
        quantity: { type: Number, required: true }
    }]
});

const Cart = mongoose.model('giohang', cartSchema);

module.exports = Cart;
