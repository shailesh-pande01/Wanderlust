if (process.env.NODE_ENV !== "production") {
    require('dotenv').config({path: '../.env'});
}

const mongoose = require("mongoose");
const initData = require("./data");
const Listing = require("../models/listing");

const MONGO_URl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/wonderlust';

main().then(() => {
    console.log("connected DB");
})
.catch((err) => {
    console.log(err);
})

async function main() {
    await mongoose.connect(MONGO_URl);
}

const User = require("../models/user");
const bcrypt = require("bcrypt");

const initDB = async() => {
    await Listing.deleteMany({});
    await User.deleteMany({});
    
    // Create an admin user to own initial listings
    const hashedPassword = await bcrypt.hash("admin123", 12);
    const adminUser = new User({
        username: "admin_host",
        email: "admin@wanderlust.com",
        password: hashedPassword,
        role: "host"
    });
    await adminUser.save();

    initData.data = initData.data.map((obj) => ({...obj, owner: adminUser._id}));
    await Listing.insertMany(initData.data);
    console.log("Data was initialized with owner");
}

initDB().then(() => {
    mongoose.connection.close();
});