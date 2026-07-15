import mongoose from "mongoose"

const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        }
    }]
})

const Wishlist = mongoose.model("Wishlist", wishlistSchema, "wishlist")

export default Wishlist