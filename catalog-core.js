/* Shared by the browser, page generator and catalog regression checks. */
(function(root){
 'use strict';
 const compact=value=>String(value).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
 const words=value=>String(value).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().split(/\s+/).filter(Boolean);
 const aliases={lh:'left',rh:'right',ay:'assembly',wldt:'weldment',ss:'stainless',alum:'aluminum',aluminium:'aluminum',electrical:'electric',gear:'sprocket',gears:'sprocket'};
 function search(parts,query='',system='',category='',sort='featured'){
  const tokens=words(query).map(t=>aliases[t]||t),skuQuery=compact(query);
  const found=parts.filter(p=>{
   if(system&&p.system!==system||category&&p.category!==category)return false;
   if(!tokens.length)return true;
   if([p.sku,...p.aliases||[]].some(s=>skuQuery&&compact(s).includes(skuQuery)))return true;
   const text=words(`${p.displayName} ${p.name} ${p.system} ${p.category}`).map(t=>aliases[t]||t).join(' ');
   return tokens.every(t=>text.includes(t));
  });
  if(sort==='name')found.sort((a,b)=>a.displayName.localeCompare(b.displayName));
  if(sort==='sku')found.sort((a,b)=>a.sku.localeCompare(b.sku,undefined,{numeric:true}));
  return found;
 }
 function normalizeQuote(stored,parts){
  if(!Array.isArray(stored))return [];
  const seen=new Set();return stored.filter(x=>x&&typeof x.id==='string'&&x.id.length<=250&&typeof x.name==='string'&&x.name.length<=250&&Number.isInteger(x.qty)&&x.qty>0&&x.qty<=99).filter(x=>{if(seen.has(x.id))return false;seen.add(x.id);return true;}).slice(0,60).map(x=>{const p=parts.find(p=>p.sku===x.id);return {id:x.id,name:p?`${p.sku} — ${p.displayName}`:x.name,qty:x.qty,unit:p?.unit||(x.unit==='ft'?'ft':'each')};});
 }
 function quoteNotes(quote,parts){return quote.flatMap(x=>{const p=parts.find(p=>p.sku===x.id);return p?.sourceNote?[`${p.sku}: ${p.sourceNote}`]:[];});}
 function emailDraft(summary,name){
  const base=`mailto:sales@precisiontarps.com?subject=${encodeURIComponent('Quote request — '+name)}&body=`;
  const full=base+encodeURIComponent(summary),long=full.length>1800;
  return {long,href:long?base+encodeURIComponent('Please paste the copied quote request below before sending.\n\n'):full};
 }
 const api={compact,search,normalizeQuote,quoteNotes,emailDraft};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.CatalogCore=api;
})(typeof window==='undefined'?globalThis:window);
