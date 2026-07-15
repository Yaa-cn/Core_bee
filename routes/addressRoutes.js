import { Router } from "express"
import Address from "../models/address.js"

const router = Router()

router.get("/addresses", async (req, res) => {
    try {
        const addresses = await Address.find()
        res.status(200).json(addresses)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

router.get("/addresses/:id", async (req, res) => {
    try {
        const { id } = req.params

        const address = await Address.findById(id)
        if (!address) {
            return res.status(404).json({ message: "Address not found !" })
        }
        res.status(200).json(address)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

router.post("/addresses", async (req, res) => {
    try {
        const address = new Address(req.body)
        await address.save()
        res.status(201).json(address)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

router.patch("/addresses/:id", async (req, res) => {
    try {
        const address = await Address.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { returnDocument: "after" }
        )

        if (!address) {
            return res.status(404).json({ message: "Address not found !" })
        }

        res.status(200).json(address)

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

router.delete("/addresses/:id", async (req, res) => {
    try {
        const address = await Address.findByIdAndDelete(
            req.params.id
        )

        if (!address) {
            return res.status(404).json({ message: "Address not found !" })
        }

        res.status(200).json({ message: "Address deleted successfully" }, address)

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

export default router