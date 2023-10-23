const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const postSchema = new mongoose.Schema(
  {
    postOwner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    imgs: {
      type: [String],
      default: "",
    },
    video: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      default: "",
      required: [true, "Please enter the post content"],
      trim: true,
      maxLength: 1000,
    },

    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);