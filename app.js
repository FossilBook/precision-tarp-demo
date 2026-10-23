'use strict';
const $ = selector => document.querySelector(selector);
const escapeHTML = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arrowIcon = '<svg class="icon arrow-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
const catalogURL='https://precisiontarps.com/wp-content/uploads/2022/05/precision-tarp-booklet_compressed.pdf';
const requestNames={cable:'Heavy Duty Cable System',swing:'HD Swing Arm System',custom:'Custom roll tarp',aviation:'Aviation baggage cart curtains','motor-apache':'Apache Slim motor inquiry','motor-tomahawk':'Tomahawk motor inquiry','motor-enforcer':'Enforcer HD motor inquiry'};
const PAGE_SIZE=6;
const initialHash=location.hash;
let parts=[],products={},page=1,quote=[],summary='',toastTimer,view=matchMedia('(max-width:700px)').matches?'list':'cards';
try { quote=CatalogCore.normalizeQuote(JSON.parse(localStorage.getItem('precision-quote-v1')||'[]'),[]); const saved=localStorage.getItem('precision-catalog-view');if(['cards','list'].includes(saved))view=saved; } catch {}
function feedback(message){
 const dialog=document.querySelector('dialog[open]');
 if(dialog){let status=dialog.querySelector('.dialog-feedback');if(!status){status=document.createElement('p');status.className='dialog-feedback';status.setAttribute('role','status');dialog.append(status);}status.textContent=message;}
 else {$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3200);}
}
function saveQuote(){
 try {localStorage.setItem('precision-quote-v1',JSON.stringify(quote));}catch{}
 $('#quote-count').textContent=quote.length;$('#mobile-quote-count').textContent=quote.length;
 $('#mobile-quote-count').hidden=!quote.length;$('#mobile-quote-label').textContent=quote.length?'View my quote':'Request a quote';
}
function addQuote(id,name,unit='each'){
 const item=quote.find(x=>x.id===id);
 if(item&&item.qty>=99){feedback('For more than 99, add the required quantity to your project notes.');return false;}
 if(!item&&quote.length>=60){feedback('Add any additional items to your project notes.');return false;}
 if(item)item.qty++;else quote.push({id,name,qty:1,unit});saveQuote();return true;
}
function addPart(sku,button){
 const p=parts.find(p=>p.sku===sku);if(!p)return;
 if(!addQuote(p.sku,`${p.sku} — ${p.displayName}`,p.unit))return;
 const quantity=quote.find(x=>x.id===sku).qty;
 const message=`Added ${p.displayName}. Your request now includes ${quantity}${p.unit==='ft'?' ft':' of this part'}.`;
 const local=button.closest('#detail-content')?.querySelector('.part-added');
 if(local){local.hidden=false;local.querySelector('[role=status]').textContent=message;}
 else feedback(message);
}
function syncCatalogURL(){
 const url=new URL(location.href);
 for(const [key,value] of [['q',$('#part-search').value.trim()],['system',$('#part-system').value],['category',$('#part-category').value],['sort',$('#part-sort').value==='featured'?'':$('#part-sort').value],['page',page>1?String(page):'']]){if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);}
 history.replaceState(null,'',url.pathname+url.search+url.hash);
}
function setView(next){
 view=next;$('#part-results').classList.toggle('compact',view==='list');
 for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===view));
 try{localStorage.setItem('precision-catalog-view',view);}catch{}
}
function renderParts({moveFocus=false}={}){
 const q=$('#part-search').value,system=$('#part-system').value,category=$('#part-category').value;
 const found=CatalogCore.search(parts,q,system,category,$('#part-sort').value),pages=Math.max(1,Math.ceil(found.length/PAGE_SIZE));
 page=Math.min(Math.max(1,page),pages);const start=(page-1)*PAGE_SIZE;
 $('#result-count').textContent=found.length?`${start+1}–${Math.min(start+PAGE_SIZE,found.length)} of ${found.length} parts`:'No matching parts';
 $('#part-results').innerHTML=found.length?found.slice(start,start+PAGE_SIZE).map(p=>`<article class="part-card">
 <button class="part-visual ${p.photo?'has-photo':'has-diagram'}" data-view-part="${escapeHTML(p.sku)}" aria-label="Quick view: ${escapeHTML(p.displayName)}, part ${escapeHTML(p.sku)}">
 <img src="assets/${p.photo?p.photo.file:p.diagram}" alt="${p.photo?escapeHTML(p.displayName)+' — catalog photo':escapeHTML(p.system)+' reference diagram'}" width="${p.photo?250:946}" height="${p.photo?200:554}" loading="lazy" decoding="async"><span class="image-label">${p.photo?'Catalog photo':'Diagram'+(p.ref?' · Ref. '+escapeHTML(p.ref):'')}</span><span class="image-open" aria-hidden="true">${arrowIcon}</span></button>
 <div class="part-body"><div class="part-top"><span>PART #${escapeHTML(p.sku)}</span><span>${escapeHTML(p.system)}</span></div><h3><a class="part-title" href="parts/${encodeURIComponent(p.sku)}/">${escapeHTML(p.displayName)}</a></h3><p class="part-unit">${p.unit==='ft'?'Specify length in feet':'Sold individually · confirm fit'}</p><button class="card-link" data-part="${escapeHTML(p.sku)}" aria-label="Add part ${escapeHTML(p.sku)} to quote">Add to quote ${arrowIcon}</button></div></article>`).join(''):`<div class="empty"><h3>Let’s find the right part.</h3><p>Try fewer words, a part number, or another category. Spaces and dashes in part numbers are accepted.</p><div class="actions"><button class="button outline" data-reset-search>Clear search & filters</button><button class="button dark" data-quote="Replacement part identification">Ask for help identifying a part ${arrowIcon}</button></div></div>`;
 $('.pagination').hidden=found.length<=PAGE_SIZE;$('#page-status').textContent=`Page ${page} of ${pages}`;
 $('#page-prev').setAttribute('aria-disabled',String(page<=1));$('#page-next').setAttribute('aria-disabled',String(page>=pages));
 const count=Number(Boolean(system))+Number(Boolean(category));$('#filter-count').textContent=count?`(${count} active)`:'';
 $('#clear-search').hidden=!(q||system||category);setView(view);syncCatalogURL();
 if(moveFocus){$('#result-count').focus({preventScroll:true});$('#result-count').scrollIntoView({block:'start'});}
}
function openPart(p){
 $('#detail-content').innerHTML=`<p class="eyebrow part-detail-kicker">${escapeHTML(p.system)} / PART #${escapeHTML(p.sku)}</p><h2 id="detail-title">${escapeHTML(p.displayName)}</h2>
 ${p.photo?`<figure class="part-detail-photo"><img src="assets/${p.photo.file}" width="250" height="200" alt="${escapeHTML(p.displayName)}"><figcaption>Precision Tarp catalog · page ${p.photo.page}</figcaption></figure>`:''}
 <div class="specs"><div><strong>Order unit</strong>${p.unit==='ft'?'Length in feet':'Individual item'}</div><div><strong>Diagram reference</strong>${p.ref?'No. '+escapeHTML(p.ref):'Catalog photo listing'}</div></div>
 ${p.sourceNote?`<p class="form-note">${escapeHTML(p.sourceNote)}</p>`:''}<p>Ask the team to confirm current fit, availability and pricing.</p>
 <button class="button orange" data-part="${escapeHTML(p.sku)}">Add to my quote ${arrowIcon}</button>
 <div class="part-added" hidden><p role="status"></p><button class="button dark" data-open-quote>Review my quote ${arrowIcon}</button></div>
 <a class="text-link standalone-link" href="parts/${encodeURIComponent(p.sku)}/">Open full product page ${arrowIcon}</a>
 <details class="part-drawing" ${p.photo?'':'open'}><summary>View numbered system diagram</summary><a href="assets/${p.diagram}" target="_blank" rel="noopener"><img src="assets/${p.diagram}" alt="${escapeHTML(p.system)} numbered parts diagram" loading="lazy"><span class="text-link">Open full-size diagram ${arrowIcon}</span></a></details>
 <details class="source-details"><summary>Published description & source</summary><p>${escapeHTML(p.name)}</p><a class="detail-source" href="${p.photo?catalogURL+'#page='+p.photo.page:p.source}" target="_blank" rel="noopener">View original product information ${arrowIcon}</a></details>`;
 $('#detail-dialog').setAttribute('aria-labelledby','detail-title');$('#detail-dialog').showModal();$('#detail-dialog').scrollTop=0;
}
function openSystem(key){
 const p=products[key];if(!p)return;
 $('#detail-content').innerHTML=`<h2 id="detail-title">${p.name}</h2><img class="detail-image" src="assets/${p.image}" alt="${p.name}"><p>${p.description}</p><div class="specs">${p.specs.map(([k,v])=>`<div><strong>${k}</strong>${v}</div>`).join('')}</div><p>${p.note}</p><button class="button orange" data-quote="${p.name}">Build my quote request ${arrowIcon}</button><a class="text-link standalone-link" href="systems/${key}/">Open full product page ${arrowIcon}</a>`;
 $('#detail-dialog').setAttribute('aria-labelledby','detail-title');$('#detail-dialog').showModal();$('#detail-dialog').scrollTop=0;
}
function renderQuote(){
 $('#quote-items').innerHTML=quote.length?quote.map(x=>`<div class="quote-item" data-item-id="${escapeHTML(x.id)}"><span><strong>${escapeHTML(x.name)}</strong><small>${x.unit==='ft'?'Length in whole feet':'Quantity in individual items'}</small>${CatalogCore.quoteNotes([x],parts).map(note=>`<small class="quote-source-note"><strong>Confirm before ordering</strong>${escapeHTML(note)}</small>`).join('')}</span><div class="qty-controls"><button type="button" aria-disabled="${x.qty<=1}" data-qty="${escapeHTML(x.id)}" data-delta="-1" aria-label="Decrease ${x.unit==='ft'?'feet':'quantity'} for ${escapeHTML(x.name)}">−</button><span class="qty-value">${x.qty}${x.unit==='ft'?' ft':''}</span><button type="button" aria-disabled="${x.qty>=99}" data-qty="${escapeHTML(x.id)}" data-delta="1" aria-label="Increase ${x.unit==='ft'?'feet':'quantity'} for ${escapeHTML(x.name)}">+</button></div><button type="button" class="remove-item" data-remove="${escapeHTML(x.id)}" aria-label="Remove ${escapeHTML(x.name)}">Remove</button></div>`).join(''):'<p class="form-note">No items selected. You can still describe your project or ask us to identify a part.</p>';
 if(!parts.length)$('#quote-items').insertAdjacentHTML('afterbegin','<p class="form-note">Catalog details are loading or unavailable. Ask the team to confirm all part numbers and specifications; you can also use the <a href="catalog.html">text catalog</a>.</p>');
}
function updateQuantity(button){
 const item=quote.find(x=>x.id===button.dataset.qty);if(!item)return;
 item.qty=Math.max(1,Math.min(99,item.qty+Number(button.dataset.delta)));saveQuote();
 const row=button.closest('.quote-item');row.querySelector('.qty-value').textContent=item.qty+(item.unit==='ft'?' ft':'');
 row.querySelector('[data-delta="-1"]').setAttribute('aria-disabled',String(item.qty<=1));row.querySelector('[data-delta="1"]').setAttribute('aria-disabled',String(item.qty>=99));
 $('#quote-update').textContent=`${item.name}: ${item.qty}${item.unit==='ft'?' feet':' items'}.`;
}
function openQuote(){
 closeMenu();for(const d of document.querySelectorAll('dialog[open]'))d.close();
 renderQuote();$('#quote-form').hidden=false;$('#quote-items').hidden=false;$('#quote-summary').hidden=true;
 $('.custom-fields').open=quote.some(x=>/custom|curtain/i.test(x.name));$('#quote-dialog').showModal();$('#quote-dialog').scrollTop=0;
}
function closeMenu(){$('#navigation').classList.remove('open');$('.menu-toggle').setAttribute('aria-expanded','false');}
function resetSearch(){ $('#part-search').value='';$('#part-system').value='';$('#part-category').value='';page=1;renderParts();$('#part-search').focus(); }
document.addEventListener('click',event=>{
 const link=event.target.closest('a[data-detail]');if(link&&products[link.dataset.detail]&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey){event.preventDefault();openSystem(link.dataset.detail);return;}
 const b=event.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-close'))b.closest('dialog').close();
 if(b.hasAttribute('data-open-quote'))openQuote();
 if(b.dataset.viewPart){const p=parts.find(p=>p.sku===b.dataset.viewPart);if(p)openPart(p);}
 if(b.dataset.part)addPart(b.dataset.part,b);
 if(b.dataset.quote){addQuote(b.dataset.quote,b.dataset.quote);openQuote();}
 if(b.dataset.detail)openSystem(b.dataset.detail);
 if(b.dataset.qty)updateQuantity(b);
 if(b.dataset.remove){const index=quote.findIndex(x=>x.id===b.dataset.remove);quote=quote.filter(x=>x.id!==b.dataset.remove);saveQuote();renderQuote();const controls=[...$('#quote-items').querySelectorAll('[data-remove]')];(controls[Math.min(index,controls.length-1)]||$('#quote-form input')).focus();$('#quote-update').textContent='Item removed from your request.';}
 if(b.dataset.view)setView(b.dataset.view);
 if(b.hasAttribute('data-reset-search'))resetSearch();
 if(b.hasAttribute('data-finder-quote')){
  const form=$('#quote-form'),kind=$('#finder-need').value;
  if(kind!=='aviation'){for(const key of ['length','width','operation','mount'])form.elements.namedItem(key).value=$('#finder-'+key).value;form.elements.namedItem('load').value=$('#finder-load').selectedOptions[0].textContent;}
  addQuote('setup-'+kind,({parts:'Replacement part identification',custom:'Custom tarp consultation',aviation:'Aviation baggage cart curtains',system:'Tarp system consultation'})[kind]);openQuote();$('.setup-fields').open=kind!=='aviation';
 }
});
$('.menu-toggle').addEventListener('click',()=>{const open=$('#navigation').classList.toggle('open');$('.menu-toggle').setAttribute('aria-expanded',String(open));});
$('#navigation').addEventListener('click',closeMenu);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('#navigation').classList.contains('open')){closeMenu();$('.menu-toggle').focus();}});
document.addEventListener('click',event=>{if(!event.target.closest('header'))closeMenu();});
matchMedia('(min-width:961px)').addEventListener('change',closeMenu);
for(const d of document.querySelectorAll('dialog')){
 d.addEventListener('click',event=>{if(event.target===d){const r=d.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)d.close();}});
 d.addEventListener('close',()=>d.querySelector('.dialog-feedback')?.remove());
}
$('#part-search').addEventListener('input',()=>{page=1;renderParts();});
for(const id of ['part-system','part-category','part-sort'])$('#'+id).addEventListener('change',()=>{page=1;renderParts();});
$('#clear-search').addEventListener('click',resetSearch);
for(const [id,delta] of [['page-prev',-1],['page-next',1]])$('#'+id).addEventListener('click',event=>{if(event.currentTarget.getAttribute('aria-disabled')==='true')return;page+=delta;renderParts({moveFocus:true});});
$('#finder-open').addEventListener('click',()=>{$('#finder-dialog').showModal();$('#finder-dialog').scrollTop=0;});
$('#finder-form').addEventListener('input',()=>{$('#finder-result').replaceChildren();});
$('#finder-form').addEventListener('change',()=>{$('#finder-result').replaceChildren();});
$('#finder-need').addEventListener('change',()=>{const aviation=$('#finder-need').value==='aviation';$('#finder-load').closest('label').hidden=aviation;$('#finder-form .form-grid').hidden=aviation;for(const input of document.querySelectorAll('#finder-load,#finder-form .form-grid input,#finder-form .form-grid select'))input.disabled=aviation;});
$('#finder-form').addEventListener('submit',event=>{
 event.preventDefault();const need=$('#finder-need').value,load=$('#finder-load').value,length=Number($('#finder-length').value),mount=$('#finder-mount').value;
 let title='Compare cable and swing arm options.',text='The team will use your dimensions, mounting space and operating preference to narrow the options.';
 if(need==='parts'){title='Identify the existing system first.';text='Include the system label and part markings. Photograph the part and where it mounts; attach those photos when you send your request.';}
 else if(need==='aviation'){title='Prepare a baggage cart curtain request.';text='Include each cart opening, requested finished curtain dimensions with units, quantity and attachment details. Photograph the cart, mounting points and existing closure.';}
 else if(need==='custom'){title='Prepare a custom tarp measurement request.';text='Include the box dimensions, material being hauled and existing attachment points. Ask the team to confirm final measurements before manufacture.';}
 else if(load==='hot'){title='Discuss vinyl coverage for your load.';text='Precision lists vinyl for weather-sensitive and hot-mix applications. Ask the team to confirm material, temperature requirements and the appropriate system.';}
 if(need==='system'&&length&&((mount==='External swing arm'&&(length<8||length>26))||(mount==='Underbody swing arm'&&(length<12||length>38))))text+=' Your entered length is outside the published range for that swing-arm mount. A specialist needs to confirm available options.';
 $('#finder-result').innerHTML=`<h3>${title}</h3><p>${text}</p><p class="finder-disclaimer">This is a starting point, not a compatibility guarantee.</p><button class="button dark" data-finder-quote>Use these details in my request ${arrowIcon}</button>`;
});
$('#quote-form').addEventListener('submit',event=>{
 event.preventDefault();const form=event.target,data=new FormData(form),name=String(data.get('name')).trim();
 if(!name){form.elements.namedItem('name').setCustomValidity('Please enter your name.');form.elements.namedItem('name').reportValidity();return;}
 const value=key=>String(data.get(key)||'').trim()||'Not provided';
 summary=`PRECISION TARP — QUOTE REQUEST\n\nName: ${name}\nEmail: ${value('email')}\nCompany: ${value('company')}\nPhone: ${value('phone')}\n\nREQUESTED ITEMS\n${quote.length?quote.map(x=>`${x.qty} ${x.unit==='ft'?'ft of':'×'} ${x.name}`).join('\n'):'General inquiry — see details below'}\n\nEQUIPMENT & MEASUREMENTS\nTruck / existing system: ${value('equipment')}\nBody length (ft): ${value('length')}\nBody width (in): ${value('width')}\nOperation: ${value('operation')}\nMounting: ${value('mount')}\nMaterial hauled: ${value('load')}\n\nCUSTOM COVER DETAILS\nFinished length / height: ${value('coverLength')}\nFinished width: ${value('coverWidth')}\nMaterial / color: ${value('coverMaterial')}\nAttachments / closure: ${value('coverAttachments')}\n\nPROJECT DETAILS\n${value('details')}\n\nPlease confirm fit, pricing, availability and order terms. This is an inquiry, not an order. Photos may be attached separately.`;
 const notes=CatalogCore.quoteNotes(quote,parts);if(notes.length)summary+='\n\nCATALOG DETAILS TO CONFIRM\n'+notes.join('\n');
 $('#summary-text').textContent=summary;
 const draft=CatalogCore.emailDraft(summary,name);$('#long-request-note').hidden=!draft.long;$('#email-request').href=draft.href;
 $('#request-feedback').textContent='';$('#quote-form').hidden=true;$('#quote-items').hidden=true;$('#quote-summary').hidden=false;$('#quote-dialog').scrollTop=0;$('#email-request').focus();
});
$('#quote-form input[name=name]').addEventListener('input',event=>event.target.setCustomValidity(''));
$('#edit-request').addEventListener('click',()=>{$('#quote-summary').hidden=true;$('#quote-items').hidden=false;$('#quote-form').hidden=false;$('#quote-form input').focus();});
$('#copy-request').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(summary);$('#request-feedback').textContent='Copied. Paste the request into an email to sales@precisiontarps.com.';}catch{$('#request-feedback').textContent='Automatic copying is unavailable. Select the request text above or download a copy.';$('#summary-text').focus();}});
if(navigator.share)$('#share-request').hidden=false;
$('#share-request').addEventListener('click',async()=>{try{await navigator.share({title:'Precision Tarp quote request',text:summary+'\n\nSend to: sales@precisiontarps.com'});$('#request-feedback').textContent='The share sheet closed. Check your chosen app to confirm whether the request was sent.';}catch(e){if(e.name!=='AbortError')$('#request-feedback').textContent='Sharing is unavailable. Copy or download the request instead.';}});
$('#download-request').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([summary],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='precision-tarp-quote-request.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('#request-feedback').textContent='Download requested. Attach the saved file to your email.';});
function completeStartup(){
 const params=new URLSearchParams(location.search),add=params.get('add'),system=params.get('request');
 if(['#contact','#about','#resources','#aviation','#parts','#systems','#custom'].includes(initialHash))document.querySelector(initialHash)?.scrollIntoView({block:'start'});
 if(add){const p=parts.find(p=>p.sku===add);if(p){addQuote(p.sku,`${p.sku} — ${p.displayName}`,p.unit);openQuote();}else{openQuote();feedback('That part could not be loaded. Browse the text catalog or include its number in your project details.');}}
 else if(system&&Object.hasOwn(requestNames,system)){addQuote('system-'+system,requestNames[system]);openQuote();}
 if(add||system){const url=new URL(location.href);url.searchParams.delete('add');url.searchParams.delete('request');history.replaceState(null,'',url.pathname+url.search+'#parts');}
}
saveQuote();
fetch('systems.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{products=data;}).catch(()=>{for(const b of document.querySelectorAll('[data-detail]')){const link=document.createElement('a');link.href=`systems/${b.dataset.detail}/`;link.className=b.className;link.innerHTML=b.innerHTML;b.replaceWith(link);}});
fetch('parts.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{
 parts=data;quote=CatalogCore.normalizeQuote(quote,parts);saveQuote();if($('#quote-dialog').open&&!$('#quote-items').hidden)renderQuote();
 const params=new URLSearchParams(location.search);$('#part-search').value=params.get('q')||'';
 for(const [param,id] of [['system','part-system'],['category','part-category'],['sort','part-sort']])if(params.has(param)&&[...$('#'+id).options].some(o=>o.value===params.get(param)))$('#'+id).value=params.get(param);
 page=Math.max(1,parseInt(params.get('page'),10)||1);renderParts();
}).catch(()=>{$('#result-count').textContent='Interactive catalog unavailable.';$('.pagination').hidden=true;for(const control of document.querySelectorAll('.catalog-toolbar input,.catalog-toolbar select,.catalog-toolbar button'))control.disabled=true;$('#part-results').innerHTML='<div class="empty"><p>You can still browse every part and contact the team. Reload this page to retry interactive search.</p><a class="button dark" href="catalog.html">Open the full parts catalog</a></div>';}).finally(completeStartup);
