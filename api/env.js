export default function handler(req, res) {
  res.status(200).json({
    client_id: process.env.VERCEL_CLIENT_ID || ''
  });
}
