import {createMascotManager} from './mascots.mjs';
import {CMS_CONFIG} from '../cms/config.mjs';
import {getClient,isConfigured,isAdmin,loadSnapshot,loadAdminContent,saveItem,deleteItem,saveProfile,importSnapshot,uploadImage} from '../cms/content-store.mjs';
import {escapeHTML as e,localAsset,validateItem,validateProfile,sortItems} from '../cms/model.mjs';
const $=id=>document.getElementById(id);
const labels={overview:'Overview',project:'Projects',service:'Our features',software:'Software',photo:'Photoshoot',profile:'Profile',settings:'Connection',mascot:'Mascots'};
const singular={project:'project',service:'feature',software:'software',photo:'photo'};
let bundle={items:[],profile:null},section='overview',mode='preview',verified=false,editorItem=null,editorKind='project',baseline='',uploading=0,toastTimer;
const canWrite=()=>mode==='live'&&verified;
const mascotManager=createMascotManager({canWrite,confirmAction,toast});
const attrs=value=>e(value??'');
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,5000);}
function showLogin(message=''){$('studio').hidden=true;$('login-screen').hidden=false;$('connection-message').hidden=!message;$('connection-message').textContent=message;$('login-form').hidden=!isConfigured();}
function plain(message){return e(message?.message||String(message));}
function badge(row){return `<span class="pill ${row.published?'':'draft'}">${row.published?'Published':'Draft'}</span>`;}
function thumb(row){const src=localAsset(row.image_url,'../');return src?`<img class="content-thumb" src="${e(src)}" alt="${e(row.alt||row.title)}" loading="lazy">`:'<span class="content-thumb thumb-placeholder" aria-hidden="true">✧</span>';}
function field(name,label,value='',{type='text',wide=false,help='',required=false}={}){
 return `<label class="${wide?'field-wide':''}">${e(label)}${type==='textarea'?`<textarea name="${name}" ${required?'required':''}>${e(value)}</textarea>`:`<input name="${name}" type="${type}" value="${attrs(value)}" ${required?'required':''} ${name==='title'?'maxlength="180"':''}>`}${help?`<small>${e(help)}</small>`:''}</label>`;
}
function select(name,label,value,options,wide=false){return `<label class="${wide?'field-wide':''}">${e(label)}<select name="${name}">${options.map(([v,text])=>`<option value="${v}" ${v===value?'selected':''}>${e(text)}</option>`).join('')}</select></label>`;}
function check(name,label,value=false){return `<label class="check-field"><input type="checkbox" name="${name}" ${value?'checked':''}>${e(label)}</label>`;}
function imageField(name,label,value='',multiple=false){return `<label class="field-wide">${e(label)}<span class="upload-row">${multiple?`<textarea name="${name}" placeholder="One image URL per line">${e(value)}</textarea>`:`<input name="${name}" value="${attrs(value)}" placeholder="https://… or image/filename.webp">`}<button class="upload-button" type="button" data-upload="${name}" ${canWrite()?'':'disabled'}>${multiple?'Upload images':'Upload image'}</button><input hidden type="file" data-file="${name}" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" ${multiple?'multiple':''}></span><small>${multiple?'One URL per line. ':''}JPG, PNG, WebP, AVIF or GIF · up to 8 MB per image.</small></label>`;}
function formValues(form){const data=Object.fromEntries(new FormData(form));for(const box of form.querySelectorAll('input[type=checkbox]'))data[box.name]=box.checked;return data;}
function editorValues(){const values=formValues($('editor-form'));values.kind=editorKind;values.tags=String(values.tags||'').split(',').map(s=>s.trim()).filter(Boolean);values.gallery=String(values.gallery||'').split('\n').map(s=>s.trim()).filter(Boolean);return values;}
function dirty(){return $('editor').open&&JSON.stringify(formValues($('editor-form')))!==baseline;}
async function confirmAction(title,message,accept='Delete item'){
 const dialog=$('confirm-dialog');$('confirm-title').textContent=title;$('confirm-message').textContent=message;$('confirm-accept').textContent=accept;dialog.showModal();
 return new Promise(resolve=>{
  const finish=value=>{dialog.close();$('confirm-accept').removeEventListener('click',yes);$('confirm-cancel').removeEventListener('click',no);dialog.removeEventListener('cancel',cancel);resolve(value);};
  const yes=()=>finish(true),no=()=>finish(false),cancel=event=>{event.preventDefault();finish(false);};
  $('confirm-accept').addEventListener('click',yes);$('confirm-cancel').addEventListener('click',no);dialog.addEventListener('cancel',cancel);
 });
}
async function closeEditor(){if(uploading)return;if(dirty()&&!await confirmAction('Discard these changes?','Your unsaved changes will be lost.','Discard changes'))return;$('editor').close();}
$('close-editor').addEventListener('click',closeEditor);$('cancel-editor').addEventListener('click',closeEditor);
$('editor').addEventListener('cancel',event=>{event.preventDefault();closeEditor();});
window.addEventListener('beforeunload',event=>{if(dirty()||uploading){event.preventDefault();event.returnValue='';}});
function mount(){
 $('login-screen').hidden=true;$('studio').hidden=false;$('preview-banner').hidden=mode!=='preview';
 $('account-name').textContent=bundle.profile?.data?.name||'Portfolio owner';$('account-status').textContent=mode==='preview'?'Read-only preview':'Signed-in admin';
 $('sign-out').textContent=mode==='preview'?'Exit preview':'Sign out';render();
}
function navigate(next){section=next;render();}
function render(){
 mascotManager.leave();
 $('breadcrumb').textContent=labels[section];document.querySelectorAll('[data-section]').forEach(button=>button.setAttribute('aria-current',button.dataset.section===section?'page':'false'));
 $('page-title').textContent=section==='overview'?'Your portfolio, at a glance.':section==='settings'?'Keep everything connected.':section==='profile'?'The person behind the work.':labels[section];
 $('page-eyebrow').textContent=section==='overview'?'A PLACE FOR YOUR PROGRESS':'YOUR PORTFOLIO, MADE PERSONAL';
 $('page-description').textContent=({overview:'Good work deserves a good home. Keep yours fresh.',project:'Projects, progress, and the things you’re proud to share.',service:'Shape the services you offer and the order they appear.',software:'Give the tools you build a place to shine.',photo:'Your moments and details, one frame at a time.',profile:'Update your story, skills, photo, and contact details.',mascot:'Upload sprite sheets, preview expressions, and manage your characters.',settings:'Connect your workspace and bring your existing content along.'})[section];
 $('page-actions').innerHTML=singular[section]?`<button type="button" class="primary" data-action="add" data-kind="${section}">+ Add ${singular[section]}</button>`:section==='overview'?'<button type="button" class="primary" data-action="add" data-kind="project">+ Add project</button>':'';
 if(section==='mascot'){mascotManager.render();return;}
 if(section==='overview')renderOverview();else if(section==='profile')renderProfile();else if(section==='settings')renderSettings();else renderList();
}
function renderOverview(){
 const counts=['project','service','software','photo'].map(kind=>({kind,count:bundle.items.filter(r=>r.kind===kind).length}));
 const published=bundle.items.filter(r=>r.published).length;
 const recent=[...bundle.items].filter(r=>r.kind==='project'||r.kind==='software').sort((a,b)=>String(b.updated_at||'').localeCompare(String(a.updated_at||''))).slice(0,5);
 const featured=sortItems(bundle.items.filter(r=>r.featured),true).slice(0,4);
 const focus=bundle.items.find(r=>r.current_focus&&r.work_status==='in_progress');
 $('content').innerHTML=`<div class="stats">${counts.map(({kind,count},i)=>`<div class="stat-card"><div class="stat-top"><span>${labels[kind]}</span><span class="stat-icon">${['▤','✧','⌘','▧'][i]}</span></div><p class="stat-number">${count}</p><small>${bundle.items.filter(r=>r.kind===kind&&r.published).length} published</small></div>`).join('')}</div>
 <div class="overview-grid"><div><section class="panel"><div class="panel-heading"><div><h2>Your latest work</h2><p>A fresh look at what’s in your portfolio.</p></div><button type="button" data-section="project">View projects ↗</button></div>${recent.length?recent.map(row=>`<div class="content-row">${thumb(row)}<div class="row-main"><p class="row-title">${e(row.title)}</p><p class="row-subtitle">${e(row.subtitle||labels[row.kind])}</p></div>${badge(row)}<button type="button" class="text-button" data-action="edit" data-id="${row.id}">Edit</button></div>`).join(''):'<div class="empty-state">Your next project starts here. Add one, or import your existing content from Connection.</div>'}</section>
 <section class="panel"><div class="panel-heading"><div><h2>On your homepage</h2><p>Your featured work, in display order.</p></div><button type="button" data-section="project">Manage ↗</button></div>${featured.length?featured.map(row=>`<div class="content-row">${thumb(row)}<div class="row-main"><p class="row-title">${e(row.title)}</p><p class="row-subtitle">Position ${Number(row.homepage_order)+1}</p></div>${badge(row)}</div>`).join(''):'<div class="empty-state">Choose Featured on homepage in a project editor.</div>'}</section></div>
 <div><section class="panel"><div class="panel-heading"><h2>A little update goes a long way.</h2></div><div class="quick-actions"><button type="button" data-action="add" data-kind="project"><div>Add a new project<small>Something new worth sharing.</small></div><span>↗</span></button><button type="button" data-action="add" data-kind="photo"><div>Share a new photo<small>Bring your gallery to life.</small></div><span>↗</span></button><button type="button" data-section="profile"><div>Refresh your profile<small>Let your story grow with you.</small></div><span>↗</span></button></div></section>
 <section class="focus-panel"><p class="eyebrow">IN THE MAKING</p><h2>${e(focus?.title||'Make space for your next big thing.')}</h2><p>${e(focus?focus.description.slice(0,180)+'…':'Mark a project In progress and choose Show in current work to feature it here.')}</p><button type="button" ${focus?`data-action="edit" data-id="${focus.id}"`:'data-action="add" data-kind="project"'}>Update current work ↗</button></section></div></div>
 <p class="muted" style="font-size:10px">${published} published entries · ${bundle.items.length-published} drafts</p>`;
}
function renderList(){
 $('content').innerHTML=`<div class="toolbar"><input class="search" id="search" type="search" aria-label="Search ${e(labels[section])}" placeholder="Search ${labels[section].toLowerCase()}…"><select id="visibility-filter" aria-label="Filter publication status"><option value="all">All entries</option><option value="published">Published</option><option value="draft">Drafts</option>${section==='project'||section==='software'?'<option value="featured">Homepage featured</option><option value="current">Current work</option><option value="github">GitHub projects</option><option value="real">Real work</option>':''}</select></div><div id="records" class="records ${section==='photo'?'photo-records':''}"></div>`;
 const update=()=>{
  const search=$('search').value.trim().toLowerCase(),filter=$('visibility-filter').value;
  const rows=sortItems(bundle.items.filter(row=>row.kind===section)).filter(row=>`${row.title} ${row.description} ${row.album}`.toLowerCase().includes(search)).filter(row=>filter==='all'||filter==='published'&&row.published||filter==='draft'&&!row.published||filter==='featured'&&row.featured||filter==='current'&&row.current_focus||filter==='github'&&row.category==='github'||filter==='real'&&row.category==='real');
  $('records').innerHTML=rows.length?rows.map(row=>`<article class="record-card">${thumb(row)}<div class="row-main"><h2>${e(row.title)}</h2><p class="muted">${e(section==='photo'?row.album:row.subtitle||row.description.slice(0,100))}</p><div class="record-tags">${badge(row)}${row.featured?'<span class="pill">Homepage</span>':''}${row.current_focus?'<span class="pill progress">Current work</span>':''}${row.category==='github'&&section==='project'?'<span class="pill progress">GitHub</span>':''}</div></div><div class="row-actions"><button type="button" data-action="edit" data-id="${row.id}">Edit</button><button type="button" class="delete-button" data-action="delete" data-id="${row.id}" ${canWrite()?'':'disabled'}>Delete</button></div></article>`).join(''):`<div class="empty-state">No ${labels[section].toLowerCase()} found. ${search||filter!=='all'?'Try another search or filter.':'Add your first entry to get started.'}</div>`;
 };
 $('search').addEventListener('input',update);$('visibility-filter').addEventListener('change',update);update();
}
function openEditor(kind,row=null){
 editorKind=kind;editorItem=row;
 const item=row||{title:'',subtitle:'',description:'',category:'real',work_status:'completed',published:false,featured:false,current_focus:false,show_on_projects:kind==='project',sort_order:bundle.items.filter(r=>r.kind===kind).length,homepage_order:0,tags:[],gallery:[],image_url:'',live_url:'',github_url:'',album:'',alt:''};
 $('editor-title').textContent=`${row?'Edit':'Add'} ${singular[kind]}`;
 let fields=field('title',kind==='service'?'Feature name':'Title',item.title,{wide:true,required:true});
 if(kind==='project'||kind==='software')fields+=field('subtitle','Project type / subtitle',item.subtitle,{wide:true});
 if(kind!=='photo')fields+=field('description','Description',item.description,{type:'textarea',wide:true});
 fields+=imageField('image_url',kind==='photo'?'Photo':'Cover image',item.image_url);
 fields+=field('alt','Image description (alt text)',item.alt,{wide:true,help:'Describe the image for people using screen readers.'});
 if(kind==='project'||kind==='software')fields+=field('live_url',kind==='software'?'Demo / download link':'Live website link',item.live_url)+field('github_url','GitHub repository link',item.github_url)+select('category','Project category',item.category,[['real','Real / client work'],['github','GitHub projects']])+select('work_status','Work status',item.work_status,[['upcoming','Upcoming'],['in_progress','In progress'],['completed','Completed']])+field('tags','Technologies / tags',(item.tags||[]).join(', '),{wide:true,help:'Separate tags with commas.'})+imageField('gallery','Additional screenshots',(item.gallery||[]).join('\n'),true)+field('homepage_order','Homepage order',item.homepage_order,{type:'number',help:'Lower numbers appear first.'});
 if(kind==='photo')fields+=field('album','Album',item.album,{wide:true});
 fields+=field('sort_order','Display order',item.sort_order,{type:'number',help:'Lower numbers appear first.'});
 fields+=`<div class="field-wide checks">${check('published','Published — visible to visitors',item.published)}${kind==='project'||kind==='software'?check('featured','Featured on homepage',item.featured)+check('current_focus','Show in current work (requires In progress)',item.current_focus)+check('show_on_projects','Show on the Projects page',item.show_on_projects):''}</div>`;
 if(mode==='preview')fields+='<p class="field-wide muted" style="font-size:11px">You can explore the fields and preview the layout. Saving and uploads are disabled in this preview.</p>';
 $('editor-fields').innerHTML=fields;$('editor-error').textContent='';$('editor-preview').hidden=true;$('save-item').disabled=!canWrite();baseline=JSON.stringify(formValues($('editor-form')));$('editor').showModal();
}
$('preview-item').addEventListener('click',()=>{
 const value=editorValues();const image=localAsset(value.image_url,'../');$('editor-preview').innerHTML=`${image?`<img src="${e(image)}" alt="${e(value.alt||value.title)}">`:''}<h3>${e(value.title||'Untitled')}</h3><p>${e(value.subtitle||'')}</p><p>${e(value.description||'')}</p>`;$('editor-preview').hidden=false;
});
$('editor-form').addEventListener('submit',async event=>{
 event.preventDefault();if(!canWrite()||uploading)return;$('editor-error').textContent='';$('save-item').disabled=true;
 try{const row=await saveItem(validateItem(editorValues()),editorItem);const index=bundle.items.findIndex(item=>item.id===row.id);if(index===-1)bundle.items.push(row);else bundle.items[index]=row;baseline=JSON.stringify(formValues($('editor-form')));$('editor').close();render();toast(row.published?'Saved and published to your portfolio.':'Draft saved.');}
 catch(error){$('editor-error').textContent=error.message;}finally{$('save-item').disabled=!canWrite();}
});
function renderProfile(){
 const p=bundle.profile?.data||{};
 $('content').innerHTML=`<form id="profile-form" class="profile-form"><div class="form-grid">${field('name','Name',p.name,{required:true})}${field('availability','Availability',p.availability)}${field('headline','Headline',p.headline,{wide:true})}${field('bio','Your story',p.bio,{type:'textarea',wide:true})}${imageField('photo_url','Profile photo',p.photo_url)}<h2 class="form-section">SKILLS & EXPERTISE</h2>${field('skills','Skills',p.skills,{type:'textarea'})}${field('expertise','Expertise',p.expertise,{type:'textarea'})}<h2 class="form-section">CONTACT & LINKS</h2>${field('email','Contact email',p.email,{type:'email'})}${field('phone','Phone',p.phone)}${field('linkedin_url','LinkedIn URL',p.linkedin_url)}${field('github_url','GitHub URL',p.github_url)}${field('resume_url','Resume URL',p.resume_url,{wide:true})}<h2 class="form-section">HOMEPAGE INTRODUCTION</h2>${field('home_intro','Introduction',p.home_intro,{type:'textarea',wide:true})}${field('home_description','About your work',p.home_description,{type:'textarea',wide:true})}</div><p class="error" id="profile-error" role="alert"></p><div class="profile-actions">${check('published','Publish profile and contact details',bundle.profile?.published??true)}<button type="submit" class="primary" ${canWrite()?'':'disabled'}>Save profile</button></div></form>`;
 $('profile-form').addEventListener('submit',async event=>{
  event.preventDefault();if(!canWrite()||uploading)return;const button=event.submitter;button.disabled=true;$('profile-error').textContent='';
  try{const values=formValues(event.target);bundle.profile=await saveProfile(validateProfile(values),values.published,bundle.profile);$('account-name').textContent=bundle.profile.data.name;toast('Profile saved.');}catch(error){$('profile-error').textContent=error.message;}finally{button.disabled=!canWrite();}
 });
}
function renderSettings(){
 $('content').innerHTML=`<section class="panel settings-panel"><h2>Your content connection</h2><dl><dt>Provider</dt><dd>Supabase</dd><dt>Project URL</dt><dd>${e(CMS_CONFIG.supabaseUrl||'Not configured yet')}</dd><dt>Admin access</dt><dd>${canWrite()?'Verified':'Read-only preview'}</dd><dt>Existing content</dt><dd>${bundle.items.length} entries</dd></dl>${!isConfigured()?'<div class="notice">Connect your new Supabase project before signing in. Your portfolio continues displaying its existing content until then.</div>':''}<ol><li>Run <a href="../supabase/schema.sql" target="_blank" rel="noopener">schema.sql</a> in your new project’s SQL Editor.</li><li>Create your owner account in Authentication, then run <a href="../supabase/bootstrap-admin.sql" target="_blank" rel="noopener">bootstrap-admin.sql</a> with your email.</li><li>Add the project URL and publishable key to <code>cms/config.mjs</code>.</li><li>Sign in, then import the existing portfolio content below.</li></ol><p class="muted" style="font-size:12px;margin:18px 0">Import adds missing entries using stable IDs. It preserves edits to entries already imported.</p><button type="button" class="primary" data-action="import" ${canWrite()?'':'disabled'}>Import existing content</button><a class="secondary" href="../ADMIN-SETUP.md" target="_blank" rel="noopener">Read setup guide ↗</a></section>`;
}
// Scoped delegation keeps controls working after list/editor rerenders.
document.addEventListener('click',async event=>{
 const button=event.target.closest('button');if(!button)return;
 if(button.dataset.section){navigate(button.dataset.section);return;}
 const action=button.dataset.action;
 if(action==='add')openEditor(button.dataset.kind);
 if(action==='edit'){const row=bundle.items.find(item=>item.id===button.dataset.id);if(row)openEditor(row.kind,row);}
 if(action==='delete'&&canWrite()){
  const row=bundle.items.find(item=>item.id===button.dataset.id);if(!row)return;
  if(await confirmAction('Delete this entry?',`“${row.title}” will be removed from your portfolio.`)){
   button.disabled=true;try{await deleteItem(row.id);bundle.items=bundle.items.filter(item=>item.id!==row.id);render();toast('Entry deleted.');}catch(error){toast(error.message);button.disabled=false;}
  }
 }
 if(action==='import'&&canWrite()){
  if(!await confirmAction('Import your existing content?','This adds missing projects, features, software, photos and profile details. Existing edits are kept.','Import content'))return;
  button.disabled=true;try{await importSnapshot();bundle=await loadAdminContent();render();toast('Existing content imported.');}catch(error){toast(error.message);button.disabled=false;}
 }
 if(button.dataset.upload&&canWrite())button.closest('form').querySelector(`[data-file="${button.dataset.upload}"]`)?.click();
});
document.addEventListener('change',async event=>{
 const input=event.target;if(!input.dataset.file||!input.files.length||!canWrite())return;
 const form=input.closest('form');const name=input.dataset.file;const field=form.elements.namedItem(name);const controls=[...form.querySelectorAll('button')];const previous=controls.map(button=>button.disabled);controls.forEach(button=>button.disabled=true);uploading++;
 const progress=document.createElement('p');progress.className='upload-progress';progress.setAttribute('role','status');progress.textContent='Uploading image…';input.closest('label').after(progress);
 try{
  const urls=[];for(const file of input.files){progress.textContent=`Uploading ${urls.length+1} of ${input.files.length}…`;urls.push(await uploadImage(file));}
  field.value=name==='gallery'?[field.value,...urls].filter(Boolean).join('\n'):urls[0];field.dispatchEvent(new Event('input',{bubbles:true}));progress.textContent='Image uploaded. Save your changes to attach it to this entry.';
  if(form.id==='editor-form'&&editorKind==='photo'&&!form.elements.title.value)form.elements.title.value=input.files[0].name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' ');
 }catch(error){progress.textContent=error.message;progress.classList.add('error');}finally{uploading--;controls.forEach((button,index)=>button.disabled=previous[index]);input.value='';}
});
$('preview-login').addEventListener('click',async()=>{try{bundle=await loadSnapshot();mode='preview';verified=false;mount();}catch(error){$('login-error').textContent=error.message;}});
$('login-form').addEventListener('submit',async event=>{
 event.preventDefault();const button=event.submitter;button.disabled=true;$('login-error').textContent='';
 try{const client=await getClient();const values=Object.fromEntries(new FormData(event.target));const {error}=await client.auth.signInWithPassword({email:values.email,password:values.password});if(error)throw error;await enterLive();event.target.reset();}catch(error){$('login-error').textContent=error.message;showLogin();}finally{button.disabled=false;}
});
async function enterLive(){if(!await isAdmin())throw new Error('This account is not approved as a portfolio admin.');bundle=await loadAdminContent();mode='live';verified=true;mount();}
$('sign-out').addEventListener('click',async()=>{if(mode==='live'){try{await (await getClient()).auth.signOut();}catch(error){toast(error.message);return;}}verified=false;bundle={items:[],profile:null};showLogin(isConfigured()?'':'Connect Supabase to start editing. You can explore the read-only preview below.');});
async function start(){
 if(new URLSearchParams(location.search).get('preview')==='1'){bundle=await loadSnapshot();mode='preview';mount();return;}
 if(!isConfigured()){showLogin('Your Supabase connection is not set up yet. Use the read-only preview to explore your studio.');return;}
 const client=await getClient();const {data,error}=await client.auth.getSession();if(error)throw error;
 client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){verified=false;showLogin();}});
 if(data.session)await enterLive();else showLogin();
}
start().catch(error=>{showLogin();$('login-error').textContent=error.message;});
