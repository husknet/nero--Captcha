<script>
  import { onMount } from "svelte";
  const SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY;

  let captchaToken = "";
  let errorMsg = "";
  let loading = false;
  let captchaContainer;
  let redirectUrl = "";

  async function fetchRedirectUrl() {
    const res = await fetch("/api/env");
    const data = await res.json();
    redirectUrl = data.redirectUrl;
  }

  async function verifyCaptcha(token) {
    loading = true;
    errorMsg = "";
    try {
      const res = await fetch("/api/verify-hcaptcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (data.success && redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        errorMsg = "Captcha failed, try again.";
        reloadCaptcha();
      }
    } catch (e) {
      errorMsg = "Error verifying captcha.";
      reloadCaptcha();
    }
    loading = false;
  }

  function handleCaptchaSuccess(token) {
    captchaToken = token;
    verifyCaptcha(token);
  }

  function reloadCaptcha() {
    if (window.hcaptcha && captchaContainer) {
      window.hcaptcha.reset();
    }
  }

  function renderCaptcha() {
    if (window.hcaptcha && captchaContainer) {
      window.hcaptcha.render(captchaContainer, {
        sitekey: SITE_KEY,
        callback: handleCaptchaSuccess,
        "error-callback": reloadCaptcha,
        "expired-callback": reloadCaptcha,
      });
    }
  }

  onMount(() => {
    fetchRedirectUrl();
    if (!window.hcaptcha) {
      const script = document.createElement("script");
      script.src = "https://js.hcaptcha.com/1/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = renderCaptcha;
      document.body.appendChild(script);
    } else {
      renderCaptcha();
    }
  });
</script>

<svelte:head>
  <title>Captcha Required</title>
</svelte:head>

<div class="container">
  <h2>Are you a human?</h2>
  <p>Please complete the captcha below to continue.</p>
  <div bind:this={captchaContainer} class="captcha-widget"></div>
  {#if errorMsg}
    <div class="error">{errorMsg}</div>
  {/if}
  {#if loading}
    <div class="loading">Verifying...</div>
  {/if}
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
  .error {
    color: #e11d48;
    margin-top: 1rem;
  }
  .loading {
    color: #0369a1;
    margin-top: 1rem;
  }
</style>
