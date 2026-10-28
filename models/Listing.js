
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
    hostel: {
      type: String,
      required: true,
    },
    block: {
      type: String,
      required: true,
    },
    room: {
      type: String,
      required: true,
    },
    note: {
      type: String,
      default: "",
    },
    photo: {
      type: String,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Listing =
  mongoose.models.Listing ||
  mongoose.model("Listing", listingSchema);

export default Listing;
