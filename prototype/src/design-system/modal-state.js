const stack=[],isolated=new Map()
let locks=0,bodyStyle=null
export function focusableElements(root){return [...root.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled):not([type=hidden]),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')].filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'&&!el.closest('[inert],[aria-hidden="true"]'))}
export function acquireModal(element,contained){
  const session={element,isolated:[],contained,previousFocus:document.activeElement};let branch=element
  do{const parent=branch.parentElement;if(!parent)break;[...parent.children].filter(s=>s!==branch&&!['SCRIPT','STYLE'].includes(s.tagName)).forEach(s=>{const state=isolated.get(s);if(state)state.count++;else{isolated.set(s,{count:1,previous:s.inert});s.inert=true}session.isolated.push(s)});branch=parent;if(contained)break}while(branch!==document.body)
  if(!contained&&locks++===0){bodyStyle={overflow:document.body.style.overflow,paddingRight:document.body.style.paddingRight};const gutter=innerWidth-document.documentElement.clientWidth,padding=parseFloat(getComputedStyle(document.body).paddingRight)||0;document.body.style.overflow='hidden';if(gutter>0)document.body.style.paddingRight=(padding+gutter)+'px'}stack.push(session);return session
}
export function isTopModal(session){return stack[stack.length-1]===session}
export function releaseModal(session){if(!session||!stack.includes(session))return;stack.splice(stack.indexOf(session),1);session.isolated.forEach(el=>{const s=isolated.get(el);if(s&&--s.count===0){el.inert=s.previous;isolated.delete(el)}});if(!session.contained&&--locks===0&&bodyStyle){Object.assign(document.body.style,bodyStyle);bodyStyle=null}}
export function restoreModalFocus(session){const old=session&&session.previousFocus;if(old&&old.isConnected&&!old.disabled&&!old.closest('[inert]')&&old.getClientRects().length){old.focus();return}const top=stack[stack.length-1];if(top){const el=focusableElements(top.element)[0]||top.element.querySelector('[role="dialog"],[role="alertdialog"]');if(el)el.focus()}}
