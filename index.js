const pageMod = require("sdk/page-mod");
const self = require("sdk/self");
const { XMLHttpRequest } = require("sdk/net/xhr");
var notifications = require("sdk/notifications");
let { getFavicon } = require("sdk/places/favicon");

function getMailFeed(accountId) {
  getFeed(accountId).then()
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

    xhr.open("GET", `https://mail.google.com/mail/u/${accountId}/feed/atom`, true);
    xhr.send();
  });
}

pageMod.PageMod({
  include: ["http://inbox.google.com/*", "https://inbox.google.com/*"],
  contentScriptFile: self.data.url("content.js"),
  attachTo: ["existing", "top"],
  onAttach: function(worker) {
    console.log("Attached");
    let faviconPromise = getFavicon(worker.tab);
    worker.port.on("getMailFeed", accountId => {
      getFeed(accountId).then(feed => {
        worker.port.emit("mailFeed", feed);
      }).catch(e => console.warn("error? " + e));
    });
    worker.port.on("notify", message => {
      faviconPromise.then(faviconUrl => {
        console.log("Notify:", JSON.stringify(message));
        let n =notifications.notify({
          title: message.title,
          text: message.body,
          iconURL: faviconUrl,
          onClick: () => {
            worker.tab.window.activate();
            worker.tab.activate();
          }
        });
      });
    });
  }
});
