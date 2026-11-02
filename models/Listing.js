import mongoose from "mongoose";

const listingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: "Other",
    },
    price: {
      type: Number,
      default: 0,
    },
    period: {
      type: String,
      default: "day",
    },
    hostel: {
      type: String,
      required: true,
      default: "Kalam",
    },
    block: {
      type: String,
      default: "A",
    },
    room: {
      type: String,
      default: "",
    },
    note: {
      type: String,
      default: "",
    },
    photo: {
      type: String,
      default: "",
    },
    emoji: {
      type: String,
      default: "📦",
    },
    color: {
      type: String,
      default: "mint",
    },
    quantity: {
      type: Number,
      default: 1,
      min: 0,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    ownerName: {
      type: String,
      default: "Campus Admin",
    },
    status: {
      type: String,
      enum: ["available", "rented", "removed"],
      default: "available",
    },
  },
  { timestamps: true }
);

const Listing =
  mongoose.models.Listing ||
  mongoose.model("Listing", listingSchema);

export default Listing;
