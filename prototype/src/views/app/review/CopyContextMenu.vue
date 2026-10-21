<template>
  <div class="copy-context-layer" aria-label="原型协作工具">
    <template v-if="target&&rect">
      <div class="copy-context-outline" :style="outlineStyle"/>
      <div ref="menu" class="copy-context-menu" :style="menuStyle" role="menu" :aria-label="label+'操作'" @keydown="navigateMenu" @contextmenu.prevent>
        <div class="copy-context-menu__label">{{ label }}</div>
        <button v-if="editable" type="button" role="menuitem" tabindex="-1" :disabled="state.busy" @click.stop="select('edit')">编辑文案</button>
        <button type="button" role="menuitem" tabindex="-1" :disabled="state.busy" @click.stop="select('comments')">备注/评论</button>
      </div>
    </template>
    <button v-if="state.connected" class="copy-context-picker" type="button" @click="nextBlock">选择区块 <span>↗</span></button>
  </div>
</template>
<script>
import {copyState,registry,canEdit,selectCopyBlock} from '@/copy/operations-copy'

export default {
  props:{context:{type:Object,required:true}},
  data:()=>({state:copyState,target:null,rect:null,menuX:8,menuY:8}),
  computed:{
    id(){return this.target&&this.target.getAttribute('data-copy-block')},
    label(){return registry.blocks[this.id]?.label||'当前区块'},
    editable(){return canEdit(this.id)&&registry.blocks[this.id]?.fields.length>0},
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
      this.open(target,keyboard?box.left+12:event.clientX,keyboard?box.top+12:event.clientY)
    }
    this.onOutsidePointer=event=>{if(this.target&&!this.$el.contains(event.target))this.dismiss()}
    this.onKey=event=>{
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
    open(target,x,y){
      const rect=this.measureTarget(target);if(!rect)return
      this.previousFocus=document.activeElement;this.lastTarget=target;this.target=target
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
      const opened=selectCopyBlock(this.id,tab,{...this.context},fields)
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
.copy-context-layer{font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft Yahei",sans-serif}
.copy-context-outline{position:fixed;pointer-events:none;box-sizing:border-box;border:1.5px solid #d56b60;border-radius:5px;z-index:20000;background:#de685009}
.copy-context-menu{position:fixed;z-index:20001;box-sizing:border-box;width:224px;max-width:calc(100vw - 16px);padding:5px;background:#fff;border:1px solid #e6e2e1;border-radius:9px;box-shadow:0 6px 24px #28314422}
.copy-context-menu__label{padding:7px 10px 8px;color:#9198a3;font-size:10px;line-height:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border-bottom:1px solid #f0eef0;margin-bottom:4px}
.copy-context-menu button{display:block;width:100%;min-height:36px;padding:8px 10px;border:0;border-radius:5px;background:transparent;color:#586373;font-family:inherit;font-size:12px;line-height:20px;text-align:left;cursor:pointer}
.copy-context-menu button:hover,.copy-context-menu button:focus-visible{outline:none;background:#fff2ef;color:#c24c40}
.copy-context-menu button:disabled{opacity:.5;cursor:default}
.copy-context-picker{position:fixed;bottom:18px;left:185px;z-index:20001;background:#fff;border:1px solid #e5e8ec;border-radius:7px;box-shadow:0 2px 10px #25283b0c;color:#79828e;padding:8px 11px;font-family:inherit;font-size:10px;line-height:16px;cursor:pointer}
.copy-context-picker span{margin-left:8px;color:#bd6d61}.copy-context-picker:focus-visible{outline:2px solid #cd665a;outline-offset:2px}
@media(max-width:720px){.copy-context-picker{left:12px;bottom:12px}}
</style>
