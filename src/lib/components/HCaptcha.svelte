<script>
  import { onMount, createEventDispatcher } from 'svelte';
  export let sitekey;
  let captchaContainer;
  let widgetId;
  const dispatch = createEventDispatcher();

  function handleSuccess(token) {
    dispatch('success', { token });
  }

  function renderCaptcha() {
    if (window.hcaptcha) {
      widgetId = window.hcaptcha.render(captchaContainer, {
        sitekey,
        callback: handleSuccess,
      });
    }
  }

  onMount(() => {
    if (!window.hcaptcha) {
      const script = document.createElement('script');
      script.src = 'https://js.hcaptcha.com/1/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = renderCaptcha;
      document.body.appendChild(script);
    } else {
      renderCaptcha();
    }
  });
</script>

<div bind:this={captchaContainer}></div>
