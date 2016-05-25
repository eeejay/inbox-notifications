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
  let url = "http://localhost:1337/test/mock-inbox.html";
  return new Promise(resolve => {
    tabs.open(url);
    let onLoad = tab => {
      if (tab.url == url) {
        tabs.off("load", onLoad);
        resolve(tab.attach({
          contentScriptFile: contentScriptFile,
          contentScript: contentScript
        }));
      }
    };
    tabs.on("load", onLoad);
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
