/**
 * content.js
 *
 * If injected at the top level, this script will listen for a runtime message
 * telling it to activate. If injected into a frame, this script will listen for
 * a window message telling it to activate. The behavior differs depending on the
 * way the script is activated.
 *
 * When the top level script receives a message to activate, it will find all
 * frames in the document and post a message to their content windows in order
 * to activate the content scripts inside the frames.
 *
 * When activated by a window message, the content script will find all frames within
 * its own document and send them a message to activate. Once all inner frames
 * have been expanded, the content script will measure the height of its body and
 * post a window message to its parent with its size.
 *
 * The message sent to the top level script will look like
 *    { type: 'frame-fit-activate-tab' }
 *
 * The message sent to the child frames will look like
 *    { type: 'frame-fit-activate-frame', ref: <some number> }
 *
 * Child frames will respond with
 *    {
 *       type: 'frame-fit-child-response',
 *       ref: <ref from activate-frame>,
 *       width: <scroll width>
 *       height: <scroll height>
 *    }
 *
 * When the content script receives a frame-fit-child-response, it will
 * look up the frame element and resize it according to the response.
 *
 * A snackbar will briefly appear to show done or nothing found.
 *
 */

// Adjust height of divs containing iframes with body elements so don't
// have to do multiple levels of scrolling. Also shrinks divs that
// have extra space.

if (typeof window.frameFitInjected === 'undefined') {
  // Set a flag to ensure this is only done once
  window.frameFitInjected = true;
  const myLocation = document.location;

  const $ = document.querySelectorAll.bind(document);
  const bgBlue = 'rgba(173, 216, 230, 0.25)'; 
  const bgYellow = 'rgba(255, 255, 0, 0.25)';

  function askParentToResizeSelf() {
    // Pass back the body size to the parent
    const root = document.body;
    const height = root.scrollHeight;
    const width = root.scrollWidth;
    
    window.parent.postMessage({ 
      type: 'frame-fit-resize-frame',
      width,
      height
    }, '*');
  }
  
  function askForResizeIfNotTop() {
    // N.B. the top window is its own parent, skip it
    if (window.parent !== window) {
      console.log(`${myLocation}: This is a frame. Asking parent to resize us`);
      askParentToResizeSelf()
    } else {
      console.log(["askForResizeIfNotTop",window, window.parent, $]);
      snackTime("Frame fit done", 1300, bgBlue);
    }
  }

  function activate() {
    // Get all the iframes and send messages to activate them
    const frames = $('iframe');
    if (frames.length > 0) {
      for (let frame of frames) {
        frame.contentWindow.postMessage({ type: 'frame-fit-activate-frame' }, '*');
        console.log(`${myLocation}: Posted activate-frame`);
      }
    } else {
      // No frames, so at a leaf. Now we can get the resizing done
      askForResizeIfNotTop()
    }
  }

  function resizeFrame({ width, height }, source) {
    // The Work: calculate frame height plus some extra
    const frame = Array.from($('iframe')).find(
      (frame) => frame.contentWindow === source
    );
    if (frame) {
      console.log(`${myLocation}: Expand frame to ${width}x${height}: `, frame);
      frame.style.height = `${height+60}px`;
      // Adjust the parent element's height too, in case it's
      // constraining what is displayed
      frame.parentElement.style.height = frame.style.height;
    } 
    // Resized child frame so now we need to resize this one, too
    askForResizeIfNotTop();
  }

  function onWindowMessage({ data, source }) {
    // Process received messages
    switch (data.type) {
      case 'frame-fit-activate-frame':
        console.log(`${myLocation}: Message is activate-frame. Calling activate()...`);
        activate();
        break;
      case 'frame-fit-resize-frame':
        console.log(`${myLocation}: Message is resize-frame. Calling resizeFrame(...)...`);
        resizeFrame(data, source);
        break;
    }
  }

  // Add window message listener
  window.addEventListener('message', onWindowMessage);
  const snackDiv = document.createElement('div');
  snackDiv.id = "frame-fit-snackbar";
  document.body.appendChild(snackDiv);
  
  if (window.parent === window) {

    if ($('iframe').length == 0) {
      // No frames here, so nothing to do
      snackTime("Frame Fit found nothing to do. This message will not be repeated until the page is reloaded.", 5000, bgYellow);
      
    } else {
      // This is the top level. Add listener for chrome runtime message
      chrome.runtime.onMessage.addListener((message) => {
        // Received chrome runtime message
        if (message.type === 'frame-fit-activate-tab') {
          console.log(`${myLocation}: Message is frame-fit-activate-tab. Activating...`);
          activate();
        }
      });
    }
  }
  
  function snackTime(whadIDo, howLong, color) {
    howLong = ( howLong < 1000 ) ? 1000 : howLong; // minimum is 1 second
    const timeoutSecs = 1.0*howLong/1000; // get the decimal places
    
    snackDiv.innerHTML = whadIDo; // the message to show
    snackDiv.style.backgroundColor = color;
    
    // Add animation: Take 0.5 seconds to fade in and out the snackbar. 
    // However, delay the fade out process for x seconds
    snackDiv.style['-webkit-animation'] = 'fadein 0.5s, fadeout 0.5s ' + timeoutSecs + 's';
    snackDiv.style['animation'] = 'fadein 0.5s, fadeout 0.5s ' + timeoutSecs + 's';
    
    console.log(["snackTime",snackDiv, whadIDo, howLong, timeoutSecs]);
    
    // Add the "show" class to DIV
    snackDiv.className = "show";

    // After some seconds, remove the show class from DIV
    setTimeout(function(){ 
      snackDiv.className = snackDiv.className.replace("show", ""); }, howLong);
  }
}


