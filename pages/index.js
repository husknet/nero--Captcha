// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function CaptchaVerification() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isVerified, setIsVerified] = useState(false);

  const handleVerification = async (token) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      // Check if response failed
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Verification failed (Status: ${response.status})`
        );
      }

      const data = await response.json();
      
      if (data.success) {
        setIsVerified(true);
        // Redirect to the backend-provided URL
        window.location.href = data.redirectUrl;
      } else {
        throw new Error(data.message || 'Verification failed');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message);
      resetCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  const resetCaptcha = () => {
    if (window.hcaptcha) {
      try {
        window.hcaptcha.reset();
      } catch (err) {
        console.error('Failed to reset hCaptcha:', err);
      }
    }
  };

  useEffect(() => {
    // Only load script if not already loaded
    if (window.hcaptcha) return;

    const loadCaptcha = () => {
      const script = document.createElement('script');
      script.src = 'https://js.hcaptcha.com/1/api.js';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        try {
          window.hcaptcha.render('hcaptcha-container', {
            sitekey: process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY,
            callback: handleVerification,
            'error-callback': () => {
              setError('Captcha encountered an error. Please try again.');
            },
            'expired-callback': () => {
              setError('Captcha expired. Please verify again.');
            }
          });
        } catch (err) {
          console.error('hCaptcha render error:', err);
          setError('Failed to initialize captcha. Please refresh the page.');
        }
      };

      script.onerror = () => {
        setError('Failed to load captcha service. Please refresh the page.');
      };

      document.body.appendChild(script);

      return () => {
        try {
          document.body.removeChild(script);
        } catch (e) {
          console.error('Error removing script:', e);
        }
      };
    };

    loadCaptcha();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <Head>
        <title>Secure Verification | hCaptcha</title>
        <meta name="description" content="Complete the captcha to verify your identity" />
      </Head>

      <main className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          {isVerified ? 'Verification Complete!' : 'Verify You Are Human'}
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {!isVerified && (
          <>
            <div className="mb-4">
              <p className="text-gray-600 text-sm mb-4">
                Please complete the captcha to verify you're not a robot.
              </p>
              <div id="hcaptcha-container" className="flex justify-center"></div>
            </div>

            {isLoading && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                <p className="mt-2 text-gray-500">Verifying...</p>
              </div>
            )}
          </>
        )}

        {isVerified && (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-600">Verification successful! Redirecting...</p>
          </div>
        )}
      </main>

      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>Protected by hCaptcha and privacy-first security</p>
      </footer>
    </div>
  );
}
