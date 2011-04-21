console.log('chrodic loaded!');

function getWord(event, n) {
  var range = document.caretRangeFromPoint(event.clientX, event.clientY);
  if (!range.startContainer.nodeValue) return '';
  // Expand left.
  while (range.startOffset > 0) {
    range.setStart(range.startContainer, range.startOffset - 1);
    if (!/^[a-zA-Z0-9]/.test(range.toString())) {
      range.setStart(range.startContainer, range.startOffset + 1);
      break;
    }
  }
  // Expand right.
  while (range.endOffset < range.endContainer.nodeValue.length) {
    range.setEnd(range.endContainer, range.endOffset + 1);
    if (!/[a-zA-Z0-9]$/.test(range.toString())) {
      range.setEnd(range.endContainer, range.endOffset - 1);
      break;
    }
  }
  for (var i = 1; i < n; ++i) {
    while (range.endOffset < range.endContainer.nodeValue.length) {
      range.setEnd(range.endContainer, range.endOffset + 1);
      if (/[a-zA-Z0-9]$/.test(range.toString())) {
        range.setEnd(range.endContainer, range.endOffset - 1);
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
  }
  while (range.endOffset > range.startOffset &&
         !/[a-zA-Z0-9]$/.test(range.toString())) {
    range.setEnd(range.endContainer, range.endOffset - 1);
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
  if (event.shiftKey) {
    translation_box.style.display =
        translation_box.style.display == 'block' ? 'none' : 'block';
  }
}, false);

var REWRITE_RULES = [
  [/s$/, ''],
  [/es$/, 'e'],
  [/es$/, ''],
  [/ies$/, 'y'],
  [/ing$/, ''],
  [/ing$/, 'e'],
  [/ed$/, 'e'],
  [/ed$/, ''],
  [/(.)$1ing$/, ''],
  [/ied$/, 'y']
];

function translate(word) {
  chrome.extension.sendRequest(
    {'action' : 'translateWord', 'word' : word},
    function (translation) {
      var match = translation.match(/<→(.*)>/);
      if (match) {
        translate(match[1]);
//        return;
      }
      if (translation != '') {
        translation_box.innerHTML +=
        ('<span style="font-size:14px;">' + word + '</span>\n<div style="margin:5px;">' + translation + '</div>').
            replace(/\n/g, '<br />');
      }
    });
}

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

  var word = getWord(event, 1);
  if (word == previous_word) return;
  previous_word = word;
  translation_box.innerHTML = '';

  //if (translation_box.style.display == 'none') return;
  translate(word);
  for (var i = 0; i < REWRITE_RULES.length; ++i) {
    if (REWRITE_RULES[i][0].test(word)) {
      translate(word.replace(REWRITE_RULES[i][0], REWRITE_RULES[i][1]));
    }
  }

  for (var i = 2; i <= 5; ++i) { 
    var new_word = getWord(event, i);
    if (new_word == word) break;
    word = new_word;
    translate(word);
  }
}, false);
