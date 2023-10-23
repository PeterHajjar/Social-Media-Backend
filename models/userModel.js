const mongoose = require("mongoose");
const crypto = require("crypto");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");
const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      trim: true,
      required: [true, "Please Enter your Full Name"],
    },
    username: {
      type: String,
      trim: true,
      required: [true, "Please Enter your username"],
      unique: true,
    },

    phoneNumber: {
      type: String,
    },
    email: {
      type: String,
      required: [true, "Please Enter your email address"],
      unique: true,
    },
    password: {
      type: String,
      minLength: 8,
      maxLength: 35,
      trim: true,
      required: [true, "Please Enter your password"],
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin", "owner"],
    },
    friends: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    posts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  //hooks that run automatically after each change and in the pre we should autmatically call this function on save
  try {
    if (!this.isModified("password")) {
      next(); //move to the next middleware or the next logic dont block the execution
    }

    this.password = await bcrypt.hash(this.password, 12);
  } catch (err) {
    console.log(err);
  }
});

userSchema.pre("save", async function (next) {
  //hooks that run automatically after each change and in the pre we should autmatically call this function on save
  try {
    if (!this.isModified("password") || this.isNew) {
      next();
    }

    this.passwordChangedAt = Date.now() - 1000;
  } catch (err) {
    console.log(err);
  }
});

userSchema.methods.checkPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.passwordChangedAfterTokenIssued = function (JWTtimestamp) {
  if (this.passwordChangedAt) {
    const passwordChangeTime = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10 //base 10 in order te be a decimal number
    );
    return passwordChangeTime > JWTtimestamp;
  }
  return false;
};

userSchema.methods.generatePasswordResetToken = function () {
  // i need to create a token using the crypto package
  const resetToken = crypto.randomBytes(32).toString("hex");
  // we are assigning the passwordResetToken field to the generated reset token after encryption
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;// we are returning the plain text resetToken
};
module.exports = mongoose.model("User", userSchema);
