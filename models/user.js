import mongoose from "mongoose"
import bcrypt from "bcrypt"

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        default: "user"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return
    }
    try {
        this.password = await bcrypt.hash(this.password, 10)
    } catch (err) {
        throw err
    }
})

const User = mongoose.model("User", userSchema)

export default User