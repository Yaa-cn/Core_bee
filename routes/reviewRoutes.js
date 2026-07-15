import { Router } from "express"
import { auth } from "../middleware/auth.js"
import Review from "../models/review.js"
import Order from "../models/order.js"

const router = Router()

router.get("/reviews/:product", async (req, res) => {
    try {
        const { product } = req.params
        const reviews = await Review.find({ product }).populate('user', '-_id name').select('user rating comment createdAt')

        if (!reviews) {
            return res.status(404).json({ message: "This product has not yet received any reviews." })
        }
        res.status(200).json({ success: true, reviews })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

router.get("/review/check", auth, async (req, res) => {
    try {
        const user = req.session.userId;
        const orders = await Order.find({ user }).select("-_id items");

        const status = {}

        for (const order of orders) {
            for (const item of order.items) {

                const isReviewed = await Review.findOne({ user, product: item.product })

                status[item.product] = isReviewed ? true : false
            }
        }

        res.status(200).json({ status })

    } catch (err) {
        res.status(500).json({ err: err.message })
    }
})


router.post("/reviews", auth, async (req, res) => {
    try {
        const user = req.session.userId

        const { product, orderId, rating, comment } = req.body

        const isReviewed = await Review.findOne({ user, product })

        if (isReviewed) {
            return res.status(409).json({ message: "This product has already been reviewed !" })
        }

        const review = new Review({
            user,
            product,
            orderId,
            rating,
            comment
        })


        await review.save()
        res.status(201).json({ success: true, message: "Review added successfully !", review })

    } catch (err) {
        console.log(err)
        res.status(500).json({ message: err.message })
    }
})

export default router