import express from "express"
import routes from "./routes/routes.js"
import adminRoutes from "./routes/adminRoutes.js"
import dotenv from "dotenv"
import cors from "cors"
import connectDatabase from "./config/db.js"
import session from "express-session"
import MongoStore from "connect-mongo"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.set("trust proxy", 1)

const siteSession = session({
    name: 'site.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        ttl: 60 * 60 * 24
    }),
    cookie: {
        // secure: true,
        // sameSite: 'none'
    }
})

const dashSession = session({
    name: 'dash.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        ttl: 60 * 60 * 24
    }),
    cookie: {
        // secure: true,
        // sameSite: 'none'
    }
})

app.use(cors({
    origin: JSON.parse(process.env.CORS_ORIGIN),
    credentials: true
}))

connectDatabase()
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use("/api", siteSession, routes)
app.use("/admin", dashSession, adminRoutes)

// app.listen(PORT, () => {
//     console.log(`Server running at http://localhost:${PORT}`)
// })