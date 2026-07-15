import { Router } from "express"
import { adminAuth } from "../middleware/auth.js"
import User from "../models/user.js"
import Product from "../models/product.js"
import Order from "../models/order.js"
import bcrypt from "bcrypt"

const router = Router()

// User routes 

router.get("/users", adminAuth, async (req, res) => {
    try {
        const users = await User.find()
        res.status(200).json(users)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

router.get("/users/:id", adminAuth, async (req, res) => {
    try {
        const { id } = req.params

        const user = await User.findById(id)
        if (!user) {
            return res.status(404).json({ message: "User not found !" })
        }
        res.status(200).json(user)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

router.post("/users", adminAuth, async (req, res) => {
    try {
        const user = new User(req.body)
        await user.save()
        res.status(201).json(user)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

router.patch("/users/:id", adminAuth, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { returnDocument: "after" }
        )

        if (!user) {
            return res.status(404).json({ message: "User not found !" })
        }

        res.status(200).json(user)

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

router.delete("/users/:id", adminAuth, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(
            req.params.id
        )

        if (!user) {
            return res.status(404).json({ message: "User not found !" })
        }

        res.status(200).json({ message: "User deleted successfully", user })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})


// Product routes

router.post("/products", adminAuth, async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save()
        res.status(201).json(product)
    } catch (err) {
        res.status(400).json({ message: err.message })
    }
})

router.patch("/products/:id", adminAuth, async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { returnDocument: "after" }
        )

        if (!product) {
            return res.status(404).json({ message: "Product not found !" })
        }

        res.status(200).json(product)

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

router.delete("/products/:id", adminAuth, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(
            req.params.id
        )

        if (!product) {
            return res.status(404).json({ message: "Product not found !" })
        }

        res.status(200).json({ message: "Product deleted successfully", product })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})


// Auth Routes

router.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body

        const user = await User.findOne({ email })

        if (!user || user.role !== 'admin') {
            return res.status(404).json({ success: false, message: "User not found !" })
        }
        const match = await bcrypt.compare(password, user.password)

        if (!match) {
            return res.status(401).json({ success: false, message: "Invalid password !" })
        }

        req.session.adminId = user._id

        const userData = {
            name: user.name,
            email: user.email,
            role: user.role
        }

        res.status(200).json({
            success: true, message: "Login successful !", user: userData
        })

    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
})

router.get('/auth/check', async (req, res) => {
    try {
        const user = await User.findById(req.session.adminId).select("-_id name email role")
        res.status(200).json({ success: true, user })
    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
})

// Logout 

router.post('/auth/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: "Logout failed !" })
        }
        res.clearCookie('dash.sid')
        res.status(200).json({ message: "Logged out successfully  !" })
    })
})



// Order Routes

