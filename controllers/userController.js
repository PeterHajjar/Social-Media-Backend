const User = require("../models/userModel");

exports.getAllUsers = async (req, res) => {
    try {
      const users = await User.find(); //bring all the documents from the database
      if (users.length === 0) {
        return res.status(404).json({ message: "No users found" });
      }
      return res.status(200).json({ message: "Users found", data: users });
    } catch (err) {
      console.log(err);
    }
  };