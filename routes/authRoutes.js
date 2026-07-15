import { Router } from "express"
import { auth } from "../middleware/auth.js"
import User from "../models/user.js"
import bcrypt from "bcrypt"

const router = Router()

router.post("/auth/register", async (req, res) => {
    try {
        const { name, email, password } = req.body

        const existUser = await User.findOne({ email })

        if (existUser) {
            return res.status(409).json({ success: false, message: "Email already exists !" })
        }

        const user = new User({ name, email, password })
        await user.save()
        res.status(201).json({ success: true, message: "Account created successfully !", user })

    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
})

router.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body

        const user = await User.findOne({ email })

        if (!user || user.role !== "user") {
            return res.status(404).json({ success: false, message: "User not found !" })
        }
        const match = await bcrypt.compare(password, user.password)

        if (!match) {
            return res.status(401).json({ success: false, message: "Invalid password !" })
        }

        req.session.userId = user._id

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
        const user = await User.findById(req.session.userId).select("-_id name email role")
        res.status(200).json({ success: true, user })
    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
})

router.post('/auth/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: "Logout failed !" })
        }
        res.clearCookie('site.sid')
        res.status(200).json({ message: "Logged out successfully  !" })
    })
})


export default router