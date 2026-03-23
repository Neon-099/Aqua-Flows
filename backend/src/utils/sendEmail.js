// e:\Aquaflow\backend\src\utils\sendEmail.js

import { env } from '../config/env.js';

export const sendEmail = async (options) => {
  if (!env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL) {
    throw new Error('Brevo is not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL.');
  }

  // Brevo API v3 requires an API key (typically starts with "xkeysib-").
  // SMTP keys (often start with "xsmtpsib-") will fail with 401 Key not found.
  if (env.BREVO_API_KEY.startsWith('xsmtpsib-')) {
    throw new Error(
      'BREVO_API_KEY looks like an SMTP key (xsmtpsib-). Use a Brevo API key (xkeysib-) for the HTTP API, or switch to SMTP sending.'
    );
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
      throw new Error(`Email could not be sent (Brevo ${res.status}).`);
    }
  } catch (error) {
    console.error(error);
    throw new Error('Email could not be sent');
  }
};
