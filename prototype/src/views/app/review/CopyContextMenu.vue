<template>
  <div class="copy-context-layer" aria-label="原型协作工具">
    <template v-if="target&&rect">
      <div class="copy-context-outline" :style="outlineStyle"/>
      <div ref="menu" class="copy-context-menu" :style="menuStyle" role="menu" :aria-label="label+'操作'" @keydown="navigateMenu" @contextmenu.prevent>
        <div class="copy-context-menu__label">{{ label }}</div>
        <button v-if="hasCopy" type="button" role="menuitem" tabindex="-1" :disabled="state.busy" @click.stop="editOrUnlock">编辑文案</button>
        <button type="button" role="menuitem" tabindex="-1" :disabled="state.busy" @click.stop="select('comments')">备注/评论</button>
        <button v-if="state.session&&state.session.authType==='password'" type="button" role="menuitem" tabindex="-1" @click="logout">退出编辑</button>
      </div>
    </template>
    <div v-if="passwordOpen" class="copy-password-backdrop" @mousedown.self="cancelPassword"><form class="copy-password" role="dialog" aria-modal="true" aria-labelledby="copy-password-title" @submit.prevent="unlock"><h2 id="copy-password-title">解锁文案编辑</h2><label for="copy-password-input">编辑密码</label><input id="copy-password-input" ref="passwordInput" v-model="password" type="password" autocomplete="current-password" maxlength="128" :disabled="passwordBusy"/><p>验证后记住当前浏览器，下次无需输入。</p><p v-if="passwordError" class="copy-password__error" role="alert">{{ passwordError }}</p><footer><button type="button" :disabled="passwordBusy" @click="cancelPassword">取消</button><button class="copy-password__primary" type="submit" :disabled="passwordBusy||!password">{{ passwordBusy?'验证中…':'验证并编辑' }}</button></footer></form></div>
    <button v-if="state.connected||state.authStatus!=='none'" class="copy-context-picker" type="button" @click="nextBlock">选择区块 <span>↗</span></button>
  </div>
</template>
<script>
import {copyState,registry,canEdit,selectCopyBlock,unlockCopyWithPassword,lockCopyEditing} from '@/copy/operations-copy'

