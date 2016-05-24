const self = require("sdk/self");
const tabs = require("sdk/tabs");
const { XMLHttpRequest } = require("sdk/net/xhr");
const { setInterval, clearInterval } = require("sdk/timers");

let addListItem = (doc) => {
  var d = doc.createElement("div");
  d.textContent = "New message " + Date.now();
  d.setAttribute("role", "listitem");
  doc.getElementById("mainlist").appendChild(d);
}

function getFeed(accountId) {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    xhr.onload = function() {
      resolve(xhr.responseText);
    }

    xhr.onerror = function() {
      reject("Error while getting XML.");
    }

    xhr.documentType = "xml";
    xhr.open("GET", "http://localhost:1337/test/gmail_atom.xml", true);
    xhr.send();
  });
}

function loadAndAttach(scripts) {
  return new Promise(resolve => {
    tabs.on('load', tab => {
      resolve(tab.attach({ contentScriptFile: scripts }));
    });
    tabs.open("http://localhost:1337/test/mock-inbox.html");
  });
}

exports["test fetch on mutate"] = function(assert, done) {
  loadAndAttach(self.data.url("content.js")).then(worker => {
    worker.port.once("getMailFeed", accountId => {
      assert.pass('getting feed!!');
      getFeed(accountId).then(feed => {
        let oldTitle = worker.tab.title;
        assert.pass('sending feed!!');
        worker.port.once("title-changed", msg => {
          console.log("title changed!", JSON.stringify(msg));
          assert.pass('title changed!!');
          worker.tab.close();
          done();
        })

        worker.port.emit("mailFeed", feed);
      });
    });

    worker.tab.attach({ contentScript: `(${addListItem})(document)` });
  });
};

require("sdk/test").run(exports);
