import User from "../models/user.js"

export const auth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        })
    }
    next()
}

export const adminAuth = async (req, res, next) => {
    if (!req.session.adminId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        })
    }
    try {
        const user = await User.findById(req.session.adminId)
        if (!user || user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Forbidden: Admin access required"
            })
        }
        req.user = user
        next()
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message })
    }
}