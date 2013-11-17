chrome.runtime.onMessage.addListener(function(entry, sender, done) {
  function $(id) { return document.getElementById(id); }
  $('deck').value = 'English';
  $('f0').innerHTML = entry.word;
  $('f1').innerHTML = entry.translation.replace(/\n/g, '<br />');
  document.getElementsByClassName('mitem3')[0].click();
  done();
});