export default {
  props:{context:{type:Object,required:true}},
  data:()=>({state:copyState,target:null,hitContext:{},rect:null,menuX:8,menuY:8,passwordOpen:false,password:'',passwordError:'',passwordBusy:false,pendingEdit:null}),
  computed:{
    id(){return this.target&&this.target.getAttribute('data-copy-block')},
    label(){return registry.blocks[this.id]?.label||'当前区块'},
    selectedContext(){return {...this.context,target:this.label,...this.hitContext}},
    editable(){return canEdit(this.id)&&registry.blocks[this.id]?.fields.length>0},
    hasCopy(){return registry.blocks[this.id]?.fields.length>0},
    needsVerification(){return registry.blocks[this.id]?.fields.length>0&&['checking','unavailable','invalid'].includes(this.state.authStatus)},
    outlineStyle(){return {left:this.rect.left+'px',top:this.rect.top+'px',width:this.rect.width+'px',height:this.rect.height+'px'}},
    menuStyle(){return {left:this.menuX+'px',top:this.menuY+'px'}}
  },
  watch:{context(next,previous){if(!previous||next.page!==previous.page||next.state!==previous.state||next.path!==previous.path)this.dismiss()}},
  mounted(){
    document.body.appendChild(this.$el)
    this.onContextMenu=event=>{
      if(this.$el.contains(event.target)){event.preventDefault();return}
      const target=event.target.closest('.review-layout .phone-frame [data-copy-block],.review-layout .phone-frame[data-copy-block]')
      if(!target||!Object.prototype.hasOwnProperty.call(registry.blocks,target.getAttribute('data-copy-block'))){this.dismiss();return}
      event.preventDefault();event.stopPropagation()
      const box=target.getBoundingClientRect(),keyboard=event.clientX===0&&event.clientY===0
      const keyed=event.target.closest('[data-copy-key]'),fields=target.hasAttribute('data-copy-fields')?JSON.parse(target.getAttribute('data-copy-fields')):[],field=keyed?.getAttribute('data-copy-key')||(fields.length===1?fields[0]:''),control=event.target.closest('button,[role="tab"],a'),fieldLabel=registry.fields.find(item=>item.key===field)?.label,dialog=event.target.closest('[role="dialog"]'),surface=dialog?.getAttribute('aria-label')||(dialog?.getAttribute('aria-labelledby')||'').split(/\s+/).map(id=>document.getElementById(id)?.textContent||'').join(' ').trim()
      this.open(target,keyboard?box.left+12:event.clientX,keyboard?box.top+12:event.clientY,{target:fieldLabel||control?.getAttribute('aria-label')||control?.innerText?.trim().slice(0,80)||registry.blocks[target.getAttribute('data-copy-block')].label,field:field||'',surface})
    }
    this.onOutsidePointer=event=>{if(this.target&&!this.$el.contains(event.target))this.dismiss()}
    this.onKey=event=>{
      if(this.passwordOpen&&event.key==='Escape'){event.preventDefault();this.cancelPassword();return}
      if(!this.target)return
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();this.dismiss(true)}
      else if(event.key==='Tab')this.dismiss(true)
    }
    this.onViewportChange=()=>{
      if(!this.target)return
      const rect=this.measureTarget(this.target)
      if(!rect){this.dismiss();return}
      this.rect=rect;this.clampMenu()
    }
    document.addEventListener('contextmenu',this.onContextMenu)
    document.addEventListener('pointerdown',this.onOutsidePointer,true)
    document.addEventListener('keydown',this.onKey,true)
    document.addEventListener('scroll',this.onViewportChange,true)
    window.addEventListener('resize',this.onViewportChange)
  },
  beforeDestroy(){
    document.removeEventListener('contextmenu',this.onContextMenu)
    document.removeEventListener('pointerdown',this.onOutsidePointer,true)
    document.removeEventListener('keydown',this.onKey,true)
    document.removeEventListener('scroll',this.onViewportChange,true)
    window.removeEventListener('resize',this.onViewportChange)
    this.$el.remove()
  },
  methods:{
    editOrUnlock(){if(this.editable)return this.select('edit');this.pendingEdit={id:this.id,context:{...this.selectedContext},fields:this.target.hasAttribute('data-copy-fields')?JSON.parse(this.target.getAttribute('data-copy-fields')):undefined};this.dismiss();this.password='';this.passwordError='';this.passwordOpen=true;this.$nextTick(()=>this.$refs.passwordInput.focus())},
    cancelPassword(){if(this.passwordBusy)return;this.passwordOpen=false;this.password='';this.passwordError='';this.pendingEdit=null},
    async unlock(){this.passwordBusy=true;this.passwordError='';try{await unlockCopyWithPassword(this.password);const edit=this.pendingEdit;this.passwordOpen=false;this.password='';this.pendingEdit=null;selectCopyBlock(edit.id,'edit',edit.context,edit.fields)}catch(error){this.passwordError=error.message}finally{this.passwordBusy=false}},
    logout(){if(lockCopyEditing())this.dismiss()},
    dismiss(restoreFocus=false){
      if(restoreFocus&&this.$refs.menu?.contains(document.activeElement)&&this.previousFocus?.isConnected)this.previousFocus.focus({preventScroll:true})
      this.target=null;this.rect=null
    },
    measureTarget(target){
      if(!target?.isConnected)return null
      const frame=target.closest('.phone-frame');if(!frame)return null
      const box=target.getBoundingClientRect(),bounds=frame.getBoundingClientRect()
      const left=Math.max(0,box.left,bounds.left),right=Math.min(window.innerWidth,box.right,bounds.right),top=Math.max(0,box.top,bounds.top),bottom=Math.min(window.innerHeight,box.bottom,bounds.bottom)
      return right>left&&bottom>top?{left,top,width:right-left,height:bottom-top}:null
    },
    clampMenu(){
      if(!this.$refs.menu)return
      const menu=this.$refs.menu.getBoundingClientRect()
      this.menuX=Math.max(8,Math.min(this.menuX,window.innerWidth-menu.width-8));this.menuY=Math.max(8,Math.min(this.menuY,window.innerHeight-menu.height-8))
    },
    open(target,x,y,detail={}){
      const rect=this.measureTarget(target);if(!rect)return
      this.previousFocus=document.activeElement;this.lastTarget=target;this.target=target;this.hitContext=detail
      this.rect=rect;this.menuX=Math.max(8,x);this.menuY=Math.max(8,y)
      this.$nextTick(()=>{
        if(this.target!==target||!this.$refs.menu)return
        this.clampMenu()
        this.$refs.menu.querySelector('button:not(:disabled)')?.focus({preventScroll:true})
      })
    },
    select(tab){
      if(!this.target)return
      const fields=this.target.hasAttribute('data-copy-fields')?JSON.parse(this.target.getAttribute('data-copy-fields')):undefined
      const opened=selectCopyBlock(this.id,tab,{...this.selectedContext},fields)
      this.dismiss()
      if(opened)this.$nextTick(()=>{const panel=document.querySelector('.copy-panel');(panel?.querySelector('input')||panel?.querySelector('textarea')||panel?.querySelector('button'))?.focus({preventScroll:true})})
    },
    navigateMenu(event){
      if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return
      event.preventDefault();event.stopPropagation()
      const buttons=Array.from(this.$refs.menu.querySelectorAll('button:not(:disabled)')),index=buttons.indexOf(document.activeElement)
      const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length
      buttons[next]?.focus()
    },
    nextBlock(){
      const blocks=Array.from(document.querySelectorAll('.review-layout .phone-frame [data-copy-block]')).filter(element=>element.getClientRects().length)
      const target=blocks[(blocks.indexOf(this.lastTarget)+1)%blocks.length]
      if(!target)return
      target.scrollIntoView({block:'nearest'})
      requestAnimationFrame(()=>{if(!target.isConnected)return;const box=target.getBoundingClientRect();this.open(target,box.left+12,box.top+12)})
    }
  }
}
</script>
<style>
.copy-password-backdrop{position:fixed;inset:0;z-index:20010;background:#20293666;display:grid;place-items:center;padding:20px}.copy-password{width:360px;max-width:100%;box-sizing:border-box;background:#fff;border:1px solid #e4e7ec;border-radius:14px;padding:24px;box-shadow:0 20px 80px #18243533;color:#475160}.copy-password h2{margin:0 0 22px;font:600 18px/26px inherit}.copy-password label{display:block;font-size:12px;margin-bottom:7px}.copy-password input{width:100%;box-sizing:border-box;min-height:42px;border:1px solid #dce1e8;border-radius:7px;padding:10px 12px;font:14px/20px inherit;outline-color:#d55f50}.copy-password p{font-size:11px;color:#8b94a1;line-height:18px}.copy-password p.copy-password__error{color:#bd483e}.copy-password footer{display:flex;justify-content:flex-end;gap:8px;margin-top:22px}.copy-password button{border:1px solid #e2e5e9;border-radius:7px;padding:9px 15px;background:#fff;color:#697586;font-size:12px;cursor:pointer}.copy-password button.copy-password__primary{background:#d65146;color:#fff;border-color:#d65146}.copy-password button:disabled{opacity:.5;cursor:default}
.copy-context-layer{font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft Yahei",sans-serif}
.copy-context-outline{position:fixed;pointer-events:none;box-sizing:border-box;border:1.5px solid #d56b60;border-radius:5px;z-index:20000;background:#de685009}
.copy-context-menu{position:fixed;z-index:20001;box-sizing:border-box;width:224px;max-width:calc(100vw - 16px);padding:5px;background:#fff;border:1px solid #e6e2e1;border-radius:9px;box-shadow:0 6px 24px #28314422}
.copy-context-menu__label{padding:7px 10px 8px;color:#9198a3;font-size:10px;line-height:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border-bottom:1px solid #f0eef0;margin-bottom:4px}
.copy-context-menu__status{margin:5px 10px;color:#a07a62;font-size:10px;line-height:17px}
.copy-context-menu button{display:block;width:100%;min-height:36px;padding:8px 10px;border:0;border-radius:5px;background:transparent;color:#586373;font-family:inherit;font-size:12px;line-height:20px;text-align:left;cursor:pointer}
.copy-context-menu button:hover,.copy-context-menu button:focus-visible{outline:none;background:#fff2ef;color:#c24c40}
.copy-context-menu button:disabled{opacity:.5;cursor:default}
.copy-context-picker{position:fixed;bottom:18px;left:185px;z-index:20001;background:#fff;border:1px solid #e5e8ec;border-radius:7px;box-shadow:0 2px 10px #25283b0c;color:#79828e;padding:8px 11px;font-family:inherit;font-size:10px;line-height:16px;cursor:pointer}
.copy-context-picker span{margin-left:8px;color:#bd6d61}.copy-context-picker:focus-visible{outline:2px solid #cd665a;outline-offset:2px}
@media(max-width:720px){.copy-context-picker{left:12px;bottom:12px}}
</style>
