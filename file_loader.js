function BarrierCallback(callback) {
  var self = this;
  self.callback = callback;
  self.reference = 1;
  self.run = function() { self.Run(); };
}

BarrierCallback.prototype.CreateCallback = function() {
  ++this.reference;
  return this.run;
};

BarrierCallback.prototype.Run = function() {
  --this.reference;
  if (this.reference == 0) {
    this.callback();
  }
};

function NewRunAllCallback(callbacks) {
  return function() {
    for (var i = 0; i < callbacks.length; ++i) {
      callbacks[i]();
    }
  };
}

// FileLoader loads file into db.
function FileLoader(file, db) {
  this.file = file;
  this.db = db;
  this.current = 0;

  this.buffers = [];
  this.bufferCallbacks = [];

  this.key = '';
  this.value = '';
  this.keyValueCallbacks = [];

  this.words = [];
  this.wordsCallbacks = [];

  this.insertedBytes = 0;
}

FileLoader.chunk = 1024 * 512;

FileLoader.prototype.Load = function() {
  this.started = new Date();
  this.readNextChunk();
};

FileLoader.prototype.readNextChunk = function() {
  var self = this;
  var chunkSize = Math.min(FileLoader.chunk, self.file.size - self.current);
  var reader = new FileReader();
  reader.addEventListener('load', function() {
    // self points to FileLoader, this points to FileReader.
    self.processChunk(this.result, function () {
      self.insertedBytes += chunkSize;
      var percentage = self.insertedBytes / self.file.size * 100;
      Log(self.insertedBytes + " / " + self.file.size + " (" +
          Math.round(percentage) + "%)");
      UpdateProgressBar(percentage);
    });
  });
  reader.readAsArrayBuffer(
    self.file.slice(self.current, self.current + chunkSize));
  self.current += FileLoader.chunk;
};

// callback is triggered when all data in result is insrted to DB.
FileLoader.prototype.processChunk = function(result, callback) {
  var self = this;

  var barrier = new BarrierCallback(callback);

  var view = new Uint8Array(result);
  var end = -1;
  for (var i = view.length - 1; i >= 0; --i) {
    if (view[i] == '\n'.charCodeAt(0)) {
      end = i;
      break;
    }
  }
  self.buffers.push(view.subarray(0, end));
  self.bufferCallbacks.push(barrier.CreateCallback());

  var f = new FileReader();
  var runAll = NewRunAllCallback(self.bufferCallbacks);
  f.addEventListener('load', function(e) {
    self.parseLines(e.target.result, runAll);
  });
  f.readAsText(new Blob(self.buffers));

  self.buffers = [];
  self.bufferCallbacks = [];
  if (end + 1 <= view.length - 1) {
    self.buffers.push(view.subarray(end + 1, view.length));
    self.bufferCallbacks.push(barrier.CreateCallback());
  }

  if (self.current < self.file.size) {
    // Read the next chunk.
    self.readNextChunk();
  } else {
    // This is the last chunk. Add a callback which does random cleanup stuff.
    f.addEventListener('load', function() {
      // Add the pending key value pair.
      self.addWord(true, NewRunAllCallback(self.keyValueCallbacks));
    });
  }

  barrier.Run();
};

FileLoader.prototype.parseLines = function(text, callback) {
  var barrier = new BarrierCallback(callback);
  var lines = text.split('\n');
  for (var i = 0; i < lines.length; ++i) {
    var line = lines[i];
    var m = line.match(/■([^{]+)(?:  {(.+)})? : (.+)/);
    if (m == null) {
      Log('Failed to parse line: ', line);
      continue;
    }
    this.processKeyValue({ key: m[1], kind: m[2], value: m[3] },
                         barrier.CreateCallback());
  }
  barrier.Run();
};

FileLoader.prototype.processKeyValue = function(kv, callback) {
  if (this.key != kv.key) {
    if (this.key != '') {
      this.addWord(false, NewRunAllCallback(this.keyValueCallbacks));
    }
    this.key = kv.key;
    this.value = '';
    this.keyValueCallbacks = [];
  } else {
    this.value += '\n';
  }
  if (kv.kind) this.value += '【' + kv.kind + '】';
  this.value += kv.value;
  this.keyValueCallbacks.push(callback);
};

FileLoader.prototype.addWord = function(last, callback) {
  var lowerKey = this.key.toLowerCase();
  var valueWithoutRuby = this.value.replace(/｛.+?｝/g, '');
  var entry = { "key": lowerKey, "value": valueWithoutRuby };
  if (this.key != lowerKey) {
    entry.originalKey = this.key;
  }
  this.words.push(entry);
  this.wordsCallbacks.push(callback);

  // Don't commit if it's not a last word and pending words are less than
  // 20000.
  if (!last && this.words.length < 20000) {
    return;
  }

  var firstWord = JSON.stringify(this.words[0]);
  Log("storing ", firstWord);

  var trans = this.db.transaction(["word"], "readwrite");
  var store = trans.objectStore("word");

  for (var i = 0; i < this.words.length; ++i) {
    store.put(this.words[i]);
  }

  var self = this;
  var runAll = NewRunAllCallback(this.wordsCallbacks);
  trans.oncomplete = function(e) {
    Log("transaction complete", firstWord);
    runAll();
    if (last) {
      // Notify background.js that it can re-open db.
      chrome.runtime.sendMessage(
        {'action' : 'endDatabaseUpdate'},
        function () {
          Log('Done! (' + ((new Date()) - self.started) + 'ms)');
        });
    }
  };

  this.words = [];
  this.wordsCallbacks = [];
};
