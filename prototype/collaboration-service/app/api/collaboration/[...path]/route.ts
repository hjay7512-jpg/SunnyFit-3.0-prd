import { env } from 'cloudflare:workers';
import { createCollaborationService } from '../../../../core/service.mjs';
import { d1Adapter } from '../../../../core/d1.mjs';
import registry from '../../../../core/registry.json';
export const dynamic='force-dynamic';
async function handle(request:Request){
  if(!env.DB)return Response.json({message:'共享数据库尚未连接。'},{status:503});
  return createCollaborationService({db:d1Adapter(env.DB),registry,adminKey:env.COLLAB_ADMIN_KEY||'',allowedOrigins:(env.COLLAB_ALLOWED_ORIGINS||'https://hjay7512-jpg.github.io').split(',')})(request);
}
export {handle as GET,handle as POST,handle as OPTIONS};
