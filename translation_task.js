function TranslationTask(words, translationBox) {
  this.cancelled = false;
  this.words = words;
  this.finished = 0;
  this.translationBox = translationBox;
  this.results = [];
  this.seen = {};

  if (TranslationTask.activeTask != null) {
    TranslationTask.activeTask.cancel();
    TranslationTask.activeTask = null;
  }
  TranslationTask.activeTask = this;
}

TranslationTask.prototype.cancel = function() {
  this.cancelled = true;
};

TranslationTask.prototype.run = function() {
  for (var i = 0; i < this.words.length; i++) {
    this.translate(i);
  }
};

TranslationTask.prototype.translate = function(i) {
  var self = this;
  var word = self.words[i];
  self.seen[word] = true;
  chrome.runtime.sendMessage(
      {'action' : 'translateWord', 'word' : word},
      function (results) {
        if (self.cancelled) return;
        for (var j = 0; j < results.length; ++j) {
          var match = results[j].value.match(/<→(.*)>/);
          if (match &&  // Found a link to the canonical spelling.
              !self.seen[match[1]]) {  // Check if we don't do infinite loop.
            var l = self.words.length;
            self.words.push(match[1]);
            self.translate(l);
  //        return;
          }
        }
        Array.prototype.push.apply(self.results, results);
        ++self.finished;
        if (self.finished == self.words.length) {
          TranslationTask.activeTask = null;
          self.translationBox.SetContent(self.results);
          self.translationBox.AdjustLocation();
          self.translationBox.Fadein();
        }
      });
};
