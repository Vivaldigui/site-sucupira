const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const script=fs.readFileSync('src/scripts/store-ad-rotation.js','utf8');
function run(saved){
 const variants=[0,1].map(i=>({id:'piece-'+i,image:'image-'+i,alt:'alt',title:'title-'+i,text:'text-'+i,cta:'Ver combos',width:720,height:720}));
 const attrs={'data-criativo':'piece-0','data-posicao':'anuncio-meio','data-variants':JSON.stringify(variants)};
 const elements={'img':{},'.store-ad-title':{},'.store-ad-text':{},'.store-ad-cta':{}};
 const card={getAttribute:k=>attrs[k],setAttribute:(k,v)=>attrs[k]=v,querySelector:k=>elements[k]};
 const events=[],listeners={},timers=new Map();let next=0,callback;
 const storage=new Map(saved?[['sn_ads_blog-combos-20261009-v2',saved]]:[]);
 const d={readyState:'complete',hidden:false,querySelectorAll:()=>[card],addEventListener:(name,fn)=>listeners[name]=fn};
 const w={localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},crypto:{getRandomValues:b=>b.fill(1)},
  setTimeout:fn=>{timers.set(++next,fn);return next;},clearTimeout:id=>timers.delete(id),gtag:(...args)=>events.push(args),
  IntersectionObserver:class{constructor(fn){callback=fn;}observe(){}}};
 vm.runInNewContext(script,{window:w,document:d,Uint8Array,Set,Map,Date});
 return {attrs,elements,storage,events,d,show:ratio=>callback([{target:card,isIntersecting:ratio>0,intersectionRatio:ratio}]),
  visibility:()=>listeners.visibilitychange(),flush:()=>{const all=[...timers.values()];timers.clear();all.forEach(fn=>fn());}};
}
test('variante persiste por navegador e impressão requer 50% por 1s visível',()=>{
 const a=run();assert.equal(a.attrs['data-criativo'],'piece-1');assert.equal(a.elements.img.width,720);
 a.show(.4);a.flush();assert.equal(a.events.length,0);
 a.show(.5);a.show(0);a.flush();assert.equal(a.events.length,0);
 a.show(.8);a.d.hidden=true;a.visibility();a.flush();assert.equal(a.events.length,0);
 a.d.hidden=false;a.visibility();a.flush();assert.equal(a.events.length,1);
 assert.equal(a.events[0][1],'anuncio_loja_visto');assert.equal(a.events[0][2].criativo,'piece-1');
 a.show(0);a.show(1);a.flush();assert.equal(a.events.length,1);
 const b=run(a.storage.values().next().value);assert.equal(b.attrs['data-criativo'],'piece-1');
 const c=run(JSON.stringify({variant:0,until:Date.now()+60000}));assert.equal(c.attrs['data-criativo'],'piece-0');
});