// Get all orders
router.get("/orders", adminAuth, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("user", "name email")
            .populate("items.product")
            .sort({ createdAt: -1 })
        res.status(200).json({ success: true, orders })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

// Get all orders that have return items
router.get("/orders/returns", adminAuth, async (req, res) => {
    try {
        const orders = await Order.find({
            "items.returnStatus": { $in: ["requested", "approved", "rejected", "returned"] }
        })
            .populate("user", "name email")
            .populate("items.product")
            .sort({ createdAt: -1 })

        // Flatten into individual return items with order context
        const returnItems = []
        orders.forEach(order => {
            order.items.forEach(item => {
                if (item.returnStatus) {
                    returnItems.push({
                        orderId: order.orderId,
                        orderMongoId: order._id,
                        itemId: item._id,
                        user: order.user,
                        product: item.product,
                        price: item.price,
                        quantity: item.quantity,
                        paymentMethod: order.paymentMethod,
                        paymentStatus: order.paymentStatus,
                        createdAt: order.createdAt,
                        returnStatus: item.returnStatus,
                        refundStatus: item.refundStatus
                    })
                }
            })
        })

        res.status(200).json({ success: true, returnItems })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

// Update a single item's orderStatus within an order
router.patch("/orders/:orderId/items/:itemId/status", adminAuth, async (req, res) => {
    try {
        const { orderId, itemId } = req.params
        const { orderStatus, paymentStatus, refundStatus } = req.body

        const VALID_STATUSES = ['processing', 'shipped', 'cancelled', 'delivered']
        const VALID_REFUND_STATUSES = [null, 'pending', 'refunded', 'rejected']

        if (orderStatus && !VALID_STATUSES.includes(orderStatus)) {
            return res.status(400).json({ success: false, message: "Invalid order status value" })
        }

        if (refundStatus !== undefined && !VALID_REFUND_STATUSES.includes(refundStatus)) {
            return res.status(400).json({ success: false, message: "Invalid refund status value" })
        }

        // Find order to check payment method
        const existingOrder = await Order.findOne({ orderId })
        if (!existingOrder) {
            return res.status(404).json({ success: false, message: "Order not found" })
        }

        const isCOD = existingOrder.paymentMethod && (
            existingOrder.paymentMethod.toLowerCase() === 'cod' ||
            existingOrder.paymentMethod.toLowerCase() === 'cash on delivery' ||
            existingOrder.paymentMethod.toLowerCase().includes('cash')
        )

        // Build the update object for the matching item
        const updateFields = {}
        if (orderStatus !== undefined) {
            if (orderStatus === 'delivered') {
                updateFields["items.$.orderStatus"] = orderStatus
                updateFields["items.$.deliveredAt"] = new Date()
            } else {
                updateFields["items.$.orderStatus"] = orderStatus
            }
        }

        if (refundStatus !== undefined) {
            updateFields["items.$.refundStatus"] = refundStatus
        }

        // Build order-level update fields (paymentStatus is order-level)
        const orderLevelUpdate = {}
        if (paymentStatus !== undefined) {
            orderLevelUpdate.paymentStatus = paymentStatus
        }

        // When cash on delivery item is cancelled, change payment status also to cancelled
        if (orderStatus === 'cancelled' && isCOD) {
            orderLevelUpdate.paymentStatus = 'cancelled'
        }

        const combinedUpdate = { $set: { ...updateFields, ...orderLevelUpdate } }

        const order = await Order.findOneAndUpdate(
            { orderId, "items._id": itemId },
            combinedUpdate,
            { returnDocument: 'after' }
        ).populate("user", "name email").populate("items.product")

        if (!order) {
            return res.status(404).json({ success: false, message: "Order or item not found" })
        }

        res.status(200).json({ success: true, message: "Item status updated successfully", order })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

// Accept or reject a return request for a specific item
// action: "accept" => sets item to "returned" and order paymentStatus to "refunded"
// action: "reject" => sets item to "return rejected"
// action: "return" => sets item to "returned"
router.patch("/orders/:orderId/items/:itemId/return-action", adminAuth, async (req, res) => {
    try {
        const { orderId, itemId } = req.params
        const { action } = req.body // "accept" | "reject" | "return"

        if (!["accept", "reject", "return"].includes(action)) {
            return res.status(400).json({ success: false, message: "Action must be 'accept', 'reject', or 'return'" })
        }

        const existingOrder = await Order.findOne({ orderId })
        if (!existingOrder) {
            return res.status(404).json({ success: false, message: "Order not found" })
        }

        let newReturnStatus = "return requested";
        if (action === "accept") newReturnStatus = "approved";
        if (action === "reject") newReturnStatus = "rejected";
        if (action === "return") newReturnStatus = "returned";

        // Build update — if accepting, also set paymentStatus to refunded
        const updateFields = {
            "items.$.returnStatus": newReturnStatus,
        }
        if (action === "accept") {
            updateFields["items.$.refundStatus"] = "pending"
        }
        // } else if (action === "return") {
        //     updateFields["items.$.refundStatus"] = "refunded"
        // }
        // if (action === "accept") {
        //     updateFields.paymentStatus = "refunded"
        // } else if (action === "reject") {
        //     // "when card payment return request rejected payment status want to be remain paid"
        //     // If it's not cash on delivery (i.e., it's a card payment), ensure payment status remains 'paid' (or completed)
        //     if (!isCOD) {
        //         // If it's not already paid/completed, reset it back to 'paid' (or keep existing paid/completed value)
        //         if (existingOrder.paymentStatus !== 'paid' && existingOrder.paymentStatus !== 'completed') {
        //             updateFields.paymentStatus = 'paid'
        //         }
        //     }
        // }

        const order = await Order.findOneAndUpdate(
            { orderId, "items._id": itemId },
            { $set: updateFields },
            { returnDocument: 'after' }
        ).populate("user", "name email").populate("items.product")

        if (!order) {
            return res.status(404).json({ success: false, message: "Order or item not found" })
        }

        let message = "Return action successful."
        if (action === "accept") message = "Return approved."
        if (action === "reject") message = "Return request rejected."
        if (action === "return") message = "Item marked as returned."

        res.status(200).json({ success: true, message, order })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})


export default router