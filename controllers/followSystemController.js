const User = require("../models/userModel");

exports.followUnfollow = async (req, res) => {
  if (req.params.userID !== req.user.id) {
    try {
      const currentUser = await User.findOne({ _id: req.user.id });
      if (!currentUser) {
        res
          .status(401)
          .json({ message: "Please Login to perform this action" });
      }

      const userToFollow = await User.findOne({ _id: req.params.userID });
      if (!userToFollow) {
        res
          .status(404)
          .json({ message: "User to follow/unfollow was not found" });
      }
      if (!userToFollow.followers.includes(req.user.id)) {
        await userToFollow.updateOne({ $push: { followers: req.user.id } });
        await currentUser.updateOne({
          $push: { following: req.params.userID },
        });
        res.status(200).json({ message: "User Followed Successfully" });
      } else {
        await userToFollow.updateOne({ $pull: { followers: req.user.id } });
        await currentUser.updateOne({
          $pull: { following: req.params.userID },
        });
        res.status(200).json({ message: "User Unfollowed Successfully" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).status({ message: "Something went Wrong" });
    }
  } else {
    res.status(409).json({ message: "You cannot follow/unfollow yourself" }); //409 conflict
  }
};
