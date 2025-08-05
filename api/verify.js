// pages/api/verify.js
export default async function handler(req, res) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ 
      success: false,
      message: 'Method Not Allowed' 
    });
  }

  // 2. Get token from request body
  const { token } = req.body;

  // 3. Validate token exists
  if (!token) {
    return res.status(400).json({ 
      success: false, 
      message: 'No token provided' 
    });
  }

  try {
    // 4. Verify with hCaptcha
    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: process.env.HCAPTCHA_SECRET_KEY,
        response: token,
      }),
    });

    const data = await response.json();

    // 5. Handle hCaptcha response
    if (data.success) {
      return res.json({ 
        success: true,
        redirectUrl: process.env.SUCCESS_REDIRECT_URL || '/' 
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Captcha verification failed',
        errorCodes: data['error-codes'] 
      });
    }
  } catch (error) {
    console.error('hCaptcha error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
