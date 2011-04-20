#ifndef PREPARED_STATEMENT_H_
#define PREPARED_STATEMENT_H_

class sqlite3;
class sqlite3_stmt;

namespace eijiro {

class PreparedStatement {
 public:
  explicit PreparedStatement(sqlite3* db, const char* sql);
  ~PreparedStatement();
  void BindText(const int index, const char* value);
  int Step();
  int Reset();
  const unsigned char* ColumnText(const int col);
 private:
  sqlite3_stmt* stmt_;
};

}  // namespace eijiro

#endif  // PREPARED_STATEMENT_H_
