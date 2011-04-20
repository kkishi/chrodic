#include "db.h"

#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <string>

#include "sqlite3.h"

#include "prepared_statement.h"

namespace eijiro {

DB::DB(const char* file_name) : db_(NULL) {
  Check(sqlite3_open(file_name, &db_));
  insert_stmt_.reset(new PreparedStatement(db_,
    "insert into dict (key, value) "
    "values (?, ?); "));
  lookup_stmt_.reset(new PreparedStatement(db_,
    "select value from dict where key = ?; "));

  PreparedStatement begin_transaction(db_, "begin; ");
  begin_transaction.Step();
}

DB::~DB() {
  PreparedStatement end_transaction(db_, "end; ");
  end_transaction.Step();

  Check(sqlite3_close(db_));
}

void DB::CreateTable() {
  PreparedStatement create_table_stmt(db_,
    "create table if not exists dict ( "
    "  key text primary key, "
    "  value text  "
    "); ");
  create_table_stmt.Step();
}

void DB::Insert(const char* key, const char* value) {
  insert_stmt_->BindText(1, key);
  insert_stmt_->BindText(2, value);
  int step_res = insert_stmt_->Step();
  if (step_res == SQLITE_CONSTRAINT) {
    return;
  } else {
    Check(step_res);
  }
  int reset_res = insert_stmt_->Reset();
  if (reset_res == SQLITE_CONSTRAINT) {
    return;
  } else {
    Check(reset_res);
  }
}

const unsigned char* DB::Lookup(const char* key) {
  lookup_stmt_->BindText(1, key);
  int step_res = lookup_stmt_->Step();
  printf("%d\n", step_res);
  Check(step_res);
  const unsigned char* value = lookup_stmt_->ColumnText(0);
  int reset_res = lookup_stmt_->Reset();
  Check(reset_res);
  return value;
}

void DB::Check(int code) {
  if (code == SQLITE_ERROR ||
      code == SQLITE_ABORT ||
      code == SQLITE_CONSTRAINT) {
    printf("Code: %d Message: %s\n", code, sqlite3_errmsg(db_));
    exit(1);
  }
}

} // namespace eijiro
