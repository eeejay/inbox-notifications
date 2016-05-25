"use strict";

/* eslint-env browser */

self.port.on("change-title", newTitle => {
  document.title = newTitle;
});
