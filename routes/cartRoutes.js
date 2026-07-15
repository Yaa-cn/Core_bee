import { Router } from "express"
import { auth } from "../middleware/auth.js"
import Cart from "../models/cart.js"
import Product from "../models/product.js"

const router = Router()

router.get("/cart", auth, async (req, res) => {
    try {
        const user = req.session.userId

        const cart = await Cart.findOne({ user }).populate("items.product")

        if (!cart) {
            return res.status(200).json({ success: true, message: 'Your cart is empty !', cart: { user, items: [] } })
        }

        res.status(200).json({ success: true, cart })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

router.post("/cart/merge", auth, async (req, res) => {
    try {
        const { cartItems } = req.body
        const user = req.session.userId

        let cart = await Cart.findOne({ user })

        if (!cart) {
            cart = new Cart({ user, items: [] })
        }

        cartItems.forEach(newItem => {
            const existingItem = cart.items.find(item =>
                item.product.equals(newItem.product._id)
            );

            if (existingItem) {
                existingItem.quantity += newItem.quantity
            } else {
                cart.items.push({ product: newItem.product._id, quantity: newItem.quantity })
            }
        })

        await cart.save()

        res.status(cart.isNew ? 201 : 200).json({
            message: cart.isNew ? "Cart created and merged successfully!" : "Cart merged successfully!",
            cart
        })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})


router.post("/cart", auth, async (req, res) => {
    try {
        const { product, quantity } = req.body
        const user = req.session.userId

        let cart = await Cart.findOne({ user })

        if (!cart) {
            cart = new Cart({ user, items: [] })
        }

        const item = await Product.findById(product)

        if (quantity > item.stock) {
            return res.status(200).json({ status: "info", message: `Sorry ! only ${item.stock} left in stock` })
        }

        const existProduct = cart.items.some(item => item.product.equals(product._id))

        if (existProduct) {
            return res.status(409).json({ message: "Item already in cart !" })
        }

        cart.items.push({ product, quantity })
        await cart.save()
        res.status(201).json({ success: true, message: "Item added to cart !", cart })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})


router.patch("/cart/:product", auth, async (req, res) => {
    try {
        const { product } = req.params;
        const { action } = req.body;
        const user = req.session.userId;

        let cart = await Cart.findOne({ user }).populate("items.product")

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" })
        }

        const item = cart.items.find(i => i.product._id.equals(product))
        if (!item) {
            return res.status(404).json({ message: "Item not found in cart" })
        }

        let updateQuery

        if (action === "dec") {

            if (item.quantity > 1) {
                updateQuery = { $inc: { "items.$.quantity": -1 } }
            } else {
                return res.status(200).json({ status: "info", message: "Minimum quantity is 1" })
            }
        }

        if (action === "inc") {

            if (item.quantity >= item.product.stock) {
                updateQuery = { $set: { "items.$.quantity": item.product.stock } }
                return res.status(200).json({ status: "info", message: "Max stock reached" })
            } else {
                updateQuery = { $inc: { "items.$.quantity": 1 } }
            }
        }

        cart = await Cart.findOneAndUpdate(
            { user, "items.product": product },
            updateQuery,
            { returnDocument: "after" }
        )

        res.status(200).json(cart)

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})


router.delete("/cart/:product", auth, async (req, res) => {
    try {
        const { product } = req.params
        const user = req.session.userId

        let cart = await Cart.findOne({ user })

        cart.items = cart.items.filter(item => !item.product.equals(product))
        await cart.save()
        res.status(200).json({ message: "Product removed from cart successfully !", cart })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

export default router