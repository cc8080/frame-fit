
/**
 * Create context menu and handler for keyboard shortcut
 * Send message to run
 */

function styleAndRun(tab) {
    // Inject our styles and then run the script
    chrome.tabs.insertCSS(tab.id, {
      file: 'content.css',
      }, function() {
        chrome.tabs.executeScript(tab.id, {
          file: 'content.js',
          allFrames: true,
        }, function() {
          chrome.tabs.sendMessage(tab.id, { type: 'frame-fit-activate-tab' });
        })
    });
}

function onContextMenuClick(info, tab) {
  // Run when context menu clicked
  // N.B. we don't use the info
  styleAndRun(tab);
};

/**
 * Create a context menu. Match all allowed URLs so that can
 * work with iframes that have a "" src attribute.
 */
chrome.contextMenus.create({
  "title" : "Frame-Fit: adjust frame height",
  "type" : "normal",
  "contexts" : ["page", "frame"],
  "documentUrlPatterns": ["<all_urls>"],
  "onclick" : onContextMenuClick
});

/**
 * Listen for a keyboard shortcut to start
 */
chrome.commands.onCommand.addListener(function(command) {
  chrome.tabs.getSelected(function(tab) {
    // Run on current tab
    styleAndRun(tab);
  });
});