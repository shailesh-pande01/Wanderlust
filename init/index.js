const mongoose = require("mongoose");
const initData = require("./data");
const Listing = require("../models/listing");

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