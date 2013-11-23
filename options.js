var db;

function Log() {
  console.log.apply(console, arguments);
  var textarea = document.getElementById('log');
  textarea.value += Array.prototype.join.call(arguments, ' ') + '\n';
  textarea.scrollTop = textarea.scrollHeight;
}

function deleteDatabase(callback) {
  var request = indexedDB.deleteDatabase("dict");
  Log('deleteDatabase', request);

  request.onupgradeneeded = function(e) {
    Log('delete upgradeneeded');
    callback();
  };

  request.onsuccess = function(e) {
    Log('delete success');
    callback();
  };

  request.onerror = function(e) {
    Log('delete error', e);
  };

  request.onblocked = function(e) {
    Log('delete blocked', e);
  };
}

function openDatabase(callback) {
  var request = indexedDB.open("dict", 1);
  Log('openDatabase', request);

  request.onupgradeneeded = function(e) {
    Log('open upgradeneeded');

    db = e.target.result;

    e.target.transaction.onerror = function(e) {
      Log('transaction error', e);
    };

    if(db.objectStoreNames.contains("word")) {
      db.deleteObjectStore("word");
    }

    var store = db.createObjectStore("word", {autoIncrement: true});
    store.createIndex('key', 'key', {unique: false});
  };

  request.onsuccess = function(e) {
    Log('open success');

    db = e.target.result;

    callback();
  };

  request.onerror = function(e) {
    Log('open error', e);
  };

  request.onblocked = function(e) {
    Log('open blocked', e);
  };
};

document.querySelector('#eijiro_file').onchange = function(e) {
  if (this.files.length != 1) return;
  var file = this.files[0];

  // First, notify background.js that we are going to manipulate db so it
  // should close currently opened db.
  Log('Notifying the background page about DB installation.');
  chrome.runtime.sendMessage(
    {'action' : 'beginDatabaseUpdate'},
    function () {
      // Now we can manipulate db. Recreate a new db.
      Log('Controll is back from background page.');
      deleteDatabase(function() {
        openDatabase(function() {
          Log('DB initialization successfully finished.');
          (new FileLoader(file, db)).Load();
        });
      });
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

function UpdateProgressBar(progress) {
  var str = Math.round(progress * 100) / 100 + '%';
  document.getElementById('bar').style.width = str;
}

function renderEntries() {
  var ul = document.getElementById('entries');
  while (ul.childNodes.length > 0) {
    ul.removeChild(ul.childNodes[0]);
  }
  var str = localStorage['numEntries'];
  var numEntries = (str == undefined) ? 0 : parseInt(str);
  for (var i = 0; i < numEntries; ++i) {
    var entryStr = localStorage['entry[' + i + ']'];
    var entry = JSON.parse(entryStr);
    var li = document.createElement('li');
    var translation = entry.translation;
    if (translation.length > 30) {
      translation = translation.substr(0, 50) + '...';
    }
    li.innerHTML = i + '. ' + entry.word + ': ' + translation;
    ul.appendChild(li);
  }
}

window.addEventListener('load', function() {
  UpdateProgressBar(0);
  renderEntries();

  document.getElementById('clear').addEventListener('click', function() {
    var str = localStorage['numEntries'];
    var numEntries = (str == undefined) ? 0 : parseInt(str);
    for (var i = 0; i < numEntries; ++i) {
      delete localStorage['entry[' + i + ']'];
    }
    delete localStorage['numEntries'];
    renderEntries();
  });

  var str = localStorage['numEntries'];
  var numEntries = (str == undefined) ? 0 : parseInt(str);
  var text = '';
  for (var i = 0; i < numEntries; ++i) {
    var entryStr = localStorage['entry[' + i + ']'];
    var entry = JSON.parse(entryStr);
    text += entry.word + '	' + entry.translation.replace(/\n/g, '<br />') +
      '\n';
  }
  var blob = new Blob([text]);
  var link = window.URL.createObjectURL(blob);
  document.getElementById('download').href = link;
});
