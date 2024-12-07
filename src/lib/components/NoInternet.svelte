<script>
  export let startSlower = false;
</script>

<div class="no-internet-container">
  <div class="wire-broke">
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 12s2.545-5 7-5c4.454 0 7 5 7 5"/>
      <path d="M19 12l-2 2"/>
      <path d="M5 12l2 2"/>
      <path d="M3 3l18 18"/>
    </svg>
  </div>
  <h2>No internet</h2>
  <div class="suggestions">
    <p>Try:</p>
    <ul>
      <li>Checking the network cables, modem, and router</li>
      <li>Reconnecting to Wi-Fi</li>
    </ul>
  </div>
  <div class="error-code">ERR_INTERNET_DISCONNECTED</div>
  <div class="start-slower">
    <label class="switch">
      <span>Start slower</span>
      <input type="checkbox" bind:checked={startSlower}>
      <span class="slider"></span>
    </label>
  </div>
</div>

<style>
  .no-internet-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    width: 100vw;
    background-color: #202124;
    color: #bdc1c6;
    font-family: system-ui, -apple-system, sans-serif;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
  }

  .wire-broke {
    margin-bottom: 20px;
    color: #bdc1c6;
  }

  h2 {
    margin: 0 0 20px 0;
    font-weight: 500;
    font-size: 1.5rem;
  }

  .suggestions {
    text-align: center;
  }

  .suggestions p {
    margin: 0 0 10px 0;
  }

  .suggestions ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .suggestions li {
    margin: 8px 0;
  }

  .error-code {
    margin-top: 20px;
    color: #9aa0a6;
    font-size: 0.875rem;
  }

  .start-slower {
    margin-top: 30px;
  }

  .switch {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 20px;
    background-color: #3c4043;
    border-radius: 20px;
    transition: 0.4s;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 2px;
    bottom: 2px;
    background-color: #bdc1c6;
    border-radius: 50%;
    transition: 0.4s;
  }

  input:checked + .slider {
    background-color: #8ab4f8;
  }

  input:checked + .slider:before {
    transform: translateX(20px);
    background-color: #202124;
  }
</style> 