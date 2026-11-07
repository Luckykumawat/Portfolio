import {loadMascots,saveMascot,deleteMascot} from '../cms/mascot-store.mjs';
import {uploadImage} from '../cms/content-store.mjs';
import {escapeHTML as e,localAsset} from '../cms/model.mjs';
import {MASCOT_CATEGORIES,validateMascot,validateSheetDimensions} from '../cms/mascot-model.mjs';
import {attachCustomMascot,EXPRESSION_NAMES} from '../custom-mascot.mjs';

export function createMascotManager({canWrite,confirmAction,toast}){
  let rows=[],current=null,baseline='',busy=false,controller=null,previewVersion=0,active=false;
  const dialog=document.createElement('dialog');dialog.id='mascot-editor';dialog.setAttribute('aria-labelledby','mascot-editor-title');document.body.append(dialog);
  const input=(name,label,value='',extra='')=>`<label>${e(label)}<input name="${name}" value="${e(value)}" ${extra}></label>`;
  const checkbox=(name,label,value)=>`<label class="check-field"><input type="checkbox" name="${name}" ${value?'checked':''}>${e(label)}</label>`;
  const sheet=(name,label,value)=>`<label class="field-wide">${label}<span class="upload-row"><input name="${name}" value="${e(value||'')}" placeholder="https://… or mascots/character-${name==='directions_url'?'directions':'reactions'}.webp"><button type="button" class="upload-button" data-sheet-upload="${name}" ${canWrite()?'':'disabled'}>Upload sheet</button><input type="file" data-sheet-file="${name}" accept="image/png,image/webp" hidden></span><small>PNG or WebP · square 3 × 3 grid · up to 8 MB</small></label>`;
  function values(){const form=dialog.querySelector('form'),data=Object.fromEntries(new FormData(form));for(const box of form.querySelectorAll('[type=checkbox]'))data[box.name]=box.checked;if(!data.slug)data.slug=data.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');return data;}
  function serialized(){return JSON.stringify(values());}
  function cleanup(){previewVersion++;controller?.destroy();controller=null;}
  function isDirty(){return dialog.open&&serialized()!==baseline;}
  async function close(){if(busy)return;if(isDirty()&&!await confirmAction('Discard mascot changes?','Unsaved mascot details will be lost.','Discard changes'))return;cleanup();dialog.close();}
  function setBusy(value){busy=value;dialog.setAttribute('aria-busy',String(value));dialog.querySelector('.editor-fields').inert=value;dialog.querySelectorAll('button').forEach(b=>{b.disabled=value||(!canWrite()&&(b.type==='submit'||b.dataset.sheetUpload));});}
  function error(message){dialog.querySelector('[data-mascot-error]').textContent=message;}
  function loadImage(url){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve({width:image.naturalWidth,height:image.naturalHeight});image.onerror=()=>reject(new Error('A sprite sheet could not load. Check both image URLs.'));image.src=url;});}
  async function checkSheets(data){
    const a=localAsset(data.directions_url,'../'),b=localAsset(data.reactions_url,'../');
    if(!a||!b)throw new Error('Upload both directions and reactions sheets to preview or publish.');
    const [first,second]=await Promise.all([loadImage(a),loadImage(b)]);validateSheetDimensions(first,second);return {a,b,dimensions:first};
  }
  async function preview(){
    cleanup();const version=previewVersion;error('');setBusy(true);
    try{
      const data=validateMascot(values()),{a,b,dimensions}=await checkSheets(data);if(version!==previewVersion)return;
      const area=dialog.querySelector('[data-mascot-preview]');area.hidden=false;
      area.innerHTML=`<h3>Interactive preview</h3><p>Move your cursor around the character. Click it to change expressions.</p><button type="button" data-mascot-play></button><p>${dimensions.width} × ${dimensions.height} · 9 directions + 9 reactions</p><div class="mascot-expression-controls">${EXPRESSION_NAMES.map((name,i)=>`<button class="secondary" type="button" data-expression-index="${i}">${e(name)}</button>`).join('')}</div><div class="mascot-sheet-previews"><figure><img src="${e(a)}" alt="Directions sheet: up-left, up, up-right, left, center, right, down-left, down, down-right"><figcaption>Directions · reading order: ↖ ↑ ↗ / ← center → / ↙ ↓ ↘</figcaption></figure><figure><img src="${e(b)}" alt="Nine reaction frames"><figcaption>Reactions · ${EXPRESSION_NAMES.join(', ')}</figcaption></figure></div>`;
      controller=attachCustomMascot(area.querySelector('[data-mascot-play]'),{directions:a,reactions:b,label:data.title});await controller.ready;
      if(data.controller==='legacy')area.querySelector('p').textContent='Move your cursor or choose a frame below. Existing legacy mascots keep their original click sequence on the public gallery.';
    }catch(err){error(err.message);}finally{setBusy(false);}
  }
  function open(row=null){
    cleanup();current=row;const item=row||{title:'',slug:'',subtitle:'',category:'Animals',controller:'original',is_original:true,is_new:true,sort_order:rows.length,published:false};
    dialog.innerHTML=`<form><header class="editor-header"><div><p class="eyebrow">CHARACTER STUDIO</p><h2 id="mascot-editor-title">${row?'Edit':'Add'} mascot</h2></div><button type="button" class="icon-button" data-mascot-close aria-label="Close mascot editor">×</button></header><div class="editor-fields">${input('title','Character name',item.title,'required maxlength="180"')}${input('slug','Character ID',item.slug,'placeholder="Auto-generated from name"')}<label class="field-wide">Description<input name="subtitle" value="${e(item.subtitle)}" placeholder="For example: Otter · Animals"></label><label>Category<select name="category">${MASCOT_CATEGORIES.map(c=>`<option ${item.category===c?'selected':''}>${e(c)}</option>`).join('')}</select></label><label>Interaction style<select name="controller"><option value="original" ${item.controller==='original'?'selected':''}>Nine expressions in sequence</option><option value="legacy" ${item.controller==='legacy'?'selected':''}>Classic boop reactions</option></select></label>${sheet('directions_url','Directions sheet',item.directions_url)}${sheet('reactions_url','Reactions sheet',item.reactions_url)}<p class="field-wide muted">Keep the character centered at the same scale in all 18 frames. Directions: ↖ ↑ ↗ / ← center → / ↙ ↓ ↘. New reactions: ${EXPRESSION_NAMES.join(', ')}.</p>${input('sort_order','Display order',item.sort_order,'type="number" step="1"')}<div class="field-wide checks">${checkbox('published','Published — visible to visitors',item.published)}${checkbox('is_new','Show in New characters',item.is_new)}${checkbox('is_original','Show in Our originals',item.is_original)}</div><p class="field-wide muted">Drafts can be saved before both sheets are ready. Uploaded media is public. Deleting a mascot keeps its image files.</p></div><p class="muted mascot-upload-status" role="status" data-sheet-status></p><p class="error" role="alert" data-mascot-error></p><div class="editor-preview" data-mascot-preview hidden></div><footer class="editor-footer"><button type="button" class="secondary" data-mascot-preview-button>Preview character</button><div><button type="button" class="secondary" data-mascot-close>Cancel</button><button type="submit" class="primary" ${canWrite()?'':'disabled'}>Save mascot</button></div></footer></form>`;
    baseline=serialized();dialog.showModal();
  }
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  dialog.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;if(button.hasAttribute('data-mascot-close'))close();if(button.hasAttribute('data-mascot-preview-button'))preview();if(button.dataset.sheetUpload)dialog.querySelector(`[data-sheet-file="${button.dataset.sheetUpload}"]`).click();if(button.dataset.expressionIndex!==undefined)controller?.showExpression(Number(button.dataset.expressionIndex));});
  dialog.addEventListener('input',()=>{cleanup();const area=dialog.querySelector('[data-mascot-preview]');if(area)area.hidden=true;});
  dialog.addEventListener('change',async event=>{
    const file=event.target.files?.[0],name=event.target.dataset.sheetFile;if(!file||!name||!canWrite())return;
    setBusy(true);error('');dialog.querySelector('[data-sheet-status]').textContent='Uploading and checking sheet…';let url;
    try{if(!['image/png','image/webp'].includes(file.type))throw new Error('Choose a PNG or WebP sprite sheet.');url=URL.createObjectURL(file);const dimensions=await loadImage(url);validateSheetDimensions(dimensions,dimensions);const uploaded=await uploadImage(file);dialog.querySelector(`[name="${name}"]`).value=uploaded;cleanup();dialog.querySelector('[data-mascot-preview]').hidden=true;dialog.querySelector('[data-sheet-status]').textContent='Sheet uploaded. Preview both sheets, then save your mascot.';}catch(err){dialog.querySelector('[data-sheet-status]').textContent='';error(err.message);}finally{if(url)URL.revokeObjectURL(url);event.target.value='';setBusy(false);}
  });
  dialog.addEventListener('submit',async event=>{
    event.preventDefault();if(!canWrite()||busy)return;setBusy(true);error('');
    try{const data=validateMascot(values());if(data.published||(data.directions_url&&data.reactions_url))await checkSheets(data);const saved=await saveMascot(data,current);rows=rows.filter(r=>r.id!==saved.id).concat(saved);baseline=serialized();cleanup();dialog.close();if(active)draw();toast(saved.published?'Mascot published to the gallery.':'Mascot draft saved.');}
    catch(err){error(err.code==='23505'?'This character ID already exists. Choose another ID.':err.message);}finally{setBusy(false);}
  });
  window.addEventListener('beforeunload',event=>{if(isDirty()||busy){event.preventDefault();event.returnValue='';}});
  function draw(){
    if(!active)return;const content=document.getElementById('content');
    content.innerHTML=`<div class="list-toolbar"><input id="mascot-search" type="search" aria-label="Search mascots" placeholder="Search characters…"><select id="mascot-status" aria-label="Filter mascots"><option value="all">All mascots</option><option value="published">Published</option><option value="draft">Drafts</option><option value="new">New characters</option><option value="original">Our originals</option></select></div><p class="muted">${rows.length} characters · ${rows.filter(r=>r.published).length} published. Edit any existing character or upload two sheets for a new one.</p><div class="mascot-admin-records"></div>`;
    function update(){const search=content.querySelector('#mascot-search').value.toLowerCase(),status=content.querySelector('#mascot-status').value;
      const shown=[...rows].sort((a,b)=>a.sort_order-b.sort_order||a.title.localeCompare(b.title)).filter(r=>(r.title+' '+r.subtitle+' '+r.category).toLowerCase().includes(search)).filter(r=>status==='all'||status==='published'&&r.published||status==='draft'&&!r.published||status==='new'&&r.is_new||status==='original'&&r.is_original);
      const records=content.querySelector('.mascot-admin-records');records.replaceChildren();
      for(const row of shown){const card=document.createElement('article');card.className='panel mascot-admin-card';card.innerHTML=`<div class="mascot-admin-thumb" aria-hidden="true"></div><h2>${e(row.title)}</h2><p class="muted">${e(row.subtitle||row.category)}</p><p class="pill ${row.published?'':'draft'}">${row.published?'Published':'Draft'} · Position ${row.sort_order}</p><div class="row-actions"><button type="button" data-mascot-edit="${row.id}">Edit / preview</button><button type="button" class="delete-button" data-mascot-delete="${row.id}" ${canWrite()?'':'disabled'}>Delete</button></div>`;const url=localAsset(row.directions_url,'../');if(url)card.querySelector('.mascot-admin-thumb').style.backgroundImage=`url(${JSON.stringify(url)})`;records.append(card);}
      if(!shown.length)records.innerHTML='<p class="empty-state">No mascots found.</p>';
    }
    content.querySelector('#mascot-search').addEventListener('input',update);content.querySelector('#mascot-status').addEventListener('change',update);update();
  }
  document.addEventListener('click',async event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.hasAttribute('data-add-mascot'))open();
    if(button.dataset.mascotEdit)open(rows.find(r=>r.id===button.dataset.mascotEdit));
    if(button.dataset.mascotDelete&&canWrite()){const row=rows.find(r=>r.id===button.dataset.mascotDelete);if(row&&await confirmAction('Delete this mascot?',`“${row.title}” will be removed from the gallery. Sprite files will be kept.`)){button.disabled=true;try{await deleteMascot(row);rows=rows.filter(r=>r.id!==row.id);draw();toast('Mascot deleted.');}catch(err){toast(err.message);button.disabled=false;}}}
  });
  return {async render(){active=true;document.getElementById('page-actions').innerHTML='<button type="button" class="primary" data-add-mascot>+ Add mascot</button>';document.getElementById('content').innerHTML='<p role="status">Loading mascots…</p>';try{rows=await loadMascots({admin:true,preview:!canWrite()});draw();}catch(err){if(active)document.getElementById('content').innerHTML=`<p class="error" role="alert">${e(err.message)}</p>`;}},leave(){active=false;}};
}
