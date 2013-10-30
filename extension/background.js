function onMessage(request, sender, callback) {
  if (request.action != 'translateWord') return;
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        callback(xhr.responseText);
      } else {
        callback(null);
      }
    }
  }
  var url = 'http://localhost:8080/' + request.word;
  xhr.open('GET', url, true);
  xhr.send();
  return true;
}
chrome.runtime.onMessage.addListener(onMessage);
