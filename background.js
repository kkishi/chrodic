var pending = [];
var db;

function openDatabase() {
  console.log('openDatabase');
  indexedDB.open("dict", 1).onsuccess = function(e) {
    db = e.target.result;
    for (var i = 0; i < pending.length; ++i) {
      pending[i]();
    }
    pending = [];
  };
}

function closeDatabase() {
  console.log('closeDatabase');
  if (db == null) {
    return;
  }
  db.close();
  db = null;
}

function addToAnki(entry, callback) {
  var ankiweb = 'http://ankiweb.net/edit/';
  var message = {entry: entry,
                 config: {noteType: localStorage['note_type'],
                          deck: localStorage['deck']}};
  chrome.tabs.create({url: ankiweb, active: false}, function(tab) {
    chrome.tabs.executeScript(tab.id, {file: 'ankiweb.js'}, function(result) {
      chrome.tabs.sendMessage(tab.id, message, function() {
        chrome.tabs.remove(tab.id, function() {
          callback();
        });
      });
    });
  });
}

function respond(word, callback) {
  // Lookup the requested word from DB.
  var trans = db.transaction(["word"], "readonly");
  var index = trans.objectStore("word").index('key');
  index.count(word).onsuccess = function(e) {
    var count = e.target.result;
    if (count == 0) {
      callback([]);
      return;
    }
    var results = [];
    index.openCursor(word).onsuccess = function(e) {
      var cursor = e.target.result;
      results.push(cursor.value);
      if (results.length == count) {
        callback(results);
        return;
      }
      cursor.continue();
    };
  };
}

function onMessage(request, sender, callback) {
  switch (request.action) {
  case 'translateWord':
    if (db == null) {
      pending.push(function() { respond(request.word, callback); });
    } else {
      respond(request.word, callback);
    }
    return true;
  case 'beginDatabaseUpdate':
    closeDatabase();
    callback();
    break;
  case 'endDatabaseUpdate':
    openDatabase();
    callback();
    break;
  case 'addToAnki':
    addToAnki(request.entry, callback);
    return true;
  }
  return false;
}

chrome.runtime.onMessage.addListener(onMessage);

// Open DB.
openDatabase();
