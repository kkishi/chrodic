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

document.addEventListener('dblclick', function(event) {
  translation_box.style.display = 'block';
}, false);

document.addEventListener('click', function(event) {
  translation_box.style.display = 'none';
}, false);

var REWRITE_RULES = [
  [/s$/, ''],  // Plural (cats -> cat)
  [/ies$/, 'y'],  // Plural (categories -> category)
  [/ing$/, ''],  // Present participle (doing -> do)
  [/ing$/, 'e'],  // Present participle (rating -> rate)
  [/(.)\1ing$/, '$1'], // Present participle (getting -> get)
  [/ed$/, 'e'],  // Past participle (rated -> rate)
  [/ed$/, ''],  // Past participle (started -> start)
  [/(.)\1ed$/, '$1'],  // Past participle (submitted -> submit)
  [/ied$/, 'y']  // Past participle (fried -> fry)
];

// Test REWRITE_RULES
(function() {
   function expand(word) {
     return REWRITE_RULES.map(function(r) { return word.replace(r[0], r[1]); }).
       filter(function(s) { return s != word; });
   }
   [
     'categories|category',
     'cats|cat',
     'derived|derive',
     'dogged|dog',
     'doing|do',
     'fried|fry',
     'getting|get',
     'giving|give',
     'rated|rate',
     'rating|rate',
     'saved|save',
     'started|start',
     'submitted|submit',
     'writes|write'
   ].map(function(w) { return w.split('|'); }).forEach(function(word) {
     var expanded = expand(word[0]);
     var found = expanded.some(function(e) { return e == word[1]; });
     //console.log(found, word[0], expanded);
   });
})();

function translate(word) {
  chrome.runtime.sendMessage(
    {'action' : 'translateWord', 'word' : word},
    function (translation) {
      var match = translation.match(/<→(.*)>/);
      if (match &&  // Found a link to the canonical spelling.
          word != match[1]) {  // Check if we don't do infinite loop.
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

  var words = [];
  words.push(word);
  REWRITE_RULES.forEach(function(r) {
    if (r[0].test(word)) {
      words.push(word.replace(r[0], r[1]));
    }
  });

  for (var i = 2; i <= 5; ++i) { 
    var new_word = getWord(event, i);
    if (new_word == word) break;
    word = new_word;
    words.push(word);
  }

  for (var i = words.length - 1; i >= 0; --i) {
    translate(words[i]);
  }
}, false);
