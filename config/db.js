import mongoose from "mongoose"

let cache = null

const connectDatabase = async () => {
    try {

        if (cache) {
            return cache
        }

        cache = await mongoose.connect(process.env.MONGO_URI)
        console.log("Database connected successfully")

        return cache
        
    } catch (error) {
        console.error("Database connection failed", error.message)
        process.exit(1)
    }
}

export default connectDatabase