import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
  label: { type: String, required: true }, // e.g. "500g", "1kg"
  price: { type: Number, required: true },
  stock: { type: Number, required: true }
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    subcategory: { type: String, required: function() { return !!this.category; } }, // ✅ Add this line
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    isTopSelling: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null },
    variants: [variantSchema],
  },
  { timestamps: true }
);


const Product = mongoose.model("Product", productSchema);
export default Product;
