import { Router } from "express"
import { auth, adminAuth } from "../middleware/auth.js"
import Cart from "../models/cart.js"
import Order from "../models/order.js"
import Product from "../models/product.js"
import crypto from "crypto"

const router = Router()

router.get("/orders", auth, async (req, res) => {
    try {

        const user = req.session.userId

        const orders = await Order.find({ user }).populate('items.product').sort({ createdAt: -1 })

        res.status(200).json({ success: true, orders })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})


router.get("/orders/:orderId", auth, async (req, res) => {
    try {

        const { orderId } = req.params
        const userId = req.session.userId

        const order = await Order.findOne({ orderId, user: userId })

        if (!order) {
            return res.status(400).json({ success: false, message: "Order not found !" })
        }

        res.status(200).json({ success: true, order })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})


router.patch("/orders/:orderId/cancel/:product", auth, async (req, res) => {
    try {
        const userId = req.session.userId
        const { orderId, product } = req.params

        let order = await Order.findOne({ user: userId, orderId })

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found !" })
        }

        const item = order.items.find(item => item.product._id.equals(product))

        if (!item) {
            return res.status(404).json({ success: false, message: "Product not found in order!" })
        }

        if (item.orderStatus !== 'processing') {
            return res.status(400).json({
                success: false,
                message: "Order cannot be canceled once it has been shipped or completed."
            })
        }

        const newTotal = order.totalAmount - (item.price * item.quantity)

        const updatedOrder = await Order.findOneAndUpdate(
            { user: userId, orderId, "items.product": product },
            { $set: { "items.$.orderStatus": "cancelled", totalAmount: newTotal } },
            { returnDocument: 'after' }
        )

        res.status(200).json({ success: true, message: 'Your order has been successfully canceled.', updatedOrder })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})


// router.patch("/orders/:orderId/return/:product", auth, async (req, res) => {
//     try {
//         const userId = req.session.userId
//         const { orderId, product } = req.params

//         let order = await Order.findOne({ user: userId, orderId })

//         if (!order) {
//             return res.status(404).json({ success: false, message: "Order not found !" })
//         }

//         const item = order.items.find(item => item.product._id.equals(product))

//         if (!item) {
//             return res.status(404).json({ success: false, message: "Product not found in order!" })
//         }

//         // const newTotal = order.totalAmount - (item.price * item.quantity)

//         // const updatedOrder = await Order.findOneAndUpdate(
//         //     { user: userId, orderId, "items.product": product },
//         //     { $set: { "items.$.orderStatus": "cancelled", totalAmount: newTotal } },
//         //     { returnDocument: 'after' }
//         // )

//         const updatedOrder = await Order.findOneAndUpdate(
//             { user: userId, orderId, "items.product": product },
//             { $set: { "items.$.orderStatus": "return requested" } },
//             { returnDocument: 'after' }
//         )

//         res.status(200).json({ success: true, message: 'Return request submitted successfully.', updatedOrder })

//     } catch (err) {
//         res.status(500).json({ message: err.message })
//     }
// })


router.patch("/orders/:orderId/return/:product", auth, async (req, res) => {
    try {
        const userId = req.session.userId
        const { orderId, product } = req.params

        let order = await Order.findOne({ user: userId, orderId })

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found !" })
        }

        const item = order.items.find(item => item.product._id.equals(product))

        if (!item) {
            return res.status(404).json({ success: false, message: "Product not found in order!" })
        }

        const deliverdAt = new Date(item.deliveredAt)
        const now = new Date()

        const dayPassed = (now - deliverdAt) / (1000 * 60 * 60 * 24)

        if (dayPassed > 7) {
            return res.status(400).json({
                success: false,
                message: "Return request cannot be submitted after 7 days!"
            })
        }

        // const newTotal = order.totalAmount - (item.price * item.quantity)

        // const updatedOrder = await Order.findOneAndUpdate(
        //     { user: userId, orderId, "items.product": product },
        //     { $set: { "items.$.orderStatus": "cancelled", totalAmount: newTotal } },
        //     { returnDocument: 'after' }
        // )

        const updatedOrder = await Order.findOneAndUpdate(
            { user: userId, orderId, "items.product": product },
            { $set: { "items.$.returnStatus": "requested" } },
            { returnDocument: 'after' }
        )

        res.status(200).json({ success: true, message: 'Return request submitted successfully.', updatedOrder })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})


router.post("/orders", auth, async (req, res) => {
    try {

        const user = req.session.userId

        const cart = await Cart.findOne({ user })
            .select("-_id items")
            .populate("items.product");

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        if (cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart cannot be empty!"
            });
        }

        const cartItems = cart.items.map(item => ({
            product: item.product._id,
            price: item.product.price,
            quantity: item.quantity,
            orderStatus: "processing"

        }))


        for (const item of cartItems) {

            const product = await Product.findById(item.product)

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found"
                })
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Not enough stock for ${product.name}`
                })
            }

            product.stock -= item.quantity
            await product.save()
        }

        const total = cart.items.reduce((sum, item) => {
            return sum + item.product.price * item.quantity
        }, 0)

        const order = new Order({
            user,
            items: cartItems,
            totalAmount: total,
            ...req.body
        })

        await order.save()

        await Cart.findOneAndUpdate(
            { user },
            { $set: { items: [] } }
        )

        const orderId = order.orderId

        res.status(201).json({
            success: true,
            orderId
        })

    } catch (err) {
        console.error(err)
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
})



router.post("/checkout", auth, async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            address,
            city,
            shippingAddress,
            paymentMethod
        } = req.body

        const user = req.session.userId

        const cart = await Cart.findOne({ user })
            .populate("items.product");

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            })
        }

        let total = 0

        const cartItems = []

        for (const item of cart.items) {

            const product = item.product

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found"
                });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `${product.name} is out of stock`
                });
            }

            total += product.price * item.quantity;

            cartItems.push({
                product: product._id,
                quantity: item.quantity,
                price: product.price,
                orderStatus: 'cancelled'
            })

        }

        const order = await Order.create({
            user,
            items: cartItems,
            totalAmount: total,
            shippingAddress,
            paymentMethod,
        })

        const merchant_id = process.env.MERCHANT_ID
        const merchant_secret = process.env.MERCHANT_SECRET

        const currency = "LKR";

        const amount = Number(total).toFixed(2)

        const hashedSecret = crypto
            .createHash("md5")
            .update(merchant_secret)
            .digest("hex")
            .toUpperCase();

        const hash = crypto
            .createHash("md5")
            .update(
                merchant_id +
                order.orderId +
                amount +
                currency +
                hashedSecret
            )
            .digest("hex")
            .toUpperCase()

        res.json({
            merchant_id,
            return_url: `${process.env.FRONTEND_URL}/orderstatus/${order.orderId}`,
            cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
            notify_url: `${process.env.BACKEND_URL}/api/notify`,
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            address,
            city,
            country: "Sri Lanka",
            order_id: order.orderId,
            items: order.orderId,
            currency,
            amount,
            hash
        })

        // for (const item of order.items) {
        //     const product = await Product.findById(item.product)
        //     if (product) {
        //         product.stock -= item.quantity
        //         await product.save()
        //     }
        // }

        // await Cart.updateOne(
        //     { user: order.user },
        //     { $set: { items: [] } }
        // )

        // order.paymentStatus = "paid"
        // order.orderStatus = "processing"
        // await order.save()

    }

    catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: error.message
        })

    }

})

router.post("/onsuccess", async (req, res) => {
    try {

        const { order_id } = req.body

        const order = await Order.findOne({ orderId: order_id })

        if (!order) return res.sendStatus(404)

        for (const item of order.items) {
            const product = await Product.findById(item.product)
            if (product) {
                product.stock -= item.quantity
                await product.save()
            }
            item.orderStatus = "processing"
        }

        await Cart.updateOne(
            { user: order.user },
            { $set: { items: [] } }
        )

        order.paymentStatus = "paid"
        await order.save()

        return res.sendStatus(200)

    } catch (error) {
        console.log(error)
        return res.sendStatus(500)
    }
})


router.post("/oncancel", async (req, res) => {
    try {

        const { order_id } = req.body

        const order = await Order.findOneAndDelete({ orderId: order_id })

        if (!order) return res.sendStatus(404)

        return res.sendStatus(200)

    } catch (error) {
        console.log(error)
        return res.sendStatus(500)
    }
})



// router.post("/notify", async (req, res) => {
//     try {

//         const { order_id, status_code } = req.body

//         const order = await Order.findOne({ orderId: order_id })

//         if (!order) return res.sendStatus(404)

//         if (status_code === "2" || status_code === 2) {

//             for (const item of order.items) {
//                 const product = await Product.findById(item.product)
//                 if (product) {
//                     product.stock -= item.quantity
//                     await product.save()
//                 }
//             }

//             await Cart.updateOne(
//                 { user: order.user },
//                 { $set: { items: [] } }
//             );

//             order.paymentStatus = "paid"
//             order.orderStatus = "processing"
//             await order.save()
//         }

//         return res.sendStatus(200)

//     } catch (error) {
//         console.log(error)
//         return res.sendStatus(500)
//     }
// })


export default router