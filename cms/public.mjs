import {loadPublicContent} from './content-store.mjs';
import {escapeHTML as e,safeURL,paragraphs,publicItems,sortItems} from './model.mjs';
const find = id => document.getElementById(id);
const link = (url,label) => {const href=safeURL(url);return href?`<a href="${e(href)}" target="_blank" rel="noopener noreferrer">${e(label)}</a>`:'';};
function projectCard(item,index) {
  const image=safeURL(item.image_url,{image:true});
  const imageHTML=image?`<img src="${e(image)}" alt="${e(item.alt||item.title)}" loading="lazy">`:'';
  const live=safeURL(item.live_url);
  const gallery=(item.gallery||[]).map(url=>safeURL(url,{image:true})).filter(Boolean);
  return `<article class="project cms-project space-y-[2vw]">
    <div class="text lg:flex justify-between items-center"><div class="name font-zen-dots text-[3vw] md:text-[2vw] lg:text-[1.32vw]"><h2>${index+1}. ${e(item.title)}</h2><p>${e(item.subtitle)}</p></div><div class="title lg:w-[40%] text-[2.5vw] md:text-[1.62vw] lg:text-[1vw] mt-[2vw] cms-prose">${paragraphs(item.description)}</div></div>
    ${imageHTML?`<div class="pro-image">${live?`<a href="${e(live)}" target="_blank" rel="noopener noreferrer">${imageHTML}</a>`:imageHTML}</div>`:''}
    <div class="cms-project-meta">${(item.tags||[]).map(tag=>`<span>${e(tag)}</span>`).join('')}${link(item.live_url,'Visit website')}${link(item.github_url,'View on GitHub')}</div>
    ${gallery.length?`<details class="cms-project-gallery"><summary>More images (${gallery.length})</summary><div>${gallery.map(url=>`<a href="${e(url)}" target="_blank" rel="noopener noreferrer"><img src="${e(url)}" alt="${e(item.title)} additional image" loading="lazy"></a>`).join('')}</div></details>`:''}
  </article>`;
}
function renderProjects(id,items) {const node=find(id);if(node)node.innerHTML=items.length?items.map(projectCard).join(''):'<p class="cms-empty">No published projects here yet.</p>';}
function applyProfile(profile,items) {
  const p=profile?.published?profile.data||{}:{};
  document.querySelectorAll('[data-profile]').forEach(node=>{node.textContent=p[node.dataset.profile]||'';});
  document.querySelectorAll('[data-profile-image]').forEach(node=>{const src=safeURL(p[node.dataset.profileImage],{image:true});node.hidden=!src;if(src)node.src=src;});
  document.querySelectorAll('[data-contact]').forEach(node=>{
    const kind=node.dataset.contact;let href='',label='';
    if(kind==='email'&&p.email){href=`mailto:${p.email}`;label=`Email: ${p.email}`;}
    if(kind==='phone'&&p.phone){href=`tel:${p.phone.replace(/[^+\d]/g,'')}`;label=`Phone: ${p.phone}`;}
    if(kind==='linkedin'){href=safeURL(p.linkedin_url);label='LINKEDIN';}
    node.hidden=!href;if(href){node.href=href;node.textContent=label;}
  });
  const intro=find('cms-profile-intro');
  if(intro)intro.innerHTML=profile?.published?`<h1 class="text-[8vw] md:text-[6vw] font-zen-dots mb-4">Profile</h1><h2 class="text-[3vw] md:text-[1.3vw] font-zen-dots mb-4">${e(p.name)}</h2><div class="cms-prose"><p>${e(p.headline)}</p>${paragraphs(p.bio)}</div>${p.resume_url?`<p class="cms-resume">${link(p.resume_url,'View resume')}</p>`:''}`:'<p class="cms-empty">Profile is not published yet.</p>';
  for(const [id,category] of [['cms-profile-real','real'],['cms-profile-github','github']]){
    const node=find(id);if(node)node.innerHTML=items.filter(item=>(item.kind==='project'||item.kind==='software')&&item.category===category&&item.show_on_projects).map(item=>`<div><h2>${e(item.title)}</h2><p>${e(item.subtitle)}</p></div>`).join('');
  }
}
try {
  const bundle=await loadPublicContent();
  const items=publicItems(bundle.items);
  applyProfile(bundle.profile,items);
  const projects=items.filter(item=>item.kind==='project'||item.kind==='software');
  renderProjects('cms-home-projects',sortItems(projects.filter(item=>item.featured),true));
  renderProjects('cms-real-projects',projects.filter(item=>item.show_on_projects&&item.category==='real'));
  renderProjects('cms-github-projects',projects.filter(item=>item.show_on_projects&&item.category==='github'));
  renderProjects('cms-software',items.filter(item=>item.kind==='software'));
  const current=find('cms-current-work');if(current){const active=projects.filter(item=>item.current_focus&&item.work_status==='in_progress');current.hidden=!active.length;current.innerHTML=active.map(item=>`<article class="cms-current-card"><p class="cms-eyebrow">CURRENT FOCUS</p><h2 class="font-zen-dots text-[3vw] md:text-[2vw]">${e(item.title)}</h2><div class="cms-prose">${paragraphs(item.description)}</div>${link(item.live_url,'Explore project')}</article>`).join('');}
  const services=find('cms-services');if(services){const rows=items.filter(item=>item.kind==='service');services.innerHTML=rows.length?rows.map(item=>`<article class="service-item group font-bold font-zen-dots border-black border-[1px] hover:bg-black hover:text-white transition-all duration-300 p-6 rounded-xl cursor-pointer" data-preview="${e(safeURL(item.image_url,{image:true}))}"><h3>${e(item.title)}</h3>${item.description?`<p class="cms-service-description">${e(item.description)}</p>`:''}</article>`).join(''):'<p class="cms-empty">Services will appear here when published.</p>';
    const preview=find('hover-img');if(preview){services.addEventListener('pointermove',event=>{const row=event.target.closest('[data-preview]');const url=row?.dataset.preview;preview.style.opacity=url?'1':'0';if(url){preview.src=url;preview.style.left=`${event.clientX}px`;preview.style.top=`${event.clientY}px`;}});services.addEventListener('pointerleave',()=>{preview.style.opacity='0';});}
  }
} catch(error) {
  document.querySelectorAll('[id^="cms-"]').forEach(node=>{if(!node.id.includes('profile-'))node.innerHTML='<p class="cms-empty" role="alert">Content could not load. Please refresh in a moment.</p>';});
  console.error('Portfolio content could not load:',error.message);
}
