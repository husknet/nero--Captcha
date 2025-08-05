<script>
  import HCaptcha from '$lib/components/HCaptcha.svelte';
  import { env } from '$env/dynamic/public';
  let error = '';
  let loading = false;

  async function onSuccess(event) {
    loading = true;
    error = '';
    const token = event.detail.token;
    try {
      const res = await fetch('/api/verify-hcaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = env.SUCCESS_REDIRECT_URL || '/';
      } else {
        error = 'Captcha verification failed. Please try again.';
      }
    } catch (e) {
      error = 'Network error. Try again.';
    }
    loading = false;
  }
</script>

<style>
  .captcha { margin: 2rem 0; }
  .error { color: red; }
</style>

<main>
  <h1>hCaptcha Verification</h1>
  <div class="captcha">
    <HCaptcha sitekey={env.VITE_HCAPTCHA_SITE_KEY} on:success={onSuccess} />
  </div>
  {#if loading}
    <p>Verifying...</p>
  {/if}
  {#if error}
    <p class="error">{error}</p>
  {/if}
</main>
