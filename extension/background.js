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

function respond(word, callback) {
  // Lookup the requested word from DB.
  var trans = db.transaction(["word"], "readonly");
  trans.objectStore("word").openCursor(word).onsuccess = function(e) {
    var result = e.target.result;
    if (result) {
      callback(result.value.value);
    } else {
      callback(null);
    }
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
  }
  return false;
}

chrome.runtime.onMessage.addListener(onMessage);

// Open DB.
openDatabase();
