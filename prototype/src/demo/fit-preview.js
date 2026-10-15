// Fit the Demo display surface while keeping the phone's original layout units.
export default {
  inserted(stage) {
    let frame,queued=false
    const number=value=>Number.parseFloat(value)||0
    const observer=new ResizeObserver(()=>schedule())
    const update=()=>{
      queued=false
      const next=stage.querySelector('.phone-frame')
      if(next!==frame){if(frame)observer.unobserve(frame);frame=next;if(frame)observer.observe(frame)}
      if(!frame||!frame.offsetWidth||!frame.offsetHeight)return
      const style=getComputedStyle(stage),caption=stage.querySelector('.phone-caption')
      const captionStyle=caption&&getComputedStyle(caption)
      const captionHeight=captionStyle&&captionStyle.display!=='none'?caption.offsetHeight+number(captionStyle.marginTop)+number(captionStyle.marginBottom):0
      const width=stage.clientWidth-number(style.paddingLeft)-number(style.paddingRight)
      const height=stage.clientHeight-number(style.paddingTop)-number(style.paddingBottom)-captionHeight
      const scale=Math.floor(Math.max(0,Math.min(1,width/frame.offsetWidth,height/frame.offsetHeight))*10000)/10000
      const value=String(scale)
      if(stage.style.getPropertyValue('--demo-preview-scale')!==value)stage.style.setProperty('--demo-preview-scale',value)
    }
    const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(update)}}
    const mutations=new MutationObserver(schedule)
    observer.observe(stage)
    mutations.observe(stage,{childList:true,subtree:true})
    window.addEventListener('resize',schedule)
    stage.__previewFitCleanup=()=>{observer.disconnect();mutations.disconnect();window.removeEventListener('resize',schedule)}
    schedule()
  },
  unbind(stage){if(stage.__previewFitCleanup)stage.__previewFitCleanup();delete stage.__previewFitCleanup}
}
