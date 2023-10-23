const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const commentSchema = new mongoose.Schema({
  commentOwner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  parentPost:{
    type: Schema.Types.ObjectId,
    ref: "Post",
  },
  content:{
    type: String,
    default:"",
    trim: true,
    required: [true,"Please enter the comment content"],
  },

  commentLikes:[{
    type: Schema.Types.ObjectId,
    ref: "User",
  }],

  commentReplies:[{
    type: Schema.Types.ObjectId,
    ref: "Comment",
  }],
});

module.exports = mongoose.model("Comment", userSchema);
