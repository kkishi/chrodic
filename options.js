var db;

function deleteDatabase() {
    var request = indexedDB.deleteDatabase("dict");
    console.log('deleteDatabase', request);

    request.onsuccess = function(e) {
      console.log('delete success');
    };

    request.onerror = function(e) {
      console.log('delete error', e);
    };

    request.onblocked = function(e) {
      console.log('delete blocked', e);
    };
}

function openDatabase() {
  var request = indexedDB.open("dict", 1);
  console.log('openDatabase', request);

  request.onupgradeneeded = function(e) {
    console.log('open upgradeneeded');

    db = e.target.result;

    e.target.transaction.onerror = function(e) {
      console.log('transaction error', e);
    };

    if(db.objectStoreNames.contains("word")) {
      db.deleteObjectStore("word");
    }

    var store = db.createObjectStore("word", {autoIncrement: true});
    store.createIndex('key', 'key', {unique: false});
  };

  request.onsuccess = function(e) {
    console.log('open success');

    db = e.target.result;
  };

  request.onerror = function(e) {
    console.log('open error', e);
  };

  request.onblocked = function(e) {
    console.log('open blocked', e);
  };
};

var words = [];

function addWord(key, value, last) {
  var lowerKey = key.toLowerCase();
  var valueWithoutRuby = value.replace(/｛.+?｝/g, '');
  var entry = { "key": lowerKey, "value": valueWithoutRuby };
  if (key != lowerKey) {
    entry.originalKey = key;
  }
  words.push(entry);

  // Don't commit if it's not a last word and pending words are less than
  // 10000.
  if (!last && words.length < 10000) {
    return;
  }

  console.log(words[0]);

  var trans = db.transaction(["word"], "readwrite");
  var store = trans.objectStore("word");

  for (var i = 0; i < words.length; ++i) {
    store.put(words[i]);
  }

  trans.oncomplete = function(e) {
    console.log("transaction complete");
    if (last) {
      // Notify background.js that it can re-open db.
      chrome.runtime.sendMessage(
        {'action' : 'endDatabaseUpdate'},
        function () {
          console.log('Done!');
        });
    }
  };

  words = [];
};

var key = '';
var value = '';

function processKeyValue(kv) {
  if (key != kv.key) {
    if (key != '') {
      addWord(key, value, false);
    }
    key = kv.key;
    value = (kv.kind ? kv.kind + kv.value : kv.value);
  } else {
    value += "\n" + (kv.kind ? kv.kind + kv.value : kv.value);
  }
}

function loadFile(file) {

  function parseLine(line) {
    var m =line.match(/■([^{]+)(?:  {(.+)})? : (.+)/);
    if (m == null) {
      console.log('Failed to parse line: ', line);
      return;
    }
    processKeyValue({ key: m[1], kind: m[2], value: m[3] });
  }

  function parseLines(e) {
    var lines = e.target.result.split('\n');
    for (var i = 0; i < lines.length; ++i) {
      parseLine(lines[i]);
    }
  }

  var buffers = [];
  function read() {
    var view = new Uint8Array(this.result);
    var end = -1;
    for (var i = view.length - 1; i >= 0; --i) {
      if (view[i] == '\n'.charCodeAt(0)) {
        end = i;
        break;
      }
    }
    buffers.push(view.subarray(0, end));
    var f = new FileReader();
    f.addEventListener('load', parseLines);
    f.readAsText(new Blob(buffers));
    buffers = [];
    if (end + 1 <= view.length - 1) {
      buffers.push(view.subarray(end + 1, view.length));
    }
    if (current < file.size) {
      // Read the next chunk.
      readLoop();
    } else {
      // This is the last chunk. Add a callback which does random cleanup
      // stuff.
      f.addEventListener('load', function() {
        // Add the pending key value pair.
        addWord(key, value, true);
      });
    }
  }

  var chunk = 1024 * 512;
  var current = 0;
  function readLoop() {
    var percentage = Math.round(current / file.size * 100);
    console.log(current + " / " + file.size + " (" + percentage + "%)");
    updateProgressBar(percentage);

    var reader = new FileReader();
    reader.addEventListener('load', read);
    reader.readAsArrayBuffer(file.slice(current,
                      Math.min(file.size, current + chunk)));
    current += chunk;
  }
  readLoop();
};

document.querySelector('#myfile').onchange = function(e) {
  if (this.files.length != 1) return;
  var file = this.files[0];

  // First, notify background.js that we are going to manipulate db so it
  // should close currently opened db.
  chrome.runtime.sendMessage(
    {'action' : 'beginDatabaseUpdate'},
    function () {
      // Now we can manipulate db. Recreate a new db.
      deleteDatabase();
      openDatabase();

      // Poll until db becomes available.
      var st = setInterval(function() {
        if (db == null) {
          console.log('DB not initialized.');
          return;
        }
        console.log('DB initialized.');
        clearInterval(st);
        loadFile(file);
      }, 1000);
    });
};


var fields = [{name: 'note_type', default: 'Basic'},
              {name: 'deck', default: 'Default'}];
window.addEventListener('load', function() {
  fields.forEach(function(field) {
    if (localStorage[field.name] == undefined) {
      localStorage[field.name] = field.default;
    }
    var element = document.getElementById(field.name);
    element.value = localStorage[field.name];
    element.addEventListener('change', function(e) {
      localStorage[field.name] = element.value;
    });
  });
});

function updateProgressBar(progress) {
  var bar = Math.floor(progress) + '%' + '&nbsp;[';
  for (var i = 0; i < 50; ++i) {
    if ((i + 1) * 2 <= progress) {
      bar += '=';
    } else {
      bar += '&nbsp;';
    }
  }
  document.getElementById('progress').innerHTML = bar + ']';
}

window.addEventListener('load', function() {
  updateProgressBar(0);
});
