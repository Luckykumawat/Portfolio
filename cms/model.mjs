export const KINDS = ['project', 'software', 'service', 'photo'];
export const STATUSES = ['upcoming', 'in_progress', 'completed'];
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function safeURL(value, { image = false } = {}) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  if (/[\u0000-\u001f\u007f\\]/.test(text)) return '';
  if (/^https?:\/\//i.test(text)) {
    try { const url = new URL(text); return url.username || url.password ? '' : url.href; } catch { return ''; }
  }
  // Local paths are relative to the portfolio root, not to /admin/.
  if (/^(?:\.?\/?(?:image|mascots|uploads)\/)[^<>]*$/i.test(text) && !text.split('/').includes('..')) return text;
  if (!image && /^mailto:[^\s<>]+@[^\s<>]+$/i.test(text)) return text;
  return '';
}
export function localAsset(value, base = './') {
  const url = safeURL(value, { image: true });
  return url && !/^https?:/i.test(url) ? base + url.replace(/^\.?\//, '') : url;
}
export const paragraphs = value => String(value ?? '').split(/\n\s*\n/).filter(Boolean).map(text => `<p>${escapeHTML(text).replace(/\n/g, '<br>')}</p>`).join('');
export function sortItems(items, home = false) {
  return [...items].sort((a,b) => Number(home ? a.homepage_order : a.sort_order) - Number(home ? b.homepage_order : b.sort_order) || a.title.localeCompare(b.title));
}
export function publicItems(items, kind) {
  return sortItems(items.filter(item => item.published === true && (!kind || item.kind === kind)));
}
export function validateItem(value) {
  const title = String(value.title ?? '').trim();
  if (!title || title.length > 180) throw new Error('Enter a title of 1–180 characters.');
  if (!KINDS.includes(value.kind)) throw new Error('Choose a supported content type.');
  const record = {
    kind:value.kind, title, subtitle:String(value.subtitle ?? '').trim(), description:String(value.description ?? '').trim(),
    category:value.category === 'github' ? 'github' : 'real',
    work_status:STATUSES.includes(value.work_status) ? value.work_status : 'completed',
    published:value.published === true, featured:value.featured === true, current_focus:value.current_focus === true,
    show_on_projects:value.show_on_projects === true,
    sort_order:Number(value.sort_order || 0), homepage_order:Number(value.homepage_order || 0),
    tags:Array.isArray(value.tags) ? value.tags.map(String).map(s=>s.trim()).filter(Boolean) : [],
    album:String(value.album ?? '').trim(), alt:String(value.alt ?? '').trim(),
    gallery:Array.isArray(value.gallery) ? value.gallery.filter(Boolean).map(url => {
      const clean = safeURL(url, {image:true}); if (!clean) throw new Error('A gallery image URL is invalid.'); return clean;
    }) : []
  };
  for (const key of ['image_url','live_url','github_url']) {
    const raw = String(value[key] ?? '').trim();
    const clean = safeURL(raw, {image:key==='image_url'});
    if (raw && !clean) throw new Error(`Use an HTTP(S) URL or a supported local image path for ${key.replaceAll('_',' ')}.`);
    record[key] = clean;
  }
  if (record.kind === 'photo' && !record.image_url) throw new Error('Add an image URL or upload a photo.');
  if (![record.sort_order,record.homepage_order].every(Number.isSafeInteger)) throw new Error('Display orders must be whole numbers.');
  if (record.current_focus && record.work_status !== 'in_progress') throw new Error('Current work must have the In progress status.');
  return record;
}
export function validateProfile(value) {
  const data = {};
  for (const key of ['name','headline','bio','expertise','skills','email','phone','availability','home_intro','home_description']) data[key] = String(value[key] ?? '').trim();
  if (!data.name) throw new Error('Enter your name.');
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new Error('Enter a valid email address.');
  for (const key of ['photo_url','linkedin_url','github_url','resume_url']) {
    const raw = String(value[key] ?? '').trim();
    data[key] = safeURL(raw, {image:key==='photo_url'});
    if (raw && !data[key]) throw new Error(`Invalid ${key.replaceAll('_',' ')}.`);
  }
  return data;
}
