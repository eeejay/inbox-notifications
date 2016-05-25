const pageMod = require("sdk/page-mod");
const self = require("sdk/self");
const { TitleMutator } = require("./title-mutator");
const { MessageFetcher } = require("./message-fetcher");
const notifications = require("sdk/notifications");
const { getFavicon } = require("sdk/places/favicon");
const _ = require("sdk/l10n").get;

function hasFocus(worker) {
  return new Promise(resolve => {
    worker.port.once('focus', resolve);
    worker.port.emit('has-focus');
  });
}

function notify(tab, faviconPromise, messages) {
  if (messages.length) {
    let notification = {};

    if (messages.length == 1) {
      notification = {
        title: _("new_message", messages[0].sender_name),
        text: messages[0].subject
      };
    } else {
      let senders = new Set(messages.map(e => e.sender_name));
      notification = {
        title: _("new_messages", messages.length),
        text: Array.from(senders).join(', ')
      };
    }

    faviconPromise.then(faviconUrl => {
      notifications.notify({
        title: notification.title,
        text: notification.text,
        iconURL: faviconUrl,
        onClick: () => {
          tab.window.activate();
          tab.activate();
        }
      });
    });
  }
}

pageMod.PageMod({
  include: ["http://inbox.google.com/*", "https://inbox.google.com/*"],
  contentScriptFile: self.data.url("content.js"),
  attachTo: ["existing", "top"],
  onAttach: function(worker) {
    console.debug("Attached");

    let titleMutator = new TitleMutator(worker.tab);
    let messageFetcher = new MessageFetcher(worker.tab);
    let faviconPromise = getFavicon(worker.tab);

    messageFetcher.refresh().then(info => {
      titleMutator.unreadCount = info.unread;
    });

    worker.on('detach', () => {
      titleMutator.disconnect();
      titleMutator = null;
      messageFetcher = null;
    });

    worker.port.on("refresh-feed", () => {
      messageFetcher.refresh().then(info => {
        titleMutator.unreadCount = info.unread;
        hasFocus(worker).then(focused => {
          if (!focused) {
            notify(worker.tab, faviconPromise, info.newMessages);
          } else {
            console.debug("inbox has focus, not notifying");
          }
        });
      }).catch(err => console.warn(err));
    });
  }
});
