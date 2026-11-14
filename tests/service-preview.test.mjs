import assert from 'node:assert/strict';
import {setupServicePreview} from '../cms/service-preview.mjs';
const listeners=new Map(), frames=new Map();let serial=0,hit;
const node=()=>({style:{},children:[],append(child){this.children.push(child);},setAttribute(){},remove(){},addEventListener(type,fn){listeners.set(this.name+type,fn);}});
const rows=['one.webp','two.webp'].map(url=>({dataset:{preview:url},closest(){return this;}}));
const services={...node(),name:'services',contains:row=>rows.includes(row),querySelectorAll:()=>rows};
const body=node();
globalThis.document={body,documentElement:{...node(),name:'root'},createElement:node,elementFromPoint:()=>hit,addEventListener(type,fn){listeners.set(type,fn);}};
globalThis.window={addEventListener(type,fn){listeners.set(type,fn);}};
globalThis.innerWidth=1000;globalThis.innerHeight=800;
globalThis.matchMedia=()=>({matches:true});
globalThis.Image=class{constructor(){Object.assign(this,node());}decode(){return Promise.resolve();}};
globalThis.requestAnimationFrame=fn=>{frames.set(++serial,fn);return serial;};
globalThis.cancelAnimationFrame=id=>frames.delete(id);
const tick=()=>{const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn());};
const flush=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
setupServicePreview(services,{id:'hover-img',remove(){}});
const preview=body.children[0];
hit=rows[0];listeners.get('pointermove')({clientX:100,clientY:200,pointerType:'mouse'});await flush();tick();
assert.equal(preview.style.opacity,'1');assert.equal(preview.children[1].src,'one.webp');
// Scrolling changes the hit row without a pointermove event.
hit=rows[1];listeners.get('scroll')();tick();await flush();
assert.equal(preview.children[0].src,'two.webp');assert.equal(preview.children[0].style.opacity,'1');assert.equal(preview.children[1].style.opacity,'0');
// The next scroll leaves the service list and dismisses the preview.
hit=null;listeners.get('scroll')();tick();assert.equal(preview.style.opacity,'0');
// Entering the list through scrolling alone shows a preview again.
hit=rows[0];listeners.get('scroll')();tick();await flush();assert.equal(preview.style.opacity,'1');
// A pending image load cannot resurrect a preview after leaving.
hit=rows[1];listeners.get('pointermove')({clientX:100,clientY:200,pointerType:'mouse'});hit=null;listeners.get('pointermove')({clientX:100,clientY:200,pointerType:'mouse'});await flush();assert.equal(preview.style.opacity,'0');
console.log('PASS: scroll-only entry and switching, crossfade layers, leaving, and stale image loads.');
