import { Router } from "express"
import { adminAuth } from "../middleware/auth.js"
import Product from "../models/product.js"

const router = Router()

router.get("/products", async (req, res) => {
    try {
        const { slug } = req.query
        if (slug) {

            const product = await Product.findOne({ slug })

            if (!product) {
                return res.status(404).json({ message: "Product not found !" })
            }
            return res.status(200).json(product)
        }

        const products = await Product.find()
        res.status(200).json(products)

    } catch (err) {
        res.status(500).json({ message: "Unable to fetch data !" })
    }
})

router.get("/products/:slug", async (req, res) => {
    try {
        const { slug } = req.params
        const product = await Product.findOne({ slug })
        if (!product) {
            return res.status(404).json({ message: "Product not found !" })
        }
        res.status(200).json(product)
    } catch (err) {
        res.status(500).json({ message: "Unable to fetch data !" })
    }
})

export default router