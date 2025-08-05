<script>
  import { onMount } from "svelte";
  let captchaContainer;
  let captchaToken = "";

  const SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY;
  const REDIRECT_URL = import.meta.env.SUCCESS_REDIRECT_URL || import.meta.env.VITE_SUCCESS_REDIRECT_URL || '/';

  function handleCaptchaSuccess(token) {
    captchaToken = token;
    if (captchaToken) {
      // Send to backend for server-side verification
      fetch('/api/verify-hcaptcha', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: captchaToken })
      })
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            window.location.href = REDIRECT_URL;
          } else {
            captchaToken = "";
            window.location.reload();
          }
        });
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
        "error-callback": () => { captchaToken = ""; },
        "expired-callback": () => { captchaToken = ""; }
      });
    }
  }
</script>

<div class="container">
  <h2>Are you a human?</h2>
  <p>Please complete the captcha below to continue.</p>
  <div bind:this={captchaContainer} class="captcha-widget"></div>
</div>
