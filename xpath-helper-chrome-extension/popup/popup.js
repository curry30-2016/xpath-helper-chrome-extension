// XPath Helper - Popup Script

document.addEventListener('DOMContentLoaded', () => {
  const toggleActive = document.getElementById('toggleActive');
  const xpathInput = document.getElementById('xpathInput');
  const btnCopyXPath = document.getElementById('btnCopyXPath');
  const btnRelative = document.getElementById('btnRelative');
  const btnAbsolute = document.getElementById('btnAbsolute');
  const matchCount = document.getElementById('matchCount');
  const results = document.getElementById('results');
  const extractedText = document.getElementById('extractedText');
  const btnCopyText = document.getElementById('btnCopyText');
  const toast = document.getElementById('toast');

  let currentAbsoluteXPath = '';
  let currentOptimizedXPath = '';
  let currentFormat = 'relative'; // 'relative' or 'absolute'

  // ========== Toast Notification ==========

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }

  // ========== Clipboard ==========

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('已复制到剪贴板');
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('已复制到剪贴板');
    }
  }

  // ========== State Management ==========

  // Load saved state
  chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
    if (response) {
      toggleActive.checked = response.isActive;
      if (response.lastXPath) {
        xpathInput.value = response.lastXPath;
        evaluateXPath(response.lastXPath);
      }
    }
  });

  // Toggle active state
  toggleActive.addEventListener('change', () => {
    const active = toggleActive.checked;
    chrome.runtime.sendMessage({ type: 'SET_ACTIVE', active });
  });

  // ========== XPath Input ==========

  // Debounce timer
  let debounceTimer = null;

  xpathInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      evaluateXPath(xpathInput.value);
    }, 300);
  });

  xpathInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      evaluateXPath(xpathInput.value);
    }
  });

  // ========== XPath Evaluation ==========

  async function evaluateXPath(xpath) {
    if (!xpath) {
      updateResults(0, []);
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;

      chrome.tabs.sendMessage(tab.id, {
        type: 'EVALUATE_XPATH',
        xpath
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError);
          return;
        }
        if (response) {
          updateResults(response.count, response.texts, response.error);
        }
      });
    } catch (err) {
      console.error('Error evaluating XPath:', err);
    }
  }

  function updateResults(count, texts, error) {
    matchCount.textContent = count;

    if (error) {
      results.innerHTML = `<div class="empty-state" style="color: #e74c3c;">${error}</div>`;
      extractedText.value = '';
      return;
    }

    if (count === 0) {
      results.innerHTML = '<div class="empty-state">无匹配结果</div>';
      extractedText.value = '';
      return;
    }

    // Update results list
    results.innerHTML = texts.map((text, i) => `
      <div class="result-item" data-index="${i}">
        <span class="result-index">${i + 1}</span>
        <span class="result-text">${escapeHtml(text)}</span>
      </div>
    `).join('');

    // Update extracted text
    extractedText.value = texts.join('\n');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ========== Format Toggle ==========

  btnRelative.addEventListener('click', () => {
    currentFormat = 'relative';
    btnRelative.classList.add('active');
    btnAbsolute.classList.remove('active');
    xpathInput.value = currentOptimizedXPath || xpathInput.value;
    evaluateXPath(xpathInput.value);
  });

  btnAbsolute.addEventListener('click', () => {
    currentFormat = 'absolute';
    btnAbsolute.classList.add('active');
    btnRelative.classList.remove('active');
    xpathInput.value = currentAbsoluteXPath || xpathInput.value;
    evaluateXPath(xpathInput.value);
  });

  // ========== Copy Buttons ==========

  btnCopyXPath.addEventListener('click', () => {
    if (xpathInput.value) {
      copyToClipboard(xpathInput.value);
    }
  });

  btnCopyText.addEventListener('click', () => {
    if (extractedText.value) {
      copyToClipboard(extractedText.value);
    }
  });

  // ========== Message Listener ==========

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'ELEMENT_SELECTED') {
      currentAbsoluteXPath = message.absoluteXPath;
      currentOptimizedXPath = message.optimizedXPath;

      // Update input based on current format
      xpathInput.value = currentFormat === 'relative' ? currentOptimizedXPath : currentAbsoluteXPath;

      // Evaluate and show results
      evaluateXPath(xpathInput.value);

      // Show element info
      showToast(`已选择: ${message.tagName}${message.id ? '#' + message.id : ''}`);
    }
  });

  // ========== Keyboard Shortcuts ==========

  document.addEventListener('keydown', (e) => {
    // Ctrl+C to copy XPath when input is focused
    if (e.ctrlKey && e.key === 'c' && document.activeElement === xpathInput) {
      // Let default copy behavior work
      return;
    }

    // Escape to clear
    if (e.key === 'Escape') {
      xpathInput.value = '';
      updateResults(0, []);
      chrome.runtime.sendMessage({ type: 'CLEAR_HIGHLIGHTS' });
    }
  });

});
