import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use NEXT_PUBLIC_... for frontend env variables (Next.js exposes them)
  const sitekey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
  const redirectUrl = process.env.NEXT_PUBLIC_SUCCESS_REDIRECT_URL || '/dashboard'; // fallback

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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Server responded with ${response.status}`
        );
      }

      const data = await response.json();
      if (data.success) {
        window.location.href = redirectUrl; // Always redirect to env-based URL
      } else {
        setError(data.message || 'Verification failed. Please try again.');
        resetCaptcha();
      }
    } catch (err) {
      setError(
        err.message.includes('405')
          ? 'Server configuration error. Please contact support.'
          : 'An error occurred during verification. Please try again.'
      );
      resetCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  const resetCaptcha = () => {
    if (window.hcaptcha) {
      try {
        window.hcaptcha.reset();
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    if (window.hcaptcha) return;

    const script = document.createElement('script');
    script.src = 'https://js.hcaptcha.com/1/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      try {
        window.hcaptcha.render('hcaptcha-container', {
          sitekey,
          callback: handleVerification,
          'error-callback': () => {
            setError('Captcha error occurred. Please try again.');
          },
        });
      } catch {
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
      } catch {}
    };
    // eslint-disable-next-line
  }, [sitekey]);

  return (
    <div className="container">
      <Head>
        <title>hCaptcha Verification</title>
      </Head>
      <main>
        <h1>hCaptcha Verification</h1>
        {error && <div className="error-message">{error}</div>}
        <div id="hcaptcha-container"></div>
        {isLoading && <div className="loading-indicator">Verifying...</div>}
      </main>
      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 2rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 1rem;
        }
        .error-message {
          color: #ff3333;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          background-color: #ffeeee;
          text-align: center;
          max-width: 400px;
        }
        .loading-indicator {
          color: #666;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
