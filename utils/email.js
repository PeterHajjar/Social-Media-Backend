const nodemailer = require("nodemailer");
//function that will take options and create the transporter and let us send the emails

exports.sendMail = async (options) => {
  // 1- Create the transporter which is object to connect mail trap server and use it to send the emails
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME, // user not username
      pass: process.env.EMAIL_PASSWORD, //pass not password
    },
  });

  // 2- Define the mail options
  const mailOptions = {
    from: "TECHlarious <info@techlarious.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // 3- Send the email
  await transporter.sendMail(mailOptions);
};
