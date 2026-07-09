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

const initDB = async() => {
    await Listing.deleteMany({});
    await Listing.insertMany(initData.data);
    console.log("Data was initialized");
}

initDB();