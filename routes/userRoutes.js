// import { Router } from "express"
// import { adminAuth } from "../middleware/auth.js"
// import User from "../models/user.js"

// const router = Router()

// router.get("/users", adminAuth, async (req, res) => {
//     try {
//         const users = await User.find()
//         res.status(200).json(users)
//     } catch (err) {
//         res.status(500).json({ message: err.message })
//     }
// })

// router.get("/users/:id", adminAuth, async (req, res) => {
//     try {
//         const { id } = req.params

//         const user = await User.findById(id)
//         if (!user) {
//             return res.status(404).json({ message: "User not found !" })
//         }
//         res.status(200).json(user)
//     } catch (err) {
//         res.status(500).json({ message: err.message })
//     }
// })

// router.post("/users", adminAuth, async (req, res) => {
//     try {
//         const user = new User(req.body)
//         await user.save()
//         res.status(201).json(user)
//     } catch (err) {
//         res.status(500).json({ message: err.message })
//     }
// })

// router.patch("/users/:id", adminAuth, async (req, res) => {
//     try {
//         const user = await User.findByIdAndUpdate(
//             req.params.id,
//             { $set: req.body },
//             { returnDocument: "after" }
//         )

//         if (!user) {
//             return res.status(404).json({ message: "User not found !" })
//         }

//         res.status(200).json(user)

//     } catch (err) {
//         res.status(500).json({ message: err.message })
//     }
// })

// router.delete("/users/:id", adminAuth, async (req, res) => {
//     try {
//         const user = await User.findByIdAndDelete(
//             req.params.id
//         )

//         if (!user) {
//             return res.status(404).json({ message: "User not found !" })
//         }

//         res.status(200).json({ message: "User deleted successfully", user })

//     } catch (err) {
//         res.status(500).json({ message: err.message })
//     }
// })

// export default router