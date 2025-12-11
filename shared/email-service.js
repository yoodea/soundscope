const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GOOGLE_EMAIL,
    pass: process.env.GOOGLE_PASSWORD
  }
});

async function sendOtpEmail(to, code) {
  if (!process.env.GOOGLE_EMAIL || !process.env.GOOGLE_PASSWORD) {
    console.warn("GOOGLE_EMAIL/GOOGLE_PASSWORD not set. Skipping actual email send.");
    console.log(`OTP for ${to}: ${code}`);
    return;
  }

  const mailOptions = {
    from: `"SoundScope" <${process.env.GOOGLE_EMAIL}>`,
    to,
    subject: "Your SoundScope OTP Code",
    text: `Your SoundScope login OTP is: ${code}\nThis code will expire in 5 minutes.`
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail };