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
 * it's own document and send them a message to activate. Once all inner frames
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
 */

// Adjust height of divs containing iframes with body elements so don't
// have to do multiple levels of scrolling. Also shrinks divs that
// have extra space.
console.log(`${document.location}: ENTER script body`);
if (typeof window.frameFitInjected === 'undefined') {
  window.frameFitInjected = true;
  const myLocation = document.location;

  const $ = document.querySelectorAll.bind(document);

  function askParentToResizeSelf() {
    const root = document.body;
    const height = root.scrollHeight;
    const width = root.scrollWidth;
    console.log(`${myLocation}: Posting resize-frame to parent. Resize to ${width}x${height}`);
    window.parent.postMessage({ 
      type: 'frame-fit-resize-frame',
      width,
      height
    }, '*');
    console.log(`${myLocation}: Finished posting resize-frame`);
  }
  
  function askForResizeIfNotTop() {
    if (window.parent === window) {
      console.log(`${myLocation}: This is the top level. No parent to ask to resize`);
    } else {
      console.log(`${myLocation}: This is a frame. Asking parent to resize us`);
      askParentToResizeSelf()
    }
  }

  function activate() {
    console.log(`${myLocation}: ENTER activate`);
    const frames = $('iframe');
    console.log(`${myLocation}: Found ${frames.length} frames`);
    if (frames.length > 0) {
      console.log(`${myLocation}: Posting messages to activate child frames...`);
      for (let frame of frames) {
        console.log(`${myLocation}: Posting activate-frame`);
        frame.contentWindow.postMessage({ type: 'frame-fit-activate-frame' }, '*');
        console.log(`${myLocation}: Posted activate-frame`);
      }
    } else {
      console.log(`${myLocation}: No child frames`);
      askForResizeIfNotTop()
    }
    console.log(`${myLocation}: EXIT activate`);
  }

  function resizeFrame({ width, height }, source) {
    console.log(`${myLocation}: ENTER resizeFrame`);
    const frame = Array.from($('iframe')).find(
      (frame) => frame.contentWindow === source
    );
    if (frame) {
      console.log(`${myLocation}: Expand frame to ${width}x${height}: `, frame);
      frame.style.height = `${height+60}px`;
      frame.parentElement.style.height = frame.style.height;
    } else {
      console.log(`${myLocation}: No frame found for source: `, source);
    }
    console.log(`${myLocation}: Resized child frame so now we need to resize too`);
    askForResizeIfNotTop();
    console.log(`${myLocation}: EXIT resizeFrame`);
  }

  function onWindowMessage({ data, source }) {
    console.log(`${myLocation}: ENTER onWindowMessage: `, data, 'from: ', source);
    switch (data.type) {
      case 'frame-fit-activate-frame':
        console.log(`${myLocation}: Message is activate-frame. Calling activate()...`);
        activate();
        console.log(`${myLocation}: done`);
        break;
      case 'frame-fit-resize-frame':
        console.log(`${myLocation}: Message is resize-frame. Calling resizeFrame(...)...`);
        resizeFrame(data, source);
        console.log(`${myLocation}: done`);
        break;
    }
    console.log(`${myLocation}: EXIT onWindowMessage`);
  }

  console.log(`${myLocation}: Adding window message listener`);
  window.addEventListener('message', onWindowMessage);

  if (window.parent === window) {
    console.log(`${myLocation}: This is the top level. Adding listener for chrome runtime message`);
    chrome.runtime.onMessage.addListener((message) => {
      console.log(`${myLocation}: Received chrome runtime message: `, message);
      if (message.type === 'frame-fit-activate-tab') {
        console.log(`${myLocation}: Message is frame-fit-activate-tab. Activating...`);
        activate();
        console.log(`${myLocation}: Activation complete`); 
      }
    });
  } else {
    console.log(`${myLocation}: This is a frame`);
  }

} else {
  console.log(`${document.location}: Already injected.`)
}
console.log(`${document.location}: EXIT script body`);

