const Post = require("../models/postModel");
const User = require("../models/userModel");

exports.createPost = async (req, res) => {
  try {
    // 1- Valid logged in user
    // 2- Validate all the post fields
    // 3- Create the post
    console.log(req.user);
    const postOwner = await User.findById(req.user._id);
    if (!postOwner) {
      res.status(401).json({ message: "You must be logged in" });
    }

    const newPost = await Post.create({
      postOwner: req.user.id,
      content: req.body.content,
    });
    res
      .status(201)
      .json({ message: "Post created successfully", data: newPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.like = async (req, res) => {
  try {
    //1- check if the post exists
    //2- check if the user is logged in
    // 3- if the user already liked this post we should unlike it
    // Else like the post

    const post = await Post.findById(req.params["postID"]);
    if (!post) {
      res.status(404).json({ message: "Post not found" });
    }
    if (!post.likes.includes(req.user.id)) {
      await post.updateOne({ $push: { likes: req.user.id } });
      return res.status(200).json("The post has been liked");
    } else {
      await post.updateOne({ $pull: { likes: req.user.id } });
      return res.status(200).json("The post has been unliked");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.fetchTimeLinePosts = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      res.status(401).json({ message: "You must be logged in" });
    }
    const userPosts = await Post.findOne({ postOwner: req.user.id });
    const friendPosts = await Promise.all(
      currentUser.followers.map((friendID) => {
        return Post.find({ postOwner: friendID });
      })
    );
    const timeLinePosts = userPosts.concat(...friendPosts);

    return timeLinePosts.length < 0
      ? res.status(404).json({ message: "No posts found" })
      : res.status(200).json({ message: "Posts found", data: timeLinePosts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};
