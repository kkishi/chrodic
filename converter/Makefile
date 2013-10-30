#OPTION=-03
OPTION=-g
#LIBSQLITE3=/usr/lib/libsqlite3.so
LIBSQLITE3=/usr/lib/libsqlite3.dylib

converter : converter.cc db
	g++ ${OPTION} ${LIBSQLITE3} db.o prepared_statement.o converter.cc

db : db.cc db.h prepared_statement
	g++ ${OPTION} -c db.cc prepared_statement.o

prepared_statement : prepared_statement.cc prepared_statement.h
	g++ ${OPTION} -c prepared_statement.cc

clean :
	rm -f *.o *.out *.sqlite3
