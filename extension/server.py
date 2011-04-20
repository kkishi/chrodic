# -*- coding: utf-8 -*-
import BaseHTTPServer
import datetime
import sqlite3
import sys
import urllib

file = '/Users/keisuke/Desktop/eijiro/convert/dict.sqlite3'
if len(sys.argv) > 1:
  file = sys.argv[1]
db = sqlite3.connect(file)

def Lookup(word):
    start = datetime.datetime.now()
    cur = db.execute('select * from dict where key = "%s"' % word)
    end = datetime.datetime.now()
    res = cur.fetchone()
    print end - start
    return res[1] if res else u""

class MyHandler(BaseHTTPServer.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html; charset=UTF-8")
        self.end_headers()
        word = urllib.unquote(self.path[1:])
        print "Lookup %s" % word
        self.wfile.write(Lookup(word).encode('utf_8'))

BaseHTTPServer.HTTPServer(('localhost', 8080), MyHandler).serve_forever()
