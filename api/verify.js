// pages/api/verify.js
import { NextResponse } from 'next/server';

export const config = {
  runtime: 'edge', // Optional: Use Vercel Edge Runtime
};

export default async function handler(req) {
  // 1. Method Validation
  if (req.method !== 'POST') {
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        message: 'Method Not Allowed' 
      }),
      { 
        status: 405,
        headers: {
          'Allow': 'POST',
          'Content-Type': 'application/json'
        }
      }
    );
  }

  try {
    // 2. Parse Request Body
    const { token } = await req.json();

    // 3. Input Validation
    if (!token || typeof token !== 'string') {
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid token format' 
        }),
        { status: 400 }
      );
    }

    // 4. hCaptcha Verification with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const hcaptchaResponse = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: process.env.HCAPTCHA_SECRET_KEY,
        response: token,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const hcaptchaData = await hcaptchaResponse.json();

    // 5. Handle Verification Result
    if (!hcaptchaData.success) {
      const errorMessages = {
        'missing-input-secret': 'Internal configuration error',
        'invalid-input-secret': 'Internal configuration error',
        'missing-input-response': 'Please complete the captcha',
        'invalid-input-response': 'Invalid captcha response',
        'bad-request': 'Invalid request to captcha service',
        'invalid-or-already-seen-response': 'Captcha already used',
        'sitekey-secret-mismatch': 'Configuration mismatch',
      };

      const errorCode = hcaptchaData['error-codes']?.[0];
      const message = errorCode 
        ? errorMessages[errorCode] || 'Verification failed' 
        : 'Verification failed';

      return new NextResponse(
        JSON.stringify({ 
          success: false,
          message,
          errorCode,
          retryable: !['missing-input-secret', 'invalid-input-secret'].includes(errorCode),
        }),
        { status: 400 }
      );
    }

    // 6. Successful Verification
    const redirectUrl = new URL(
      process.env.SUCCESS_REDIRECT_URL || '/', 
      process.env.NEXTAUTH_URL || req.nextUrl.origin
    );

    // Generate one-time token for additional security
    const crypto = require('crypto');
    const authToken = crypto.randomBytes(32).toString('hex');
    redirectUrl.searchParams.set('token', authToken);

    // 7. Return success response with redirect URL
    const response = new NextResponse(
      JSON.stringify({ 
        success: true,
        redirectUrl: redirectUrl.toString(),
      }),
      { status: 200 }
    );

    // Set secure HTTP-only cookie
    response.cookies.set('auth_token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 5, // 5 minutes
      path: '/',
    });

    return response;

  } catch (error) {
    // 8. Error Handling
    console.error('Captcha verification error:', error);

    if (error.name === 'AbortError') {
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          message: 'Verification timeout. Please try again.' 
        }),
        { status: 504 }
      );
    }

    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        message: 'Internal server error' 
      }),
      { status: 500 }
    );
  }
}
