"use strict";

const { getBrowserForTab } = require("sdk/tabs/utils");
const { viewFor } = require("sdk/view/core");
const data = require("sdk/self").data;

function TitleMutator(tab) {
  this.tab = tab;
  this.worker = tab.attach({
    contentScriptFile: data.url("title-mutator-content.js")
  });

  this._unreadCount = 0;

  this.mutatePromises = [];

  this.tabActivated = this.tabActivated.bind(this);
  this.connect();
}

TitleMutator.prototype = {
  get unreadCount() {
    return this._unreadCount;
  },

  set unreadCount(unread) {
    console.debug("unreadCount set", unread);
    this._unreadCount = unread;
    this.mutateTitle();
  },

  tabActivated: function () {
    console.debug("wut!!", this.unreadCount);
    this.unreadCount = 0;
  },

  createMutatePromise: function () {
    return new Promise(resolve => {
      this.mutatePromises.push(resolve);
    });
  },

  resolveMutatePromises: function (title) {
    this.mutatePromises.map(resolve => resolve(this.tab.title));
    this.mutatePromises = [];
  },

  contentChangeTitle: function (title) {
    return new Promise(resolve => {
      this.worker.port.once("changed-title", resolve);
      this.worker.port.emit("change-title", title);
    });
  },

  handleEvent: function () {
    this.mutateTitle();
  },

  connect: function () {
    let browser = getBrowserForTab(viewFor(this.tab));
    browser.addEventListener("DOMTitleChanged", this);
    this.tab.on("activate", this.tabActivated);
  },

  disconnect: function () {
    let browser = getBrowserForTab(viewFor(this.tab));
    browser.removeEventListener("DOMTitleChanged", this);
    this.tab.removeListener("activate", this.tabActivated);
  },

  mutateTitle: function () {
    let oldTitle = this.tab.title;
    let replaceString = (this.unreadCount == 0) ?
      "Inbox " : `Inbox (${this.unreadCount}) `;
    let newTitle = oldTitle.replace(/^Inbox (\(\d+\)\s)?/, replaceString);
    console.debug("mutated:", oldTitle, "=>", newTitle);
    this.contentChangeTitle(newTitle).then(title => {
      this.resolveMutatePromises(title);
    });
  }
};

exports.TitleMutator = TitleMutator;
