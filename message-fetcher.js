const { XMLHttpRequest } = require("sdk/net/xhr");

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

class MessageFetcher {
  constructor(tab) {
    this.tab = tab;
    this.seenMessages = new Set();
  }

  getFeed() {
    let accountId = 0;
    if (this.tab) {
      let match = this.tab.url.match(/\/u\/(\d+)\//);
      if (match) {
        accountId = match[1];
      }
    }

    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      xhr.onload = function() {
        resolve(xhr.responseXML);
      }

      xhr.onerror = function() {
        reject("Error while getting XML.");
      }

      let url =
       this.testUrl || `https://mail.google.com/mail/u/${accountId}/feed/atom`;

      xhr.responseType = "document";
      xhr.open("GET", url, true);
      xhr.send();
    });
  }

  refresh() {
    console.debug("refreshing");
    return this.getFeed().then(feed => {
      console.debug("got feed");
      let unread = feed.querySelector("fullcount").textContent;
      let newMessages = [];
      for (let entry of feed.querySelectorAll("entry")) {
        let message = new Message(entry);
        if (!this.seenMessages.has(message.id)) {
          newMessages.push(message);
        }
        this.seenMessages.add(message.id);
      }

      this.firstRun = false;

      console.debug(
        "Unread:", unread,
        "New:", newMessages.length,
        "Cached:", this.seenMessages.size);

      return { unread: unread, newMessages: newMessages };
    });
  }
}

exports.MessageFetcher = MessageFetcher;