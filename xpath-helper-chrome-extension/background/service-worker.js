// XPath Helper - Background Service Worker

// Store the current state
let state = {
  isActive: false,
  lastXPath: '',
  matches: []
};

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_STATE':
      sendResponse(state);
      break;

    case 'SET_ACTIVE':
      state.isActive = message.active;
      // Notify content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'TOGGLE_ACTIVE',
            active: message.active
          });
        }
      });
      sendResponse({ success: true });
      break;

    case 'ELEMENT_SELECTED':
      state.lastXPath = message.xpath;
      sendResponse({ success: true });
      break;

    case 'XPATH_EVALUATED':
      state.matches = message.matches;
      sendResponse({ success: true });
      break;

    case 'CLEAR_HIGHLIGHTS':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'CLEAR_HIGHLIGHTS' });
        }
      });
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ error: 'Unknown message type' });
  }
  return true; // Keep the message channel open for async responses
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This is handled by the popup, but we can use it for keyboard shortcut
});
