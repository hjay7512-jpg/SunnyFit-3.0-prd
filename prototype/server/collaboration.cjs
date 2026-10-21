const {DatabaseSync}=require('node:sqlite'),fs=require('node:fs'),path=require('node:path')
function sqliteAdapter(database){return {
  async first(sql,params=[]){return database.prepare(sql).get(...params)},
  async all(sql,params=[]){return database.prepare(sql).all(...params)},
  async batch(statements){database.exec('BEGIN IMMEDIATE');try{const results=statements.map(({sql,params=[]})=>database.prepare(sql).run(...params));database.exec('COMMIT');return results}catch(error){database.exec('ROLLBACK');throw error}}
}}
async function createLocalCollaboration(options={}){
  const filename=options.filename||process.env.COLLAB_DB_PATH||path.resolve(__dirname,'../runtime/prototype-collaboration.sqlite');fs.mkdirSync(path.dirname(filename),{recursive:true});const database=new DatabaseSync(filename);database.exec('PRAGMA journal_mode=WAL');
  // Only the local adapter applies migrations here; hosted D1 migrations run at deployment.
  database.exec('CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY)');
  const directory=path.resolve(__dirname,'../collaboration-service/drizzle');
  for(const name of fs.readdirSync(directory).filter(name=>name.endsWith('.sql')).sort())if(!database.prepare('SELECT 1 FROM local_migrations WHERE name=?').get(name)){database.exec('BEGIN');try{database.exec(fs.readFileSync(path.join(directory,name),'utf8'));database.prepare('INSERT INTO local_migrations VALUES (?)').run(name);database.exec('COMMIT')}catch(error){database.exec('ROLLBACK');throw error}}
  const {createCollaborationService}=await import('../collaboration-service/core/service.mjs');
  const handler=createCollaborationService({db:sqliteAdapter(database),registry:require('../config/collaboration-registry.json'),adminKey:options.adminKey||process.env.COLLAB_ADMIN_KEY||'',editPassword:options.editPassword||process.env.COLLAB_EDIT_PASSWORD||'',allowedOrigins:options.allowedOrigins||String(process.env.COLLAB_ALLOWED_ORIGINS||'http://127.0.0.1:3011,http://localhost:3011,http://127.0.0.1:8080,http://localhost:8080').split(',')});
  return {handler,database,close(){database.close()}};
}
module.exports={createLocalCollaboration,sqliteAdapter}
