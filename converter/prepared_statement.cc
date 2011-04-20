#include "prepared_statement.h"

#include <cstring>
#include "sqlite3.h"

namespace eijiro {

PreparedStatement::PreparedStatement(sqlite3* db, const char* sql) {
  sqlite3_prepare_v2(db, sql, -1, &stmt_, NULL);
}

PreparedStatement::~PreparedStatement() {
  sqlite3_finalize(stmt_);
}

void PreparedStatement::BindText(const int index, const char* value) {
  sqlite3_bind_text(stmt_, index, value, -1, SQLITE_STATIC);
}

int PreparedStatement::Step() {
  return sqlite3_step(stmt_);
}

int PreparedStatement::Reset() {
  return sqlite3_reset(stmt_);
}

const unsigned char* PreparedStatement::ColumnText(const int col) {
  return sqlite3_column_text(stmt_, col);
}

}  // namespace eijiro
