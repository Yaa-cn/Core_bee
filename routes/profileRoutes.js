import { Router } from "express"
import { auth } from "../middleware/auth.js"
import User from "../models/user.js"
import Address from "../models/address.js"

const router = Router()

router.get("/user", auth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId, "-_id name email")
        res.status(200).json(user)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

router.patch("/user", auth, async (req, res) => {
    try {

        const user = await User.findByIdAndUpdate(
            req.session.userId,
            { $set: req.body },
            { returnDocument: "after" }
        )

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found !" })
        }

        res.status(200).json({ success: true, user })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})


// Profile Address Routes

router.get("/address", auth, async (req, res) => {
    try {
        const user = req.session.userId
        const addressesList = await Address.find({ user })

        if (!addressesList) {
            return res.status(200).json({ success: true, message: 'No address added yet !', addresses: [] })
        }

        const addresses = addressesList[0].list.sort((a, b) => b.isDefault - a.isDefault)

        res.status(200).json({ success: true, addresses })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

router.post("/address", auth, async (req, res) => {
    try {

        const user = req.session.userId

        let addresses = await Address.findOne({ user })

        if (!addresses) {
            addresses = new Address({ user, addresses: [] })
        }

        const existAddress = addresses.list.some(address => address.label.toString() === req.body.label.toString())

        if (existAddress) {
            return res.status(409).json({ message: "Address with this label already exists !" })
        }

        if (req.body.isDefault === true) {
            addresses.list.forEach(address => address.isDefault = false)
        }

        addresses.list.push(req.body)
        await addresses.save()
        res.status(201).json({ success: true, message: "Address added successfully !", addresses })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

router.patch("/address/:id", auth, async (req, res) => {
    try {
        const { id } = req.params
        const user = req.session.userId

        let addresses = await Address.findOne({ user })

        if (req.body.isDefault === true) {
            addresses.list.forEach(address => address.isDefault = false)
            await addresses.save()
        }

        const address = await Address.findOneAndUpdate(
            { user, "list._id": id },
            { $set: { "list.$": req.body } },
            { returnDocument: "after" }
        )

        res.status(200).json({ success: true, address })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

router.delete("/address/:id", auth, async (req, res) => {
    try {
        const { id } = req.params
        const user = req.session.userId


        let addresses = await Address.findOne({ user })

        addresses.list = addresses.list.filter(address => !address._id.equals(id))
        await addresses.save()
        res.status(200).json({ message: "Address deleted successfully !", addresses })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

export default router