const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema } = require("./schema.js");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("./models/user.js");
const { verifyToken, isLoggedIn, isHost, isOwner } = require("./utils/middleware.js");

const MONGO_URl = process.env.MONGO_URL || 'mongodb+srv://shailesh_pande01:Sp35189013@cluster0.az0w0gk.mongodb.net/wonderlust?retryWrites=true&w=majority&appName=Cluster0';

main().then(() => {
    console.log("connected DB");
})
.catch((err) => {
    console.log(err);
})

async function main() {
    await mongoose.connect(MONGO_URl);
}

app.set("view engine", "ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));
app.use(cookieParser());
app.use(verifyToken);
app.use((req, res, next) => {
    res.locals.currUser = req.user;
    next();
});

app.get("/",(req,res) => {
    res.redirect("/listings");
});

// Auth Routes
app.get("/signup", (req, res) => {
    res.render("users/signup.ejs");
});

app.post("/signup", wrapAsync(async (req, res, next) => {
    const { username, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ username, email, password: hashedPassword, role });
    await user.save();
    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'supersecretstring');
    res.cookie('token', token, { httpOnly: true });
    res.redirect("/listings");
}));

app.get("/login", (req, res) => {
    res.render("users/login.ejs");
});

app.post("/login", wrapAsync(async (req, res, next) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
        return next(new ExpressError(401, "Invalid username or password"));
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        return next(new ExpressError(401, "Invalid username or password"));
    }
    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'supersecretstring');
    res.cookie('token', token, { httpOnly: true });
    res.redirect("/listings");
}));

app.get("/logout", (req, res) => {
    res.clearCookie('token');
    res.redirect("/listings");
});

const validateListing = (req,res,next) => {
    const {error} = listingSchema.validate(req.body);
    if (error) {
        throw new ExpressError(400, error.details[0].message);
    }
    next();
};

//Index Route
app.get("/listings",async (req,res) => {
    const allListings = await Listing.find({}).populate("owner");
    res.render("listings/index.ejs",{allListings});
});

//New Route
app.get("/listings/new", isLoggedIn, isHost, (req,res) => {
    res.render("listings/new.ejs");
});

//Show Route
app.get("/listings/:id",async (req,res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id).populate("owner");
    if (!listing) {
        throw new ExpressError(404, "Listing not found");
    }
    res.render("listings/show.ejs",{listing})
});

//Create Route
app.post("/listings", isLoggedIn, isHost, validateListing, wrapAsync(async (req,res,next) => {
    let newListing = new Listing(req.body.listing);
    newListing.owner = req.user.id;
    await newListing.save();
    res.redirect("/listings");
}));

//Edit route
app.get("/listings/:id/edit", isLoggedIn, isOwner, wrapAsync(async (req,res,next) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs",{listing})
}));

//Update route
app.put("/listings/:id", isLoggedIn, isOwner, validateListing, wrapAsync(async (req,res,next) => {
    let {id} = req.params;
    await Listing.findByIdAndUpdate(id,{...req.body.listing});
    res.redirect(`/listings/${id}`) ;
}));

//Delete route
app.delete("/listings/:id", isLoggedIn, isOwner, wrapAsync(async (req,res,next) => {
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
}));

// app.get("/testListing",async (re,res) => {
//     let sampleListing  = new Listing({
//         title:"My New Villa",
//         description: "By the beach",
//         price: 1200,
//         location: "Calangute, Goa",
//         country: "India",
//     });

//     await sampleListing.save();
//     console.log("Sample was saved");
//     res.send("Successful testing");
// })

app.all("/*splat", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});
app.use((err,req,res,next) => {
    let {statusCode = 500} = err;
    res.status(statusCode).render("error.ejs",{err});
    // res.status(statusCode).send(message);
});

app.listen(8080, ()=>{
    console.log("server is listening to port 8080");
});

module.exports = app;