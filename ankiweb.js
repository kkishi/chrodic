chrome.runtime.onMessage.addListener(function(message, sender, done) {
  var success = (function() {
    function set(id, field, value) {
      var elem = document.getElementById(id);
      if (elem == null) return false;
      elem[field] = value;
      return true;
    }
    if (!set('models', 'value', message.config.noteType) ||
        !set('deck', 'value', message.config.deck) ||
        !set('f0', 'innerHTML', message.entry.word) ||
        !set('f1', 'innerHTML',
             message.entry.translation.replace(/\n/g, '<br />'))) {
      return false;
    }
    var mitem3 = document.getElementsByClassName('mitem3');
    if (mitem3.length == 0) return false;
    mitem3[0].click();
    return true;
  })();
  done(success ? 'success' : 'fail');
});

// Report the status back to the callback of chrome.tabs.executeScript which
// executed this file.
'success';
