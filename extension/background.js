var pending = [];

// Open DB.
var db;
indexedDB.open("dict", 1).onsuccess = function(e) {
  db = e.target.result;
  for (var i = 0; i < pending.length; ++i) {
    pending[i]();
  }
  pending = [];
};

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
  if (request.action != 'translateWord') return false;
  if (db == null) {
    pending.push(function() { respond(request.word, callback); });
  } else {
    respond(request.word, callback);
  }
  return true;
}

chrome.runtime.onMessage.addListener(onMessage);
