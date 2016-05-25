"use strict";

/* eslint-env browser */

console.debug("content.js attached");

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

let mainContainer = document.querySelector('[role="main"]');

if (mainContainer) {
  observer.observe(mainContainer,
    { characterData: true, subtree: true, childList: true });
} else {
  console.warn("no main container found");
}

self.port.on("has-focus", () => {
  self.port.emit("focus", document.hasFocus());
});
