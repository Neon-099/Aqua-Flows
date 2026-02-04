// e:\Aquaflow\backend\src\utils\sendEmail.js


import sgMail from '@sendgrid/mail';
import { env } from '../config/env.js';

sgMail.setApiKey(env.SENDGRID_API_KEY);

export const sendEmail = async (options) => {
  const msg = {
    to: options.email,
    from: env.EMAIL_FROM,
    subject: options.subject,
    html: options.message,
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error(error);
    if (error.response) {
      console.error(error.response.body);
    }
    throw new Error('Email could not be sent');
  }
};
