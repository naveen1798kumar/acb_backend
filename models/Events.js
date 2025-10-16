import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, },
    description: { type: String, trim: true, },
    image: { type: String, default: "", },
    startDate: { type: Date },
    endDate: { type: Date },
    
    // ✅ Link products (can reuse existing product IDs)
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product", }, ],
    isActive: { type: Boolean, default: true, },
  }, { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);
export default Event;
