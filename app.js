require("dotenv").config();
// ---------------------------------------------- express and mongoose
const express = require('express');
const app = express();
const mongoose = require('mongoose');
// ---------------------------------------------- EJS and path
const path = require('path');
const engine = require('ejs-mate');
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// ---------------------------------------------- Method Override
const methodOverride = require('method-override');
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
// ---------------------------------------------- Models
const User = require('./models/user');
// ---------------------------------------------- Routers
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');          
const reportRoutes = require('./routes/report');      
// ---------------------------------------------- Static Files
app.use(express.static(path.join(__dirname, 'public')));
// ---------------------------------------------- Session and Flash
const session = require('express-session');
const flash = require('connect-flash');
// ---------------------------------------------- Passport
const passport = require('passport');
const LocalStrategy = require('passport-local');
// ---------------------------------------------- ExpressError
const ExpressError = require('./utils/ExpressError');

// ---------------------------------------------- Middlewares for Session & Passport
// Session and Flash
app.use(session({
    secret: process.env.SECRET || "keyboardcat",
    resave: false,
    saveUninitialized: true
}));
app.use(flash());

// Passport Config
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash locals
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

// Routes
app.use("/", authRoutes);
app.use("/users", userRoutes);        
app.use("/reports", reportRoutes);    

// Home
app.get("/", (req, res) => {
    res.redirect("/home");
});
app.get("/home", (req, res) => {
    res.render("home");
});

// Error Handlers
app.use((req, res, next) => {
    next(new ExpressError(`Page Not Found: ${req.originalUrl}`, 404));
});
app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render("error", { err });
});

// MongoDB Connection
async function main() {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to DB - ocumedai");
}
main().catch(err => console.log("MongoDB connection error:", err));


app.listen(8111, () => {
    console.log("Server is listening on port 8111");
});  //app.js
