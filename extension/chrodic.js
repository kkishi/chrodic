console.log('chrodic loaded!');

var enabled = false;
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

var REWRITE_RULES = [
  [/s$/, ''],  // Plural (cats -> cat)
  [/ies$/, 'y'],  // Plural (categories -> category)
  [/es$/, ''],  // Plural (fixes -> fix)
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
     'fixes|fix',
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

var translationBox = new TranslationBox;

function redrawTranslationBox() {
  var words = [];
  for (var i = 5; i >= 1; --i) {
    var w = getWord(i);
    if (words.length == 0 || words[words.length - 1] != w) {
      words.push(w);
    }
  }
  var word = getWord(1);
  REWRITE_RULES.forEach(function(r) {
    if (r[0].test(word)) {
      words.push(word.replace(r[0], r[1]));
    }
  });

  (new TranslationTask(words, translationBox)).run();
};

var lastScrollTimeStamp = 0;

document.addEventListener('scroll', function(event) {
  if (!enabled) return;

  // Clear translation box.
  translationBox.Fadeout();

  // Record the timestamp for the later check in mousemove handler.
  lastScrollTimeStamp = event.timeStamp;
}, false);

var st;

var previousWord = '';

document.addEventListener('mousemove', function(event) {
  // Store event to obtain mouse location.
  mouseMoveEvent = event;

  // Mousemove cancels enabling chrodic.
  clearTimeout(enableTimeout);

  translationBox.SetLocation(mouseMoveEvent);

  if (!enabled) return;

  var word = getWord(1);
  if (word == previousWord) return;
  previousWord = word;

  // Clear translation box.
  translationBox.Fadeout();

  // Chrome triggers mousemove event on scroll. If it's close to the last
  // scroll event, probably it's not a pure mouse move.
  if (event.timeStamp - lastScrollTimeStamp < 200) {
    return;
  }

  // Redraw translation box if mouse stays hovering on a same location for a
  // certain amount of time.
  clearTimeout(st);
  st = setTimeout(function() {
    redrawTranslationBox();
  }, 200);
}, false);

document.addEventListener('mouseleave', function(event) {
  if (!enabled) return;

  // Clear translation box.
  translationBox.Fadeout();

  // Cancel ongoing translation box updates.
  clearTimeout(st);
});

var enableTimeout;

document.addEventListener('mousedown', function(event) {
  if (enabled) {
    enabled = false;
    translationBox.Fadeout();
  } else {
    enableTimeout = setTimeout(function() {
      if (event.pageX != mouseMoveEvent.pageX ||
          event.pageY != mouseMoveEvent.pageY) {
        // Only triggers when mouse stays on the same location.
        return;
      }
      enabled = true;
      redrawTranslationBox();
    }, 500);
  }
});

document.addEventListener('mouseup', function(event) {
  clearInterval(enableTimeout);
});
