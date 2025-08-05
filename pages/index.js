import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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
      
      if (data.success) {
        setIsVerified(true);
        // Redirect on success if needed
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        }
      } else {
        setError(data.message || 'Verification failed');
      }
    } catch (err) {
      setError('An error occurred during verification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <Head>
        <title>hCaptcha Verification</title>
        <script src="https://js.hcaptcha.com/1/api.js" async defer></script>
      </Head>

      <main>
        <h1>hCaptcha Verification</h1>
        
        {isVerified ? (
          <div className="success">
            <p>✅ Successfully verified!</p>
          </div>
        ) : (
          <div className="verification">
            {error && <p className="error">{error}</p>}
            
            <form onSubmit={(e) => e.preventDefault()}>
              <div
                className="h-captcha"
                data-sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY}
                data-callback={handleVerification}
              ></div>
              
              {isLoading && <p>Verifying...</p>}
            </form>
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
          max-width: 800px;
          width: 100%;
        }
        
        .error {
          color: red;
          margin-bottom: 1rem;
        }
        
        .success {
          color: green;
          font-size: 1.5rem;
        }
      `}</style>
    </div>
  );
}
