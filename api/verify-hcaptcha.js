export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { token } = req.body;
  const secret = process.env.HCAPTCHA_SECRET_KEY;

  if (!token || !secret) {
    return res.status(400).json({ success: false, error: "Missing token or secret" });
  }

  try {
    const verifyRes = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `response=${token}&secret=${secret}`
    });

    const data = await verifyRes.json();

    if (data.success) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(200).json({ success: false, error: data['error-codes'] });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
