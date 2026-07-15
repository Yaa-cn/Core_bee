import { Router } from "express"
import Wishlist from "../models/wishlist.js"
import { auth } from "../middleware/auth.js"

const router = Router()

router.get("/wishlist", auth, async (req, res) => {
    try {
        const user = req.session.userId

        const wishlist = await Wishlist.findOne({ user }).populate("items.product")

        if (!wishlist) {
            return res.status(200).json({ success: true, message: 'Your wishlist is empty !', wishlist: { user, items: [] } })
        }

        res.status(200).json({ success: true, wishlist })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

router.post("/wishlist", auth, async (req, res) => {
    try {
        const { product } = req.body
        const user = req.session.userId

        let wishlist = await Wishlist.findOne({ user })

        if (!wishlist) {
            wishlist = new Wishlist({ user, items: [] })
        }

        const existProduct = wishlist.items.some(item => item.product.equals(product._id))

        if (existProduct) {
            return res.status(409).json({ message: "Item already in wishlist !" })
        }

        wishlist.items.push({ product })
        await wishlist.save()
        res.status(201).json({ message: "Item added to wishlist !", wishlist })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

router.delete("/wishlist/:product", auth, async (req, res) => {
    try {
        const { product } = req.params
        const user = req.session.userId

        let wishlist = await Wishlist.findOne({ user })

        wishlist.items = wishlist.items.filter(item => !item.product.equals(product))
        await wishlist.save()
        res.status(200).json({ message: "Product removed from cart successfully !", wishlist })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

export default router