import mongoose from "mongoose"
import Product from "./product.js"

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        trim: true
    }
}, { timestamps: true })

reviewSchema.statics.calcAverageRatings = async function (productId) {
    const stats = await this.aggregate([
        { $match: { product: productId } },
        {
            $group: {
                _id: "$product",
                avgRating: { $avg: "$rating" },
                nRating: { $sum: 1 }
            }
        }
    ])

    if (stats.length > 0) {
        await Product.findByIdAndUpdate(productId, {
            rating: stats[0].avgRating
        });
    } else {
        await Product.findByIdAndUpdate(productId, { rating: 0 })
    }
}

reviewSchema.post("save", async function () {
    await this.constructor.calcAverageRatings(this.product)
})


reviewSchema.post("remove", async function () {
    await this.constructor.calcAverageRatings(this.product)
})


reviewSchema.post("findOneAndUpdate", async function (doc) {
    if (doc) {
        await doc.constructor.calcAverageRatings(doc.product)
    }
})

const Review = mongoose.model("Review", reviewSchema)

export default Review