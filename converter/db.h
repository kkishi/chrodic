#ifndef DB_H_
#define DB_H_

#include <memory>

class sqlite3;
class sqlite3_stmt;

namespace eijiro {

class PreparedStatement;

class DB {
 public:
  explicit DB(const char* file_name);
  ~DB();
  void CreateTable();
  void Insert(const char* key, const char* value);
  const unsigned char* Lookup(const char* key);
 private:
  void Check(int code);
  sqlite3* db_;
  std::auto_ptr<PreparedStatement> insert_stmt_;
  std::auto_ptr<PreparedStatement> lookup_stmt_;
};

}  // namespace eijiro

#endif  // DB_H_
