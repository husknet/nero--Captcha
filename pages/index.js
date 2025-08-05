import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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

      const data = await response.json();
      
      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setError(data.message || 'Verification failed. Please try again.');
        // Reset hCaptcha to allow retry
        if (window.hcaptcha) {
          window.hcaptcha.reset();
        }
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('An error occurred during verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only load script if not already loaded
    if (window.hcaptcha) return;

    const script = document.createElement('script');
    script.src = 'https://js.hcaptcha.com/1/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.hcaptcha.render('hcaptcha-container', {
        sitekey: process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY,
        callback: handleVerification
      });
    };
    script.onerror = () => {
      setError('Failed to load hCaptcha. Please refresh the page.');
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="container">
      <Head>
        <title>hCaptcha Verification</title>
      </Head>

      <main>
        <h1>hCaptcha Verification</h1>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <div id="hcaptcha-container"></div>
        
        {isLoading && (
          <div className="loading-indicator">
            Verifying...
          </div>
        )}
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
        }
        .loading-indicator {
          color: #666;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
