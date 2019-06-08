
/**
 * Returns a handler which will execute the given script
 */
function getClickHandler() {
  return function(info, tab) {
     chrome.tabs.executeScript({
          file: 'content.js'
        });
  };
};

/**
 * Create a context menu 
 */
chrome.contextMenus.create({
  "title" : "Frame-X: adjust frame height",
  "type" : "normal",
  "contexts" : ["page", "frame"],
  "onclick" : getClickHandler()
});
