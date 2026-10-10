const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
async function main(){
 const {parse}=await import('parse5');
 const root=path.join(__dirname,'../dist');let pages=0;
 const files=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):e.name.endsWith('.html')?[path.join(dir,e.name)]:[]);
 const attrs=node=>Object.fromEntries((node.attrs||[]).map(a=>[a.name,a.value]));
 for(const file of files(root)){
  const html=fs.readFileSync(file,'utf8');if(!/<html\b/i.test(html))continue;
  const nodes=[];function walk(n){nodes.push(n);for(const c of n.childNodes||[])walk(c);}walk(parse(html));
  const ads=nodes.filter(n=>{const a=attrs(n);return /(?:store-ad|store-top-bar|store-listing-card|mobile-sticky-cta|product-cta)(?:\s|$)/.test(a.class||'');});
  const counts={};
  for(const node of ads){
   const a=attrs(node);assert.ok(a['data-criativo']&&a['data-posicao'],file+': anúncio sem IDs');
   counts[a['data-posicao']]=(counts[a['data-posicao']]||0)+1;
   const descendants=[];function below(n){descendants.push(n);for(const c of n.childNodes||[])below(c);}below(node);
   for(const anchor of descendants.filter(n=>n.tagName==='a')){
    const link=attrs(anchor);assert.equal(link.href,'https://www.sucupiranaturale.com.br/combos',file+': destino fora de combos');
    assert.ok(link['data-sn-cta'],file+': CTA sem ID CRM');
   }
   for(const img of descendants.filter(n=>n.tagName==='img'))assert.ok(attrs(img).width&&attrs(img).height,file+': imagem sem dimensões');
  }
  assert.equal(counts['anuncio-rodape'],1,file+': rodapé deve ser único');
  if(nodes.some(n=>(attrs(n).class||'').split(' ').includes('article-body'))){
   for(const position of ['anuncio-topo','anuncio-meio','anuncio-fim','barra-fixa'])assert.ok((counts[position]||0)<=1,file+': anúncio repetido');
   assert.ok(!(counts['anuncio-fim']&&counts['bloco-cta']),file+': CTA duplicado depois do artigo');
   if(/sucupira-na-gravidez|sucupira-faz-mal-para-quem-toma-anticoagulante/.test(path.relative(root,file))){
    assert.equal(counts['anuncio-meio']||0,0);assert.equal(counts['barra-fixa']||0,0);
   }
  }
  pages++;
 }
 assert.ok(pages>50);console.log(`Anúncios: destino, IDs, dimensões e limites verificados em ${pages} páginas.`);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
