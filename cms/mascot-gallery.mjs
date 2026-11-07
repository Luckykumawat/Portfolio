import {loadMascots} from './mascot-store.mjs';
import {escapeHTML as e,localAsset} from './model.mjs';
import {attachCustomMascot} from '../custom-mascot.mjs';
import {mountLegacyMascots} from '../mascot.js';
const grid=document.querySelector('.mascot-grid'),results=document.querySelector('.mascot-results');
const controllers=[];
try{
  const rows=await loadMascots();
  document.getElementById('mascot-introduction').textContent=`${rows.length} little personalities. Move your cursor and watch them follow. Click or tap any character for a surprise.`;
  grid.innerHTML=rows.map(row=>`<article class="mascot-card ${row.is_original?'original-mascot-card':''} ${row.is_new?'friendly-mascot-card':''}" data-category="${e(row.category)}" data-original="${row.is_original}" data-new="${row.is_new}">
    ${row.is_new||row.is_original?`<span class="original-mascot-badge">${row.is_new?'NEW ':''}${row.is_original?'ORIGINAL':'CHARACTER'}</span>`:''}
    <button type="button" ${row.controller==='legacy'?'class="portfolio-mascot"':''} aria-label="Change ${e(row.title)}'s expression" data-id="${e(row.id)}" data-directions="${e(localAsset(row.directions_url))}" data-reactions="${e(localAsset(row.reactions_url))}" hidden>${row.controller==='legacy'?'<span class="mascot-squash" aria-hidden="true"><span class="mascot-layer mascot-directions"></span><span class="mascot-layer mascot-reactions"></span></span>':''}</button>
    <h2>${e(row.title)}</h2><p>${e(row.subtitle||row.category)}</p><span class="mascot-load-status" role="status">Loading ${e(row.title)}…</span></article>`).join('')||'<p>No published mascots yet.</p>';
  mountLegacyMascots(grid);
  const start=button=>{
    const row=rows.find(r=>r.id===button.dataset.id),status=button.parentElement.querySelector('.mascot-load-status');
    const controller=attachCustomMascot(button,{directions:button.dataset.directions,reactions:button.dataset.reactions,label:row.title});controllers.push(controller);
    controller.ready.then(()=>{button.hidden=false;status.hidden=true;}).catch(()=>{status.textContent='Artwork could not load. Please refresh to retry.';});
  };
  const custom=[...grid.querySelectorAll('button:not(.portfolio-mascot)')];
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){start(entry.target.querySelector('button'));observer.unobserve(entry.target);}},{rootMargin:'240px'});custom.forEach(button=>observer.observe(button.parentElement));window.addEventListener('pagehide',event=>{if(!event.persisted)observer.disconnect();});}else custom.forEach(start);
  function filter(category='All'){
    let count=0;grid.querySelectorAll('.mascot-card').forEach(card=>{card.hidden=!(category==='All'||category==='New'&&card.dataset.new==='true'||category==='Originals'&&card.dataset.original==='true'||card.dataset.category===category);if(!card.hidden)count++;});
    results.textContent=`${count} ${count===1?'character':'characters'} to meet`;
  }
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));filter(button.dataset.filter);}));filter();
}catch(error){grid.innerHTML='<p role="alert">Characters could not load. Please refresh in a moment.</p>';results.textContent='Mascot gallery unavailable.';console.error(error.message);}
window.addEventListener('pagehide',event=>{if(!event.persisted)controllers.forEach(c=>c.destroy());});
