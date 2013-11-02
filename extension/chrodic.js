console.log('chrodic loaded!');

var mouseMoveEvent;

function getWord(n) {
  var range = document.caretRangeFromPoint(
    mouseMoveEvent.clientX, mouseMoveEvent.clientY);
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

var st;

document.addEventListener('mousedown', function(event) {
  translation_box.style.display = 'none';
  st = setTimeout(function() {
    redrawTranslationBox();
    translation_box.style.display = 'block';
  }, 500);
}, false);

document.addEventListener('mouseup', function(event) {
  clearTimeout(st);
});

document.addEventListener('mousemove', function(event) {
  clearTimeout(st);
});

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

function translationTask(words) {
  this.cancelled = false;
  this.words = words;
  this.remaining = 0;

  if (translationTask.activeTask != null) {
    translationTask.activeTask.cancel();
    translationTask.activeTask = null;
  }
  translationTask.activeTask = this;
}

translationTask.prototype.cancel = function() {
  this.cancelled = true;
};

translationTask.prototype.run = function() {
  for (var i = 0; i < this.words.length; i++) {
    this.translate(this.words[i]);
  }
};

translationTask.prototype.translate = function(word) {
  var self = this;
  ++self.remaining;
  chrome.runtime.sendMessage(
      {'action' : 'translateWord', 'word' : word},
      function (translation) {
        if (self.cancelled) return;
        var match = translation.match(/<→(.*)>/);
        if (match &&  // Found a link to the canonical spelling.
            word != match[1]) {  // Check if we don't do infinite loop.
          self.translate(match[1]);
//        return;
        }
        if (translation != '') {
          translation_box.innerHTML +=
          ('<span style="font-size:14px;">' + word + '</span>\n<div style="margin:5px;">' + translation + '</div>').
              replace(/\n/g, '<br />');
          adjustTranslationBoxLocation();
        }
        --self.remaining;
        if (self.remaining == 0) {
          translationTask.activeTask = null;
        }
      });
};

function adjustTranslationBoxLocation() {
  // Redraw translation box.
  var box_width = Math.min(400, window.innerWidth);
  var box_left =
      Math.min(window.innerWidth - box_width, mouseMoveEvent.clientX)
          + mouseMoveEvent.pageX - mouseMoveEvent.clientX + 2;
  var box_top = mouseMoveEvent.pageY + 10;
  with (translation_box.style) {
    width = box_width + 'px';
    left = box_left + 'px';
    top = box_top + 'px';
  }

  // Adjust when bottom of the translation box is out of the window.
  var bcr = translation_box.getBoundingClientRect();
  with (translation_box.style) {
    if (bcr.height >= window.innerHeight) {
      top = window.pageYOffset + 'px';
    } else if (bcr.bottom > window.innerHeight) {
      top = (window.pageYOffset + window.innerHeight - bcr.height) + 'px';
    }
  }
}

function redrawTranslationBox() {
  var word = getWord(1);
  if (word == previous_word) return;
  previous_word = word;
  translation_box.innerHTML = '';

  var words = [];
  for (var i = 5; i >= 1; --i) {
    var w = getWord(i);
    if (words.length == 0 || words[words.length - 1] != w) {
      words.push(w);
    }
  }
  REWRITE_RULES.forEach(function(r) {
    if (r[0].test(word)) {
      words.push(word.replace(r[0], r[1]));
    }
  });

  (new translationTask(words)).run();
}

document.addEventListener('mousemove', function(event) {
  mouseMoveEvent = event;
  adjustTranslationBoxLocation();
  if (translation_box.style.display == 'none') return;
  redrawTranslationBox();
}, false);
