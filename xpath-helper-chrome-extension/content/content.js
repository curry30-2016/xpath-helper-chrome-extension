// XPath Helper - Content Script

(function() {
  'use strict';

  let isActive = false;
  let hoveredElement = null;
  let tooltip = null;

  // ========== XPath Generation ==========

  // Get absolute XPath (full path from root)
  function getAbsoluteXPath(element) {
    if (!element) return '';

    const parts = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let index = 1;
      let sibling = current.previousSibling;

      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === current.nodeName) {
          index++;
        }
        sibling = sibling.previousSibling;
      }

      const tagName = current.nodeName.toLowerCase();
      parts.unshift(`${tagName}[${index}]`);
      current = current.parentNode;
    }

    return '/' + parts.join('/');
  }

  // Get optimized relative XPath
  function getOptimizedXPath(element) {
    if (!element) return '';

    // Try using ID first
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }

    // Try using unique class combination
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.trim().split(/\s+/).filter(c => c);
      if (classes.length > 0) {
        const classXPath = `//${element.tagName.toLowerCase()}[${classes.map(c => `contains(@class,"${c}")`).join(' and ')}]`;
        try {
          const result = document.evaluate(classXPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
          if (result.snapshotLength === 1) {
            return classXPath;
          }
        } catch (e) {}
      }
    }

    // Try using text content for links and buttons
    const tagName = element.tagName.toLowerCase();
    if (['a', 'button', 'span', 'label'].includes(tagName)) {
      const text = element.textContent.trim().substring(0, 50);
      if (text) {
        const textXPath = `//${tagName}[contains(text(),"${text.replace(/"/g, '\\"')}")]`;
        try {
          const result = document.evaluate(textXPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
          if (result.snapshotLength === 1) {
            return textXPath;
          }
        } catch (e) {}
      }
    }

    // Try using name attribute
    if (element.name) {
      const nameXPath = `//${tagName}[@name="${element.name}"]`;
      try {
        const result = document.evaluate(nameXPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        if (result.snapshotLength === 1) {
          return nameXPath;
        }
      } catch (e) {}
    }

    // Try using href/src attributes
    if (element.href) {
      const hrefXPath = `//${tagName}[starts-with(@href,"${element.href.substring(0, 30)}")]`;
      try {
        const result = document.evaluate(hrefXPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        if (result.snapshotLength === 1) {
          return hrefXPath;
        }
      } catch (e) {}
    }

    // Fallback to absolute path
    return getAbsoluteXPath(element);
  }

  // ========== Highlighting ==========

  function highlightElement(element) {
    if (!element) return;
    element.classList.add('xpath-helper-highlight');

    // Add tooltip
    const tagName = element.tagName.toLowerCase();
    let tooltipText = tagName;
    if (element.id) tooltipText += `#${element.id}`;
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.trim().split(/\s+/).slice(0, 2).join('.');
      if (classes) tooltipText += `.${classes}`;
    }

    const tip = document.createElement('div');
    tip.className = 'xpath-helper-tooltip';
    tip.textContent = tooltipText;
    element.style.position = element.style.position || 'relative';
    element.appendChild(tip);
  }

  function highlightMatches(xpath) {
    // Clear previous highlights
    clearHighlights();

    if (!xpath) return { count: 0, texts: [] };

    try {
      const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      const count = result.snapshotLength;
      const texts = [];

      for (let i = 0; i < result.snapshotLength; i++) {
        const node = result.snapshotItem(i);
        if (node.nodeType === Node.ELEMENT_NODE) {
          node.classList.add('xpath-helper-highlight', 'xpath-helper-match');
          texts.push(node.textContent.trim().substring(0, 200));
        } else if (node.nodeType === Node.TEXT_NODE) {
          texts.push(node.textContent.trim().substring(0, 200));
        }
      }

      return { count, texts };
    } catch (e) {
      return { count: 0, texts: [], error: e.message };
    }
  }

  function clearHighlights() {
    document.querySelectorAll('.xpath-helper-highlight').forEach(el => {
      el.classList.remove('xpath-helper-highlight', 'xpath-helper-match');
    });
    document.querySelectorAll('.xpath-helper-tooltip').forEach(el => el.remove());
  }

  // ========== Event Handlers ==========

  function handleMouseOver(e) {
    if (!isActive) return;

    const target = e.target;
    if (target === hoveredElement || target.classList.contains('xpath-helper-tooltip')) return;

    // Remove previous highlight
    if (hoveredElement) {
      hoveredElement.classList.remove('xpath-helper-highlight');
      const oldTooltip = hoveredElement.querySelector('.xpath-helper-tooltip');
      if (oldTooltip) oldTooltip.remove();
    }

    hoveredElement = target;
    highlightElement(target);
  }

  function handleClick(e) {
    if (!isActive) return;
    if (!e.shiftKey) return;

    e.preventDefault();
    e.stopPropagation();

    const target = e.target;
    const absoluteXPath = getAbsoluteXPath(target);
    const optimizedXPath = getOptimizedXPath(target);

    // Send to background/popup
    chrome.runtime.sendMessage({
      type: 'ELEMENT_SELECTED',
      absoluteXPath,
      optimizedXPath,
      tagName: target.tagName.toLowerCase(),
      id: target.id || '',
      className: target.className || ''
    });

    // Highlight the selected element
    clearHighlights();
    highlightElement(target);
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape' && isActive) {
      deactivate();
    }
  }

  // ========== Activation ==========

  function activate() {
    isActive = true;
    document.body.classList.add('xpath-helper-active');
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown);
  }

  function deactivate() {
    isActive = false;
    document.body.classList.remove('xpath-helper-active');
    document.removeEventListener('mouseover', handleMouseOver);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('keydown', handleKeyDown);
    clearHighlights();
    hoveredElement = null;
  }

  // ========== Message Handling ==========

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'TOGGLE_ACTIVE':
        if (message.active) {
          activate();
        } else {
          deactivate();
        }
        sendResponse({ success: true });
        break;

      case 'EVALUATE_XPATH':
        const result = highlightMatches(message.xpath);
        sendResponse(result);
        break;

      case 'CLEAR_HIGHLIGHTS':
        clearHighlights();
        sendResponse({ success: true });
        break;

      case 'GET_ELEMENT_AT_POINT':
        const element = document.elementFromPoint(message.x, message.y);
        if (element) {
          sendResponse({
            xpath: getOptimizedXPath(element),
            absoluteXPath: getAbsoluteXPath(element),
            tagName: element.tagName.toLowerCase()
          });
        } else {
          sendResponse(null);
        }
        break;

      default:
        sendResponse({ error: 'Unknown message type' });
    }
    return true;
  });

  // Listen for keyboard shortcut from background
  chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
    if (response && response.isActive) {
      activate();
    }
  });

})();
