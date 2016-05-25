"use strict";

const self = require("sdk/self");
const tabs = require("sdk/tabs");

let addListItem = (doc) => {
  let d = doc.createElement("div");
  d.textContent = "New message " + Date.now();
  d.setAttribute("role", "listitem");
  doc.getElementById("mainlist").appendChild(d);
};

function loadAndAttach(contentScriptFile, contentScript) {
  return new Promise(resolve => {
    tabs.on("load", tab => {
      resolve(tab.attach({
        contentScriptFile: contentScriptFile,
        contentScript: contentScript
      }));
    });
    tabs.open("http://localhost:1337/test/mock-inbox.html");
  });
}

function messagePromise(port, name) {
  return new Promise(resolve => {
    port.once(name, resolve);
  });
}

exports["test content mutation observer"] = function* (assert) {
  let worker = yield loadAndAttach(self.data.url("content.js"));
  let getMailFeed = messagePromise(worker.port, "refresh-feed");
  worker.tab.attach({ contentScript: `(${addListItem})(document)` });
  yield getMailFeed;
  worker.tab.close();
};

require("sdk/test").run(exports);
