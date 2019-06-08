// content script
// Adjust height of divs containing iframes with body elements so don't
// have to do multiple levels of scrolling. Also shrinks divs that
// have extra space.

function setHeight() {
  const frames = document.querySelectorAll("iframe");
  for (let f of frames) {
    console.log(["setHeight",f]);
    if (f.contentDocument) {
        const bods = f.contentDocument.querySelectorAll("body");
        const parent = f.parentElement;
        for (let b of bods) {
          // Add a little extra to the height to ensure avoid scroll
          // bars and make it easier to add text at the bottom of the area
          const newHeight = b.scrollHeight + b.scrollHeight*.1;
          const h = `${newHeight}px`;
          f.style.height = h;
          parent.style.height = h;
        }
    } else {
       console.log("Frame has no contentDocument!");
    }
  }
}

setHeight();
