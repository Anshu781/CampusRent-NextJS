import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      required: true,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    mode: {
      type: String,
      enum: ["rent", "buy"],
      required: true,
    },
    hostel: {
      type: String,
      required: true,
      trim: true,
    },
    block: {
      type: String,
      required: true,
      trim: true,
    },
    room: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      required: [true, "Phone number is required for admin contact and verification"],
      trim: true,
    },
    photo: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "contacted", "verified", "rejected", "completed"],
      default: "pending",
    },
    adminNotes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Request =
  mongoose.models.Request ||
  mongoose.model("Request", requestSchema);

export default Request;
