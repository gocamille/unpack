const API_URL = 'https://unpack-production.up.railway.app/simplify';

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'unpack-selection',
    title: 'Unpack this',
    contexts: ['selection']
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'unpack-selection') return;

  const selectedText = info.selectionText;
  if (!selectedText || selectedText.trim().length < 10) {
    // Inject first, then show error
    await injectContentScript(tab.id);
    chrome.tabs.sendMessage(tab.id, {
      type: 'UNPACK_ERROR',
      error: 'Please select more text to simplify.'
    });
    return;
  }

  // Inject content script and CSS programmatically (only runs once per tab)
  await injectContentScript(tab.id);

  // Tell content script to show loading state
  chrome.tabs.sendMessage(tab.id, { type: 'UNPACK_LOADING' });

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: selectedText })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    chrome.tabs.sendMessage(tab.id, {
      type: 'UNPACK_RESULT',
      original: selectedText,
      simplified: data.simplified
    });

  } catch (error) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'UNPACK_ERROR',
      error: 'Could not simplify text. Please try again.'
    });
  }
});

// Programmatic injection helper
async function injectContentScript(tabId) {
  try {
    // Inject CSS
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['styles/tooltip.css']
    });
    // Inject JS
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
  } catch (e) {
    // Script may already be injected, ignore errors
    console.log('Injection skipped or failed:', e.message);
  }
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SIMPLIFY_FROM_POPUP') {
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message.text })
    })
      .then(res => res.json())
      .then(data => sendResponse({ success: true, simplified: data.simplified }))
      .catch(err => sendResponse({ success: false, error: err.message }));

    return true; // Keep channel open for async response
  }
});