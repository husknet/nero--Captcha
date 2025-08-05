<script>
  import { onMount } from "svelte";

  const SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY;
  const REDIRECT_URL = import.meta.env.VITE_SUCCESS_REDIRECT_URL;

  let captchaToken = "";
  let captchaContainer;

  function handleCaptchaSuccess(token) {
    captchaToken = token;
    // Redirect if solved
    if (captchaToken && REDIRECT_URL) {
      window.location.href = REDIRECT_URL;
    }
  }

  onMount(() => {
    if (!window.hcaptcha) {
      const script = document.createElement("script");
      script.src = "https://js.hcaptcha.com/1/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        renderCaptcha();
      };
      document.body.appendChild(script);
    } else {
      renderCaptcha();
    }
  });

  function renderCaptcha() {
    if (window.hcaptcha && captchaContainer) {
      window.hcaptcha.render(captchaContainer, {
        sitekey: SITE_KEY,
        callback: handleCaptchaSuccess,
        "error-callback": () => {
          captchaToken = "";
        },
        "expired-callback": () => {
          captchaToken = "";
        }
      });
    }
  }
</script>

<svelte:head>
  <title>Captcha Required</title>
</svelte:head>

<div class="container">
  <h2>Are you a human?</h2>
  <p>Please complete the captcha below to continue.</p>
  <div bind:this={captchaContainer} class="captcha-widget"></div>
</div>

<style>
  .container {
    max-width: 340px;
    margin: 120px auto;
    padding: 2rem;
    border-radius: 1rem;
    background: #f8fafc;
    box-shadow: 0 2px 12px rgba(0,0,0,0.07);
    text-align: center;
    font-family: system-ui, sans-serif;
  }
  .captcha-widget {
    margin-top: 1.5rem;
    display: flex;
    justify-content: center;
  }
</style>
