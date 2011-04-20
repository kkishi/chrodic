#include <cassert>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <iostream>
#include <map>
#include <string>

#include "db.h"

using namespace std;

char buf[4092];

class File {
public:
  File(const string& file_name) : file_(fopen(file_name.c_str(), "r")) {
    if (file_ == NULL) {
      cout << "No such file: " << file_name;
      exit(1);
    }
  }
  ~File() { fclose(file_); }
  bool Fgets(char* buf, int buf_len) {
    return fgets(buf, buf_len, file_);
  }
private:
  FILE* file_;
};

void GetKeyValue(char* buf, char** ret_key, char** ret_kind, char** ret_value) {
  const char* header = "■";
  assert(strncmp(buf, header, strlen(header)) == 0);
  char* key = buf + strlen(header);

  const char* separater = " : ";
  char* separater_pos = strstr(key, separater);
  *separater_pos = '\0';
  char* value = separater_pos + strlen(separater);
  *(value + strlen(value) - 1) = '\0';

  const char* sep = "  {";  // Separater like "  {形}".
  char* sep_pos = strstr(key, sep);
  if (sep_pos) {
    *sep_pos = '\0';
    sep_pos += 2;
  }

  for (char* p = key; *p; ++p) {
    if (isupper(*p)) *p = tolower(*p);
  }
  *ret_key = key;
  *ret_kind = sep_pos;
  *ret_value = value;
}

int main(int argc, char** argv) {
  File dictionary(argv[1]);
  eijiro::DB db(argv[2]);
  db.CreateTable();
  string Key;
  string Value;
  int inserted = 0;
  while (dictionary.Fgets(buf, sizeof(buf))) {
    char *key, *kind, *value;
    GetKeyValue(buf, &key, &kind, &value);
    if (Key != key) {
      if (!Key.empty()) {
        db.Insert(Key.c_str(), Value.c_str());
        if (++inserted % 10000 == 0) {
          printf("Inserted %d words.\n", inserted);
        }
      }
      Key = key;
      Value = (kind ? string(kind) + string(value) : string(value));
    } else {
      Value += "\n" + (kind ? string(kind) + string(value) : string(value));
    }
  }
  db.Insert(Key.c_str(), Value.c_str());
  return 0;
}
