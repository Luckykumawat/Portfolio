export function setupServicePreview(services, preview) {
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let active;
  document.body.append(preview);
  const hide = () => { preview.style.opacity='0'; active=null; };
  function show(row, x, y) {
    const url=row?.dataset.preview;
    if (!url) return hide();
    if (active!==row) { preview.style.opacity='0'; active=row; preview.onload=()=>{if(active===row)preview.style.opacity='1';}; preview.src=url; }
    const size=Math.min(280,innerWidth-32, (innerHeight-32)*.75);
    const height=size*4/3;
    preview.style.width=`${size}px`;
    preview.style.left=`${Math.max(16,Math.min(x+28,innerWidth-size-16))}px`;
    preview.style.top=`${Math.max(16,Math.min(y-height/2,innerHeight-height-16))}px`;
    if(preview.complete&&preview.naturalWidth)preview.style.opacity='1';
  }
  services.querySelectorAll('[data-preview]').forEach(row=>{
    const img=new Image();img.src=row.dataset.preview;
  });
  preview.onerror=hide;
  services.addEventListener('pointermove',event=>{if(fine.matches&&event.pointerType!=='touch')show(event.target.closest('[data-preview]'),event.clientX,event.clientY);});
  services.addEventListener('pointerleave',()=>{if(fine.matches)hide();});
  services.addEventListener('focusin',event=>{const row=event.target.closest('[data-preview]');if(row){const rect=row.getBoundingClientRect();show(row,innerWidth-330,rect.top+rect.height/2);}});
  services.addEventListener('focusout',hide);
  services.addEventListener('click',event=>{if(fine.matches)return;const row=event.target.closest('[data-preview]');if(!row||active===row)return hide();const rect=row.getBoundingClientRect();show(row,innerWidth-310,rect.bottom+130);});
  document.addEventListener('pointerdown',event=>{if(!services.contains(event.target))hide();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')hide();});
  window.addEventListener('scroll',()=>{if(active&&document.activeElement===active){const rect=active.getBoundingClientRect();show(active,innerWidth-330,rect.top+rect.height/2);}else hide();},{passive:true});window.addEventListener('resize',hide);
}
