"use strict";

console.log("content.js attached");

class Message {
  constructor(entry) {
    this.entry = entry;
  }

  get id() {
    return this.entry.querySelector("id").textContent;
  }

  get subject() {
   return this.entry.querySelector("title").textContent;
  }

  get summary() {
    return this.entry.querySelector("summary").textContent;
  }

  get sender_name() {
   return this.entry.querySelector("author > name").textContent;
  }

  get sender_email() {
   return this.entry.querySelector("author > email").textContent;
  }

  toString() {
    return `[Message: "${this.subject}" From: ${this.sender_name} <${this.sender_email}>]`;
  }
}

class TitleMutator {
  constructor() {
    this.titleElem = document.getElementsByTagName('title')[0];
    this.origTitle = this.titleElem.textContent;
    this.unreadCount = 0;

    this.mutateTitle();
    this.observe();
  }

  get unreadCount() {
    return this._unreadCount;
  }

  set unreadCount(unread) {
    this._unreadCount = unread;
    this.mutateTitle();
  }

  get observer() {
    if (!this._observer) {
      this._observer = new MutationObserver(() => {
        this.origTitle = this.titleElem.textContent;
        this.mutateTitle();
      });
    }

    return this._observer;
  }

  observe() {
    this.observer.observe(this.titleElem, { characterData: true });
  }

  unobserve() {
    this.observer.disconnect();
  }

  mutateTitle() {
    this.unobserve();
    this.titleElem.textContent = (this.unreadCount == 0) ?
      this.origTitle :
      this.origTitle.replace(/^Inbox/, `Inbox (${this.unreadCount})`);
    this.observe();
  }
}

class MessageFetcher {
  constructor() {
    this.seenMessages = new Set();
    this.titleMutator = new TitleMutator();
    this.mainList = document.querySelector('[role="main"]');
    this.firstRun = true;
    this.mainList.addEventListener("click", e => {
      if (e.target.closest('[role="application"]')) {
        // Potentially marked an item read.
        setTimeout(() => this.refresh(), 3000);
      }
    })
  }

  getFeed() {
    return new Promise(resolve => {
      self.port.once("mailFeed", response => {
        let parser = new DOMParser();
        resolve(parser.parseFromString(response, "text/xml"));
      });
      let accountId = window.location.pathname.substr(3, 1) || 0;
      self.port.emit("getMailFeed", accountId);
    });
  }

  refresh() {
    console.log("refreshing");
    return this.getFeed().then(feed => {
      console.log("got feed");
      let unread = this.titleMutator.unreadCount = feed.querySelector("fullcount").textContent;
      let newMessages = [];
      for (let entry of feed.querySelectorAll("entry")) {
        let message = new Message(entry);
        if (!this.firstRun && !this.seenMessages.has(message.id)) {
          newMessages.push(message);
        }
        this.seenMessages.add(message.id);
      }

      this.firstRun = false;

      console.log(
        "Unread:", unread,
        "New:", newMessages.length,
        "Cached:", this.seenMessages.size);

      if (newMessages.length) {
        let notification = {};

        if (newMessages.length == 1) {
          notification = {
            title: `New Message from ${newMessages[0].sender_name}`,
            body: newMessages[0].subject
          };
        } else {
          let senders = new Set(newMessages.map(e => e.sender_name));
          notification = {
            title: `${newMessages.length} New Messages`,
            body: Array.from(senders).join(', ')
          };
        }
        if (!document.hasFocus()) {
          self.port.emit("notify", notification);
        } else {
          console.log("Focused, so not notifying:", JSON.stringify(notification));
        }
      }

      return { unread: unread, newMessages: newMessages };
    });
  }

  get observer() {
    if (!this._observer) {
      this._observer = new MutationObserver(mutations => {
        let listitemAdded = () => {
          for (let mutation of mutations) {
            if (mutation.type == "characterData") {
              if (!mutation.target.parentNode.closest('[contenteditable]')) {
                return true
              }
            }

            for (let node of mutation.addedNodes) {
              if (node.getAttribute('role') == 'listitem' ||
                  node.getAttribute('role') == 'list') {
                return true;
              }
            }
          }

          return false;
        };

        if (listitemAdded()) {
          console.log("list item added");
          this.refresh();
        }
      });
    }

    return this._observer;
  }

  connect() {
    // We can be more economical and listen for DOM mutations
    // setInterval(refreshMail, 5000);
    this.observer.observe(this.mainList,
      { characterData: true, subtree: true, childList: true });
  }

  disconnect() {
    this.observer.disconnect();
  }
}

const messageFetcher = new MessageFetcher();
messageFetcher.refresh();
messageFetcher.connect();