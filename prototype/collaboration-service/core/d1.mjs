export function d1Adapter(binding){return {
  async first(sql,params=[]){return binding.prepare(sql).bind(...params).first()},
  async all(sql,params=[]){return (await binding.prepare(sql).bind(...params).all()).results},
  async batch(statements){return (await binding.batch(statements.map(({sql,params=[]})=>binding.prepare(sql).bind(...params)))).map(result=>({changes:result.meta.changes}))}
};}
