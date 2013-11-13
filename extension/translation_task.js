function TranslationTask(words, translationBox) {
  this.cancelled = false;
  this.words = words;
  this.finished = 0;
  this.translationBox = translationBox;
  this.translations = [];

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
  chrome.runtime.sendMessage(
      {'action' : 'translateWord', 'word' : word},
      function (translation) {
        if (self.cancelled) return;
        if (translation != null) {
          var match = translation.match(/<→(.*)>/);
          if (match &&  // Found a link to the canonical spelling.
              word != match[1]) {  // Check if we don't do infinite loop.
            var l = self.words.length;
            self.words.push(match[1]);
            self.translate(l);
  //        return;
          }
          self.translations[i] = translation;
        }
        ++self.finished;
        if (self.finished == self.words.length) {
          TranslationTask.activeTask = null;

          // Pass non-empty word/translation pairs.
          var words = [];
          var translations = [];
          for (var j = 0; j < self.words.length; ++j) {
            if (self.translations[j] != undefined) {
              words.push(self.words[j]);
              translations.push(self.translations[j]);
            }
          }
          self.translationBox.SetContent(words, translations);
          self.translationBox.AdjustLocation();
          self.translationBox.Fadein();
        }
      });
};
