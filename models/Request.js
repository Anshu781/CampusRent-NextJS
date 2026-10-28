
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
    photo: {
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
