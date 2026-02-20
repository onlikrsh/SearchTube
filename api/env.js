export default function handler(req, res) {
  res.status(200).json({
    api_key: process.env.VERCEL_API_KEY || ''
  });
}
