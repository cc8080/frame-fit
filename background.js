
/**
 * Returns a handler which will execute the given script
 */
function onContextMenuClick(info, tab) {
  chrome.tabs.executeScript(tab.id, {
    file: 'content.js',
    allFrames: true,
  }, function() {
    chrome.tabs.sendMessage(tab.id, { type: 'frame-fit-activate-tab' });
  })
};

/**
 * Create a context menu 
 */
chrome.contextMenus.create({
  "title" : "Frame-Fit: adjust frame height",
  "type" : "normal",
  "contexts" : ["page", "frame"],
  "onclick" : onContextMenuClick
});
