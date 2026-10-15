// Only the SQLite connection changes on Pages; server business rules stay shared.
let SQL
const connections = new Map()
function initialize(sql) { SQL = sql }
function restore(filename, bytes) {
  const existing = connections.get(filename)
  if (existing) throw new Error('Close the previous review database before restoring it.')
  const db = bytes ? new SQL.Database(new Uint8Array(bytes)) : new SQL.Database()
  db.run('PRAGMA foreign_keys=ON')
  connections.set(filename, { db, refs: 0 })
}
class DatabaseSync {
  constructor(filename) {
    if (!SQL) throw new Error('Browser SQLite has not initialized.')
    if (!connections.has(filename)) restore(filename)
    this.connection = connections.get(filename)
    this.connection.refs++
    this.closed = false
  }
  exec(sql) { this.connection.db.run(sql) }
  prepare(sql) {
    const db = this.connection.db
    const read = (args, first) => {
      const statement = db.prepare(sql)
      try {
        statement.bind(args)
        const rows = []
        while (statement.step()) {
          const row = statement.getAsObject()
          if (first) return row
          rows.push(row)
        }
        return first ? undefined : rows
      } finally { statement.free() }
    }
    return {
      get: (...args) => read(args, true),
      all: (...args) => read(args, false),
      run: (...args) => { db.run(sql, args); return { changes: db.getRowsModified() } }
    }
  }
  close() {
    if (this.closed) return
    this.closed = true
    if (--this.connection.refs === 0) {
      for (const [name, entry] of connections) if (entry === this.connection) connections.delete(name)
      this.connection.db.close()
    }
  }
}
function snapshot(filename) {
  const db = connections.get(filename).db
  const bytes = db.export()
  // SQLite export closes/reopens the connection and resets this PRAGMA.
  db.run('PRAGMA foreign_keys=ON')
  return bytes
}
module.exports = { initialize, restore, snapshot, DatabaseSync }
