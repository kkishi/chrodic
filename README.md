* About

Chrodic is a Chrome Extension which provides a mouse over text translation
functionality into your browser. Currently it supports translation from English
to Japanese based on the Eijiro dictionary. Because it imports an Eijiro
dictionary file into an IndexedDB inside Chrome, it works fast and also works
offline.

* Install

1. Get an Eijiro dictionary file. You can either buy a book which comes with a
   CD containing a dictionary file, or buy a file online at
   http://www.eijiro.jp

1. Convert the dictionary file into utf-8. Type this command in your terminal:

   `$ iconv -c -f SJIS -t UTF-8 EIJI-118.TXT > EIJI-118-utf-8.TXT`

1. Import the dictionary file into Chrome.
   1. Go to chrome://extensions in Chrome.
   1. Click on the "Options" link on Chrodic. It takes you to the Chrodic
      options page.
   1. In the options page, click on "Choose File" button, select the
      EIJI-118-utf-8.TXT file you just created.
   1. Wait until "Done!" is shown on the textarea below.

* Usage

After the installation you can enable Chrodic on any page by keep pressing the
left mouse button more than 500ms. Then Chrodic will start showing translation
of words which are under your mouse. To disable Chrodic simply click on the
left mouse button.
When you find a word you didn't know its meaning, you can save it for your
later study. To save, during you are seeing its translation in the translation
box, press the number key corresponding to the word. By default it saves the
word and its translation into localStorage, which you can export to a TSV (tab
separated values) file. If you have an Ankiweb account, you can directly save
it to your preferred anki deck, by doing appropriate settings in the options
page. In order for that you need to be logged into Ankiweb in the same browser
you are using Chrodic.
