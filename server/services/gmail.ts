import nodemailer from 'nodemailer';
import { ISendMailArgs } from './resend';

export const send = async ({ to, subject, text }: ISendMailArgs) => {
  try {
    const from = process.env.GMAIL_EMAIL;
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from,
      to,
      subject,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    throw error;
  }
};
