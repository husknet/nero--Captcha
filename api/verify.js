// pages/api/verify.js

import { NextResponse } from 'next/server';
import rateLimit from '@/lib/rateLimit'; // Custom rate limiter
import { validateToken } from '@/lib/security'; // Token validation utils

// Initialize rate limiter (example configuration)
const limiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 500, // Max users per interval
});

export default async function handler(req) {
  try {
    // 1. Rate Limiting Check
    const ip = req.headers.get('x-forwarded-for') || req.ip;
    await limiter.check(res, 10, ip); // 10 requests per interval

    // 2. Method Validation
    if (req.method !== 'POST') {
      return NextResponse.json(
        { success: false, message: 'Method not allowed' },
        { status: 405, headers: { Allow: 'POST' } }
      );
    }

    // 3. Request Body Parsing
    const body = await req.json();
    const { token } = body;

    // 4. Input Validation
    if (!validateToken(token)) {
      return NextResponse.json(
        { success: false, message: 'Invalid token format' },
        { status: 400 }
      );
    }

    // 5. hCaptcha Verification
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const verificationResponse = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: process.env.HCAPTCHA_SECRET_KEY,
        response: token,
        sitekey: process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY,
        remoteip: ip,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // 6. Response Handling
    const verificationData = await verificationResponse.json();

    if (!verificationData.success) {
      const errorMap = {
        'missing-input-secret': 'Internal configuration error',
        'invalid-input-secret': 'Internal configuration error',
        'missing-input-response': 'Please complete the captcha',
        'invalid-input-response': 'Invalid captcha response',
        'bad-request': 'Invalid request to captcha service',
        'invalid-or-already-seen-response': 'Captcha already used',
        'sitekey-secret-mismatch': 'Configuration mismatch',
        'timeout-or-duplicate': 'Captcha verification timeout',
      };

      const errorCode = verificationData['error-codes']?.[0];
      const message = errorCode ? errorMap[errorCode] || 'Verification failed' : 'Verification failed';

      return NextResponse.json(
        {
          success: false,
          message,
          errorCode,
          retryable: !['missing-input-secret', 'invalid-input-secret'].includes(errorCode),
        },
        { status: 400 }
      );
    }

    // 7. Success Response
    const redirectUrl = new URL(
      process.env.SUCCESS_REDIRECT_URL || '/',
      process.env.BASE_URL
    );

    // Generate one-time token for additional security
    const crypto = require('crypto');
    const redirectToken = crypto.randomBytes(32).toString('hex');
    redirectUrl.searchParams.set('token', redirectToken);

    // Set secure cookie with verification token
    const response = NextResponse.json(
      {
        success: true,
        redirectUrl: redirectUrl.toString(),
      },
      { status: 200 }
    );

    response.cookies.set('verify_token', redirectToken, {
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

    if (error.name === 'RateLimitError') {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    if (error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, message: 'Verification timeout. Please try again.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Rate limiter configuration (would normally be in a separate file)
export const config = {
  runtime: 'edge', // Optional: Use Vercel Edge Runtime
  regions: ['iad1'], // Optional: Specify deployment region
};
