// e:\Aquaflow\backend\src\utils\sendEmail.js

import { env } from '../config/env.js';

export const sendEmail = async (options) => {
  if (!env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL) {
    throw new Error('Brevo is not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL.');
  }

  const payload = {
    sender: {
      name: env.BREVO_SENDER_NAME || 'AquaFlow',
      email: env.BREVO_SENDER_EMAIL,
    },
    to: [
      {
        email: options.email,
        name: options.name || options.email,
      },
    ],
    subject: options.subject,
    htmlContent: options.message,
  };

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': env.BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('Brevo error:', res.status, body);
      throw new Error('Email could not be sent');
    }
  } catch (error) {
    console.error(error);
    throw new Error('Email could not be sent');
  }
};
