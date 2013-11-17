chrome.runtime.onMessage.addListener(function(message, sender, done) {
  function $(id) { return document.getElementById(id); }
  $('models').value = message.config.noteType;
  $('deck').value = message.config.deck;
  $('f0').innerHTML = message.entry.word;
  $('f1').innerHTML = message.entry.translation.replace(/\n/g, '<br />');
  document.getElementsByClassName('mitem3')[0].click();
  done();
});
