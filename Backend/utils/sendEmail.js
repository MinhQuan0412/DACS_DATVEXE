const nodemailer = require('nodemailer');

const sendEmail = async ({ email, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false // Bỏ qua kiểm tra chứng chỉ khắt khe
      },
      logger: true,
      debug: true
    });

    const mailOptions = {
      from: `"Phòng vé BlueBus" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = sendEmail;
