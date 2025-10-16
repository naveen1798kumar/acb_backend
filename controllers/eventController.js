import Event from "../models/Events.js";
import Product from "../models/Product.js";

// ✅ Get all events
export const getEvents = async (req, res) => {
  try {
    const events = await Event.find().populate("products");
    res.json(events);
  } catch (err) {
    console.error("❌ Error fetching events:", err);
    res.status(500).json({ message: "Failed to fetch events" });
  }
};

// ✅ Get single event
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("products");
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (err) {
    console.error("❌ Error fetching event:", err);
    res.status(500).json({ message: "Failed to fetch event" });
  }
};

// ✅ Create new event (backend)
export const createEvent = async (req, res) => {
  try {
    const { name, description, startDate, endDate, products } = req.body;
    const image = req.file ? req.file.path : ""; // Cloudinary auto-provides secure_url

    const event = new Event({
      name,
      description,
      startDate,
      endDate,
      image,
      products: products ? products.split(",") : [],
    });

    await event.save();
    res.status(201).json({ message: "✅ Event created", event });
  } catch (err) {
    console.error("❌ Error creating event:", err);
    res.status(400).json({ message: "Failed to create event" });
  }
};


// ✅ Update event (add/remove products)
export const updateEvent = async (req, res) => {
  try {
    const { name, description, startDate, endDate, products, isActive } = req.body;
    const image = req.file ? req.file.path : undefined;

    const parsedProducts = Array.isArray(products)
      ? products
      : products
      ? products.split(",").map((p) => p.trim())
      : [];

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    event.name = name || event.name;
    event.description = description || event.description;
    event.startDate = startDate || event.startDate;
    event.endDate = endDate || event.endDate;
    event.products = parsedProducts.length ? parsedProducts : event.products;
    event.isActive = isActive ?? event.isActive;
    if (image) event.image = image;

    await event.save();
    res.json({ message: "✅ Event updated", event });
  } catch (err) {
    console.error("❌ Error updating event:", err);
    res.status(500).json({ message: err.message });
  }
};


// ✅ Delete event
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    await event.deleteOne();
    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting event:", err);
    res.status(500).json({ message: "Failed to delete event" });
  }
};
