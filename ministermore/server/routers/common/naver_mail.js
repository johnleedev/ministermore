const nodemailer = require('nodemailer');

const rawUser = process.env.NAVER_SMTP_USER || 'yeplat';
const navermail = {
  NAVER_USER: rawUser.includes('@') ? rawUser : `${rawUser}@naver.com`,
  NAVER_PASS: process.env.NAVER_SMTP_PASS || 'B4H34C39K4CD',
  NAVER_FROM: process.env.NAVER_SMTP_FROM || 'yeplat@naver.com',
};

const createNaverTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.naver.com',
    port: 465,
    secure: true,
    auth: {
      user: navermail.NAVER_USER,
      pass: navermail.NAVER_PASS,
    },
  });
};

module.exports = {
  navermail,
  createNaverTransporter,
};
