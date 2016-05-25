"use strict";

const { MessageFetcher } = require("../message-fetcher");

exports["test message fetcher"] = function* (assert) {
  let messageFetcher = new MessageFetcher();
  messageFetcher.testUrl = "http://localhost:1337/test/gmail_atom.xml";
  let info = yield messageFetcher.refresh();
  assert.ok(info.newMessages.length > 0, "Got new messages");
  info = yield messageFetcher.refresh();
  assert.ok(info.newMessages.length == 0, "No new messages");
  messageFetcher.testUrl = "http://localhost:1337/test/gmail_atom_newmail.xml";
  info = yield messageFetcher.refresh();
  assert.ok(info.newMessages.length == 1, "One new message!");
};

require("sdk/test").run(exports);
