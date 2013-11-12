function TranslationTask(words, translationBox) {
  this.cancelled = false;
  this.words = words;
  this.remaining = 0;
  this.translationBox = translationBox;
  this.translation = "";

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
    this.translate(this.words[i]);
  }
};

TranslationTask.prototype.translate = function(word) {
  var self = this;
  ++self.remaining;
  chrome.runtime.sendMessage(
      {'action' : 'translateWord', 'word' : word},
      function (translation) {
        if (self.cancelled) return;
        if (translation != null) {
          var match = translation.match(/<→(.*)>/);
          if (match &&  // Found a link to the canonical spelling.
              word != match[1]) {  // Check if we don't do infinite loop.
            self.translate(match[1]);
  //        return;
          }
          if (translation != '') {
            self.translation +=
            ('<span style="font-size:14px;">' + word +
             '</span>\n<div style="margin:5px;">' + translation + '</div>').
                replace(/\n/g, '<br />');
          }
        }
        --self.remaining;
        if (self.remaining == 0) {
          TranslationTask.activeTask = null;

          self.translationBox.SetContent(self.translation);
          self.translationBox.AdjustLocation();
          self.translationBox.Fadein();
        }
      });
};
