"use strict";

/* eslint-env browser */

console.log("content.js attached");

let observer = new MutationObserver(mutations => {
  let listitemAdded = () => {
    for (let mutation of mutations) {
      if (mutation.type == "characterData") {
        if (!mutation.target.parentNode.closest("[contenteditable]")) {
          return true;
        }
      }

      for (let node of mutation.addedNodes) {
        if (node.getAttribute("role") == "listitem" ||
            node.getAttribute("role") == "list") {
          return true;
        }
      }
    }

    return false;
  };

  if (listitemAdded()) {
    console.log("list item added");
    self.port.emit("refresh-feed");
  }
});

observer.observe(document.querySelector('[role="main"]'),
      { characterData: true, subtree: true, childList: true });

self.port.on("has-focus", () => {
  self.port.emit("focus", document.hasFocus());
});
