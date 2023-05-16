psql --quiet -U postgres -h localhost -f testRecreateDB.sql
psql --quiet -U postgres -h localhost -f dizzbaseDBInit1.sql -d test
psql --quiet -U postgres -h localhost -f dizzbaseDBInit2.sql -d test
psql --quiet -U postgres -h localhost -f dizzbaseDBInit3.sql -d test
psql --quiet -U dizz -h localhost -f testLoadData.sql -d test
psql --quiet -U postgres -h localhost -f testCreateTestUser.sql -d test
