import mongoose from "mongoose"

const addressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    list: [{
        label: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        phoneNo: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        district: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        isDefault: {
            type: Boolean,
            default: false
        }
    }]

})

const Address = mongoose.model("Address", addressSchema)

export default Address