import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/acbbakery";

const products = [
  {
    name: "Butter Croissant",
    category: "Pastry",
    price: 50,
    description: "Flaky and buttery croissant",
    image: "https://via.placeholder.com/150",
    stock: 20,
  },
  {
    name: "Chocolate Cake",
    category: "Cake",
    price: 300,
    description: "Rich chocolate layered cake",
    image: "https://via.placeholder.com/150",
    stock: 10,
  },
  {
    name: "Garlic Bread",
    category: "Bread",
    price: 100,
    description: "Freshly baked garlic bread",
    image: "https://via.placeholder.com/150",
    stock: 15,
  },
];

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    await Product.deleteMany();
    await Product.insertMany(products);
    console.log("✅ Dummy products added");
    process.exit();
  })
  .catch((err) => {
    console.error("❌ Error seeding data:", err);
    process.exit(1);
  });
