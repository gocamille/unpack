const API_URL = 'https://unpack-production.up.railway.app/simplify'

document.addEventListener('DOMContentLoaded', () => {
  const textInput = document.getElementById('text-input');
  const simplifyBtn = document.getElementById('simplify-btn');
  const resultContainer = document.getElementById('result-container');
  const resultText = document.getElementById('result-text');
  const errorContainer = document.getElementById('error-container');
  const loading = document.getElementById('loading');
  const copyBtn = document.getElementById('copy-btn');

  simplifyBtn.addEventListener('click', async () => {
    const text = textInput.value.trim();

    if (text.length < 10) {
      showError('Please enter at least 10 characters.');
      return;
    }

    // Reset state
    resultContainer.style.display = 'none';
    errorContainer.style.display = 'none';
    loading.style.display = 'flex';
    simplifyBtn.disabled = true;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Request failed');
      }

      const data = await response.json();
      showResult(data.simplified);

    } catch (error) {
      showError(error.message || 'Failed to simplify. Please try again.');
    } finally {
      loading.style.display = 'none';
      simplifyBtn.disabled = false;
    }
  });

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(resultText.textContent).then(() => {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
    });
  });

  function showResult(text) {
    resultText.textContent = text;
    resultContainer.style.display = 'block';
    errorContainer.style.display = 'none';
  }

  function showError(message) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    resultContainer.style.display = 'none';
  }
});