
/**
 * Returns a handler which will execute the given script
 */
function onContextMenuClick(info, tab) {
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
