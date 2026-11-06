import assert from 'node:assert/strict';
import { directionIndex, attachCustomMascot, EXPRESSION_NAMES } from '../custom-mascot.mjs';
const vectors = [[-200,-200],[0,-200],[200,-200],[-200,0],[0,0],[200,0],[-200,200],[0,200],[200,200]];
vectors.forEach(([x,y],index)=>assert.equal(directionIndex(x,y),index));
assert.equal(directionIndex(10,10),4);
assert.equal(directionIndex(200,20),5);
class Element extends EventTarget {
 constructor(){super();this.style={};this.dataset={};this.attributes={};this.classList={add(){},remove(){}};}
 setAttribute(k,v){this.attributes[k]=v;}
 removeAttribute(k){delete this.attributes[k];}
 append(child){this.child=child;}
 remove(){this.removed=true;}
 getBoundingClientRect(){return {left:100,top:100,width:100,height:100};}
 animate(){throw new Error('Reduced motion must skip animation');}
}
globalThis.HTMLButtonElement=Element;
globalThis.window=new EventTarget();
globalThis.document={createElement:()=>new Element(),documentElement:new Element()};
globalThis.matchMedia=query=>Object.assign(new EventTarget(),{matches:query.includes('reduce')});
globalThis.requestAnimationFrame=callback=>setTimeout(callback,0);
globalThis.cancelAnimationFrame=clearTimeout;
globalThis.Image=class {naturalWidth=900;naturalHeight=900;set src(value){queueMicrotask(()=>value==='missing'?this.onerror():this.onload());}};
const button=new Element();
const mascot=attachCustomMascot(button,{directions:'directions.webp',reactions:'reactions.webp',label:'Test'});
assert.equal(button.disabled,true);
await mascot.ready;
assert.equal(button.disabled,false);
assert.equal(button.child.style.backgroundPosition,'50% 50%');
for(const name of EXPRESSION_NAMES){button.dispatchEvent(new Event('click'));assert.equal(button.dataset.expression,name);}
assert.throws(()=>mascot.showExpression(9),RangeError);
await new Promise(resolve=>setTimeout(resolve,950));
assert.equal(button.dataset.expression,undefined);
assert.equal(button.child.style.backgroundPosition,'50% 50%');
button.dispatchEvent(new Event('click'));mascot.destroy();
assert.equal(button.child.removed,true);
assert.equal(button.disabled,true);
const broken=attachCustomMascot(new Element(),{directions:'missing',reactions:'reactions.webp'});
await assert.rejects(broken.ready,/Could not load/);broken.destroy();
console.log('PASS: all 9 directions, dead zone, 9 click expressions, return to neutral, reduced motion, cleanup, failed-artwork handling.');
