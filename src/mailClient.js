// mailClient.js
import fetch from 'node-fetch';

const MAIL_SERVICE_URL = process.env.MAIL_SERVICE_URL; 
const MAIL_SERVICE_API_KEY = process.env.MAIL_SERVICE_API_KEY;

if (!MAIL_SERVICE_URL || !MAIL_SERVICE_API_KEY) {
  console.warn('[mailClient] Faltan MAIL_SERVICE_URL o MAIL_SERVICE_API_KEY');
}

export async function sendMail({ to, subject, html, text, cc = [], bcc = [], attachments = [] }) {
  const res = await fetch(`${MAIL_SERVICE_URL}/v1/mail/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': MAIL_SERVICE_API_KEY
    },
    body: JSON.stringify({ to, subject, html, text, cc, bcc, attachments })
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Mail service ${res.status}: ${detail}`);
  }
  return res.json();
}
