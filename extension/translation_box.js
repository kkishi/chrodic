function TranslationBox() {
  this.div = document.createElement('div');
  this.opacity = 0;
  with (this.div.style) {
    zIndex = 2147483647;
    position = 'absolute';
    background = '#000000';
    color = '#ffffff';
    fontSize = '10px';
    opacity = '0';
    textAlign = 'left';
    display = 'block';
    borderRadius = '5px';
  }
  document.body.appendChild(this.div);
}

TranslationBox.prototype.Fadein = function() {
  var self = this;
  clearInterval(self.fadeinSt);
  clearInterval(self.fadeoutSt);
  self.fadeinSt = setInterval(function() {
    self.div.style.opacity = self.opacity / 100;
    if (self.opacity == 75) {
      clearInterval(self.fadeinSt);
    } else {
      self.opacity += 5;
    }
  }, 10);
};

TranslationBox.prototype.Fadeout = function() {
  var self = this;
  clearInterval(self.fadeoutSt);
  clearInterval(self.fadeinSt);
  var opacity = 75;
  self.fadeoutSt = setInterval(function() {
    self.div.style.opacity = self.opacity / 100;
    if (self.opacity == 0) {
      self.div.innerHTML = '';
      clearInterval(self.fadeoutSt);
    } else {
      self.opacity -= 5;
    }
  }, 10);
};

TranslationBox.prototype.SetContent = function(words, translations) {
  // Store just for later retrieves by GetContent.
  this.words = words;
  this.translations = translations;

  var content = "";
  for (var i = 0; i < words.length; ++i) {
    content +=
    ('<span style="font-size:14px;">' + words[i] +
     '</span>\n<div style="margin:5px;">' + translations[i] + '</div>').
      replace(/\n/g, '<br />');
  }
  this.div.innerHTML = content;
};

TranslationBox.prototype.GetContent = function() {
  return [this.words, this.translations];
};

TranslationBox.prototype.SetLocation = function(mouse) {
  this.mouse = mouse;
  this.AdjustLocation();
};

TranslationBox.prototype.AdjustLocation = function() {
  // Redraw translation box.
  var box_width = Math.min(400, window.innerWidth);
  var box_left = Math.min(window.innerWidth - box_width, this.mouse.clientX) +
        this.mouse.pageX - this.mouse.clientX + 2;
  var box_top = this.mouse.pageY + 10;
  with (this.div.style) {
    width = box_width + 'px';
    left = box_left + 'px';
    top = box_top + 'px';
  }

  // Adjust when bottom of the translation box is out of the window.
  var bcr = this.div.getBoundingClientRect();
  with (this.div.style) {
    if (bcr.height >= window.innerHeight) {
      top = window.pageYOffset + 'px';
    } else if (bcr.bottom > window.innerHeight) {
      top = (window.pageYOffset + window.innerHeight - bcr.height) + 'px';
    }
  }
};
