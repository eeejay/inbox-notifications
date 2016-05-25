"use strict";

const tabs = require("sdk/tabs");
const { TitleMutator } = require("../title-mutator");

function loadTab(url = "http://localhost:1337/test/mock-inbox.html") {
  return new Promise(resolve => {
    tabs.once("load", resolve);
    tabs.open(url);
  });
}

function activateTab(tab) {
  return new Promise(resolve => {
    tab.once("activate", resolve);
    tab.activate();
  });
}

exports["test title mutator"] = function* (assert) {
  let tab = yield loadTab();
  let titleMutator = new TitleMutator(tab);

  function changeTitle(title) {
    tab.attach({ contentScript: `document.title = "${title}";` });
  }

  let oldTitle = tab.title;
  let titleMutated = titleMutator.createMutatePromise();
  titleMutator.unreadCount = 2;
  let newTitle = yield titleMutated;
  assert.notEqual(newTitle, oldTitle, "title changed");
  assert.ok(newTitle.startsWith("Inbox (2)"),
    "title changed correctly: " + newTitle);
  assert.equal(newTitle, tab.title, "tab title is set 1");

  oldTitle = newTitle;
  titleMutated = titleMutator.createMutatePromise();
  changeTitle("New chat from blah!");
  newTitle = yield titleMutated;
  assert.notEqual(newTitle, oldTitle, "title changed");
  assert.equal(newTitle, "New chat from blah!", "title untouched");
  assert.equal(newTitle, tab.title, "tab title is set 2");

  oldTitle = newTitle;
  titleMutated = titleMutator.createMutatePromise();
  changeTitle("Inbox – foo@example.com");
  newTitle = yield titleMutated;
  assert.notEqual(newTitle, oldTitle, "title changed");
  assert.ok(newTitle.startsWith("Inbox (2)"),
    "title changed correctly: " + newTitle);
  assert.equal(newTitle, tab.title, "tab title is set 3");

  oldTitle = newTitle;
  let tab2 = yield loadTab("about:blank");
  assert.equal(oldTitle, tab.title, "the tab title didn't change");
  titleMutated = titleMutator.createMutatePromise();
  yield activateTab(tab);
  newTitle = yield titleMutated;
  assert.notEqual(oldTitle, newTitle, "title changed after tab activated");

  tab2.close();
  tab.close();
};

require("sdk/test").run(exports);
