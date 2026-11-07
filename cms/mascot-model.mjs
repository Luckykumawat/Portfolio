import {safeURL} from './model.mjs';
export const MASCOT_CATEGORIES = ['Animals','People','Robots & things','Originals'];
export function validateMascot(value) {
  const title=String(value.title||'').trim(),slug=String(value.slug||'').trim();
  if(!title||title.length>180)throw new Error('Enter a character name of 1–180 characters.');
  if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug))throw new Error('Use lowercase letters, numbers and hyphens for the character ID.');
  if(!MASCOT_CATEGORIES.includes(value.category))throw new Error('Choose a mascot category.');
  const result={title,slug,subtitle:String(value.subtitle||'').trim(),category:value.category,controller:value.controller==='legacy'?'legacy':'original',is_original:value.is_original===true,is_new:value.is_new===true,published:value.published===true,sort_order:Number(value.sort_order||0)};
  if(!Number.isSafeInteger(result.sort_order))throw new Error('Display order must be a whole number.');
  for(const key of ['directions_url','reactions_url']){
    const raw=String(value[key]||'').trim();result[key]=safeURL(raw,{image:true});
    if(raw&&!result[key])throw new Error('Use an HTTPS image URL or a supported local sprite path.');
    if(result.published&&!result[key])throw new Error('Add both sprite sheets before publishing.');
  }
  return result;
}
export function validateSheetDimensions(a,b) {
  for(const image of [a,b])if(!image||image.width!==image.height||image.width<3||image.width%3!==0)throw new Error('Each sheet must be square with a 3 × 3 grid (for example 1080 × 1080).');
  if(a.width!==b.width)throw new Error('Both sheets must have the same dimensions so the character stays aligned.');
}
