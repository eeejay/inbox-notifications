"use strict";

const { getBrowserForTab } = require("sdk/tabs/utils");
const { viewFor } = require("sdk/view/core");

class TitleMutator {
  constructor(tab) {
    this.tab = tab;

    this._unreadCount = 0;

    this.mutatePromises = [];

    this.tabActivated = this.tabActivated.bind(this);
    this.connect();
  }

  get unreadCount() {
    return this._unreadCount;
  }

  set unreadCount(unread) {
    console.debug("unreadCount set", unread);
    this._unreadCount = unread;
    this.mutateTitle();
  }

  tabActivated() {
    console.debug("wut!!", this.unreadCount);
    this.unreadCount = 0;
  }

  createMutatePromise() {
    return new Promise(resolve => {
      this.mutatePromises.push(resolve);
    });
  }

  handleEvent() {
    if (this.tab.title == this.newTitle) {
      this.mutatePromises.map(resolve => resolve(this.newTitle));
      this.mutatePromises = [];
      delete this.newTitle;
    } else {
      this.mutateTitle();
    }
  }

  connect() {
    let browser = getBrowserForTab(viewFor(this.tab));
    browser.addEventListener("DOMTitleChanged", this);
    this.tab.on("activate", this.tabActivated);
  }

  disconnect() {
    let browser = getBrowserForTab(viewFor(this.tab));
    browser.removeEventListener("DOMTitleChanged", this);
    this.tab.removeListener("activate", this.tabActivated);
  }

  mutateTitle() {
    let oldTitle = this.tab.title;
    let replaceString = (this.unreadCount == 0) ?
      "Inbox " : `Inbox (${this.unreadCount}) `;
    this.newTitle = oldTitle.replace(/^Inbox (\(\d+\)\s)?/, replaceString);
    console.debug("mutated:", oldTitle, "=>", this.newTitle);
    this.tab.attach({
      contentScript: `document.title = "${this.newTitle}";`,
    });
  }
}

exports.TitleMutator = TitleMutator;
