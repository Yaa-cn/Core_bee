import mongoose from "mongoose"

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true,
    },
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
        },
        price: {
            type: Number,
            required: true,
        },
        quantity: {
            type: Number,
            default: 1,
            min: 1,
            required: true
        },
        orderStatus: {
            type: String,
            required: true,
            default: 'pending'
        },
        refundStatus: {
            type: String,
            default: null
        },
        returnStatus: {
            type: String,
            default: null
        },
        deliveredAt: {
            type: Date,
            default: null
        }
    }],
    shippingAddress: {
        name: {
            type: String,
            required: true,
        },
        phoneNo: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        district: {
            type: String,
            required: true,
        }
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    paymentMethod: {
        type: String,
        required: true,
    },
    paymentStatus: {
        type: String,
        required: true,
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

orderSchema.pre("save", function () {
    if (!this.orderId) {
        const now = new Date()

        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, "0")
        const day = String(now.getDate()).padStart(2, "0")
        const hours = String(now.getHours()).padStart(2, "0")
        const minutes = String(now.getMinutes()).padStart(2, "0")
        const seconds = String(now.getSeconds()).padStart(2, "0")

        this.orderId = `ORD-${year}${month}${day}-${hours}${minutes}${seconds}-${Math.floor(Math.random() * 1000)}`
    }
})


const Order = mongoose.model("Order", orderSchema)

export default Order