"use strict";

/* eslint-env browser */

self.port.on("change-title", newTitle => {
  if (newTitle != document.title) {
    document.title = newTitle;
  }
  self.port.emit("changed-title", document.title);
});
