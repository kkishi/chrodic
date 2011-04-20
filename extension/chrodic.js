console.log('chrodic loaded!');

function getWord(event) {
  var range = document.caretRangeFromPoint(event.clientX, event.clientY);
  if (!range.startContainer.nodeValue) return '';
  while (range.startOffset > 0) {
    range.setStart(range.startContainer, range.startOffset - 1);
    if (!/^[a-zA-Z0-9]/.test(range.toString())) {
      range.setStart(range.startContainer, range.startOffset + 1);
      break;
    }
  }
  while (range.endOffset < range.endContainer.nodeValue.length) {
    range.setEnd(range.endContainer, range.endOffset + 1);
    if (!/[a-zA-Z0-9]$/.test(range.toString())) {
      range.setEnd(range.endContainer, range.endOffset - 1);
      break;
    }
  }
  return range.toString().toLowerCase();
}

var previous_word = '';

var translation_box = document.createElement('div');
with (translation_box.style) {
  zIndex = 2147483647;
  position = 'absolute';
  background = '#000000';
  color = '#ffffff';
  fontSize = '10px';
  opacity = '0.75';
  textAlign = 'left';
  display = 'none';
}
document.body.appendChild(translation_box);

document.addEventListener('click', function(event) {
  if (event.ctrlKey) {
    translation_box.style.display =
        translation_box.style.display == 'block' ? 'none' : 'block';
  }
}, false);

document.addEventListener('mousemove', function(event) {
  // Redraw translation box.
  var box_width = Math.min(400, window.innerWidth);
  var box_left = Math.min(window.innerWidth - box_width, event.clientX)
    + event.pageX - event.clientX;
  var box_top = event.pageY + 10;
  with (translation_box.style) {
    width = box_width + 'px';
    left = box_left + 'px';
    top = box_top + 'px';
  }

  var word = getWord(event);
  if (word == previous_word) return;
  previous_word = word;
  translation_box.innerHTML = '';

  function translate(w) {
    chrome.extension.sendRequest(
      {'action' : 'translateWord', 'word' : w},
      function (translation) {
        //console.log(w + " " + translation);
        if (translation != '') {
          if (translation_box.innerHTML != '') {
            translation_box.innerHTML += '<br />';
          }
          translation_box.innerHTML +=
          ('<span style="font-size:14px">' + w + '</span>\n' + translation).
            replace('\n', '<br />');
        }
      });
  }

  translate(word);
  if (/s$/.test(word)) translate(word.replace(/s$/, ''));
  if (/es$/.test(word)) translate(word.replace(/s$/, ''));
  if (/ies$/.test(word)) translate(word.replace(/ies$/, 'y'));
  if (/ing$/.test(word)) translate(word.replace(/ing$/, ''));
  if (/ing$/.test(word)) translate(word.replace(/ing$/, 'e'));
  if (/ed$/.test(word)) translate(word.replace(/ed$/, 'e'));
  if (/ed$/.test(word)) translate(word.replace(/ed$/, ''));
  if (/.{2}ing$/.test(word)) translate(word.replace(/.{2}ing$/, ''));
  if (/ied$/.test(word)) translate(word.replace(/ied$/, 'y'));
}, false);
