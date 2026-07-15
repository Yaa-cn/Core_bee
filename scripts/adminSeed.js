import mongoose from "mongoose"
import dotenv from "dotenv"
import User from "../models/user.js"

dotenv.config()

const seedAdmin = async () => {
    try {
        const mongoUri = process.env.MONGO_URI
        if (!mongoUri) {
            console.error("MONGO_URI not defined in .env")
            process.exit(1)
        }

        await mongoose.connect(mongoUri)
        console.log("Database connected successfully.")

        const adminEmail = "admin@gmail.com"
        const existingAdmin = await User.findOne({ email: adminEmail })

        if (existingAdmin) {
            console.log(`Admin user with email ${adminEmail} already exists.`)
        } else {
            const adminUser = new User({
                name: "Administrator",
                email: adminEmail,
                password: "admin123",
                role: "admin"
            })
            await adminUser.save()
        }

        await mongoose.disconnect()
        console.log("Database disconnected.")
        process.exit(0)
    } catch (err) {
        console.error("Error seeding admin user:", err.message)
        process.exit(1)
    }
}

seedAdmin()
