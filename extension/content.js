// Tooltip element management
let tooltip = null;
let lastSelectionRect = null;

function createTooltip() {
  if (tooltip) return tooltip;

  tooltip = document.createElement('div');
  tooltip.id = 'unpack-tooltip';
  const iconUrl = chrome.runtime.getURL('icons/noun-box-open-7931605.svg');
  tooltip.innerHTML = `
    <div class="unpack-header">
      <span class="unpack-logo">
        <img src="${iconUrl}" class="unpack-logo-icon" alt="Unpack"> Unpack
      </span>
      <div class="unpack-actions" style="display: flex; gap: 4px; align-items: center;">
        <button class="unpack-font-btn" data-action="dec" aria-label="Decrease font">A-</button>
        <button class="unpack-font-btn" data-action="inc" aria-label="Increase font">A+</button>
        <div style="width: 1px; height: 16px; background: #e5e7eb; margin: 0 4px;"></div>
        <button class="unpack-close" aria-label="Close">×</button>
      </div>
    </div>
    <div class="unpack-content">
      <div class="unpack-loading" style="display: none;">
        <div class="unpack-spinner"></div>
        <span>Simplifying...</span>
      </div>
      <div class="unpack-result" style="display: none;"></div>
      <div class="unpack-error" style="display: none;"></div>
    </div>
    <div class="unpack-footer" style="display: none;">
      <button class="unpack-copy">Copy simplified text</button>
      <button class="unpack-toggle">Show original</button>
    </div>
  `;

  document.body.appendChild(tooltip);

  // Event listeners
  tooltip.querySelector('.unpack-close').addEventListener('click', hideTooltip);
  tooltip.querySelector('.unpack-copy').addEventListener('click', copyToClipboard);
  tooltip.querySelector('.unpack-toggle').addEventListener('click', toggleVersion);

  // Font listeners
  tooltip.querySelectorAll('.unpack-font-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const isInc = e.target.dataset.action === 'inc';
      adjustTooltipFont(isInc ? 1 : -1);
    });
  });

  // Close on click outside
  document.addEventListener('click', (e) => {
    if (tooltip && !tooltip.contains(e.target)) {
      hideTooltip();
    }
  });

  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideTooltip();
  });

  return tooltip;
}

let tooltipFontSize = 15;

function adjustTooltipFont(delta) {
  if (!tooltip) return;
  const newSize = tooltipFontSize + delta;
  if (newSize >= 12 && newSize <= 28) {
    tooltipFontSize = newSize;
    const resultEl = tooltip.querySelector('.unpack-result');
    if (resultEl) resultEl.style.setProperty('font-size', `${tooltipFontSize}px`, 'important');
  }
}

function positionTooltip() {
  if (!tooltip || !lastSelectionRect) return;

  const rect = lastSelectionRect;
  const tooltipRect = tooltip.getBoundingClientRect();

  // Position below selection, centered
  let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
  let top = rect.bottom + 10 + window.scrollY;

  // Keep within viewport
  left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10));

  // If would go below viewport, show above selection
  if (top + tooltipRect.height > window.innerHeight + window.scrollY) {
    top = rect.top - tooltipRect.height - 10 + window.scrollY;
  }

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function showLoading() {
  const tip = createTooltip();

  // Capture selection position before it disappears
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    lastSelectionRect = selection.getRangeAt(0).getBoundingClientRect();
  }

  tip.querySelector('.unpack-loading').style.display = 'flex';
  tip.querySelector('.unpack-result').style.display = 'none';
  tip.querySelector('.unpack-error').style.display = 'none';
  tip.querySelector('.unpack-footer').style.display = 'none';

  tip.classList.add('unpack-visible');
  positionTooltip();
}

function showResult(original, simplified) {
  const tip = createTooltip();

  tip.dataset.original = original;
  tip.dataset.simplified = simplified;
  tip.dataset.showing = 'simplified';

  tip.querySelector('.unpack-loading').style.display = 'none';
  tip.querySelector('.unpack-error').style.display = 'none';

  const resultEl = tip.querySelector('.unpack-result');
  resultEl.textContent = simplified;
  resultEl.style.display = 'block';
  // Ensure font size is applied
  resultEl.style.setProperty('font-size', `${tooltipFontSize}px`, 'important');

  tip.querySelector('.unpack-footer').style.display = 'flex';
  tip.querySelector('.unpack-toggle').textContent = 'Show original';

  positionTooltip();
}

function showError(message) {
  const tip = createTooltip();

  tip.querySelector('.unpack-loading').style.display = 'none';
  tip.querySelector('.unpack-result').style.display = 'none';
  tip.querySelector('.unpack-footer').style.display = 'none';

  const errorEl = tip.querySelector('.unpack-error');
  errorEl.textContent = message;
  errorEl.style.display = 'block';

  tip.classList.add('unpack-visible');
  positionTooltip();
}

function hideTooltip() {
  if (tooltip) {
    tooltip.classList.remove('unpack-visible');
  }
}

function copyToClipboard() {
  const text = tooltip.dataset.showing === 'simplified'
    ? tooltip.dataset.simplified
    : tooltip.dataset.original;

  navigator.clipboard.writeText(text).then(() => {
    const btn = tooltip.querySelector('.unpack-copy');
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy simplified text'; }, 2000);
  });
}

function toggleVersion() {
  const resultEl = tooltip.querySelector('.unpack-result');
  const toggleBtn = tooltip.querySelector('.unpack-toggle');
  const copyBtn = tooltip.querySelector('.unpack-copy');

  if (tooltip.dataset.showing === 'simplified') {
    resultEl.textContent = tooltip.dataset.original;
    toggleBtn.textContent = 'Show simplified';
    copyBtn.textContent = 'Copy original text';
    tooltip.dataset.showing = 'original';
  } else {
    resultEl.textContent = tooltip.dataset.simplified;
    toggleBtn.textContent = 'Show original';
    copyBtn.textContent = 'Copy simplified text';
    tooltip.dataset.showing = 'simplified';
  }
}

// Message listener from background script
chrome.runtime.onMessage.addListener((message) => {
  switch (message.type) {
    case 'UNPACK_LOADING':
      showLoading();
      break;
    case 'UNPACK_RESULT':
      showResult(message.original, message.simplified);
      break;
    case 'UNPACK_ERROR':
      showError(message.error);
      break;
  }
});