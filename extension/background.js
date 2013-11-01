// Open DB.
var db;
indexedDB.open("dict", 1).onsuccess = function(e) {
  db = e.target.result;
};

function onMessage(request, sender, callback) {
  if (request.action != 'translateWord') return false;

  // Lookup the requested word from DB.
  var trans = db.transaction(["word"], "readonly");
  trans.objectStore("word").openCursor(request.word).onsuccess = function(e) {
    var result = e.target.result;
    if (result) {
      callback(result.value.value);
    } else {
      callback(null);
    }
  };

  return true;
}
chrome.runtime.onMessage.addListener(onMessage);
