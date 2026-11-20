function reportStorageFailure(action,error){console.error('No se pudo '+action+':',error)}
function validateBackupManifest(d){
 const invalid=()=>{throw new Error('El backup está incompleto o tiene un formato no compatible')};
 if(!d||typeof d!=='object'||Array.isArray(d)||![3,4].includes(d.v)||!d.ls||typeof d.ls!=='object'||Array.isArray(d.ls)||!Array.isArray(d.ph)||!Array.isArray(d.xl)||(d.v===4&&!Array.isArray(d.gallery)))invalid();
 for(const[k,v]of Object.entries(d.ls)){if(!k.startsWith('mtic_')||typeof v!=='string')invalid();try{JSON.parse(v)}catch(e){invalid()}}
 const keys={ph:new Set(),xl:new Set(),gallery:new Set()},files=new Set();
 for(const p of d.ph){if(!p||typeof p.key!=='string'||!p.key||p.key.length>500||keys.ph.has(p.key))invalid();keys.ph.add(p.key);if(p.na===1){if(p.f!==undefined)invalid();continue}
  if(typeof p.f!=='string'||!/^ph\/[1-9]\d*\.jpg$/.test(p.f)||files.has(p.f)||!Number.isFinite(p.w)||!Number.isFinite(p.h)||p.w<1||p.h<1||p.w>50000||p.h>50000)invalid();files.add(p.f)}
 for(const x of d.xl){if(!x||typeof x.key!=='string'||!x.key||x.key.length>500||keys.xl.has(x.key)||typeof x.f!=='string'||!/^xl\/[1-9]\d*\.xlsx$/.test(x.f)||files.has(x.f))invalid();keys.xl.add(x.key);files.add(x.f)}
 for(const p of d.gallery||[]){if(!p||typeof p.key!=='string'||!p.key||p.key.length>500||keys.gallery.has(p.key)||typeof p.f!=='string'||!/^gallery\/[1-9]\d*\.jpg$/.test(p.f)||files.has(p.f)||!Number.isFinite(p.w)||!Number.isFinite(p.h)||p.w<1||p.h<1||p.w>50000||p.h>50000)invalid();keys.gallery.add(p.key);files.add(p.f)}
 return d
}
async function backup(){
 if(!(await dbp))throw new Error('El almacenamiento local no está disponible');
 const z=new JSZip(),d={v:4,ls:{},ph:[],xl:[],gallery:[]};Object.keys(localStorage).filter(k=>k.startsWith('mtic_')).forEach(k=>d.ls[k]=localStorage.getItem(k));
 let n=0;for(const[k,v]of await idbRange('ph')){if(v.na)d.ph.push({key:k,na:1});else{const data=v.d&&v.d.split(',')[1];if(!data||!/^data:image\/(?:jpeg|png);base64,/.test(v.d)||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data))throw new Error('La foto '+k+' no tiene un formato válido');const f='ph/'+(++n)+'.jpg';z.file(f,data,{base64:true});d.ph.push({key:k,f,w:v.w,h:v.h})}}
 for(const[k,v]of await idbRange('xl')){const f='xl/'+(++n)+'.xlsx';z.file(f,v);d.xl.push({key:k,f})}
 for(const[k,v]of await idbRange('gallery')){const data=v.d&&v.d.split(',')[1];if(!data||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data))throw new Error('La foto guardada '+k+' está dañada');const f='gallery/'+(++n)+'.jpg';z.file(f,data,{base64:true});d.gallery.push({key:k,f,w:v.w,h:v.h,ts:v.ts||0,name:v.name||''})}
 z.file('data.json',JSON.stringify(d));return z.generateAsync({type:'uint8array',compression:'STORE'})
}
async function wipe(){await idbClearAll();Object.keys(localStorage).filter(k=>k.startsWith('mtic_')).forEach(k=>localStorage.removeItem(k))}
function chooseRestoreMode(){
 return new Promise(resolve=>{
  sheet('<b>Cargar copia de seguridad</b><div class="m">Elige cómo combinar la copia con los datos que ya están en este teléfono.</div><button data-restore="replace">Borrar los datos actuales y cargar la copia</button><button data-restore="merge">Mezclar la copia con los datos actuales</button><button data-restore="cancel">Cancelar</button>');
  const o=$('#ov');let done=false;const finish=mode=>{if(done)return;done=true;window.__cancelRestoreChoice=null;o.remove();resolve(mode)};
  window.__cancelRestoreChoice=()=>finish('cancel');
  o.addEventListener('click',e=>{if(e.target===o){finish('cancel');return}const b=e.target.closest('[data-restore]');if(b)finish(b.dataset.restore)})
 })
}
function mergeBackupLocalStorage(incoming,current){
 const merged=Object.assign({},incoming,current),oldSites=current.mtic_jobs||{},newSites=incoming.mtic_jobs||{},sites={};
 merged.mtic_equipment=Object.assign({},incoming.mtic_equipment||{},current.mtic_equipment||{});
 for(const ib of new Set(Object.keys(oldSites).concat(Object.keys(newSites)))){
  const old=oldSites[ib]||{},fresh=newSites[ib]||{},site=Object.assign({},fresh,old);
  const unique=(a,b,key)=>{const out=(a||[]).slice(),seen=new Set(out.map(key));(b||[]).forEach(item=>{const id=key(item);if(!seen.has(id)){seen.add(id);out.push(item)}});return out};
  site.works=unique(old.works,fresh.works,w=>w.id||[w.mode,w.ts,w.sede].join('|'));
  site.xl=unique(old.xl,fresh.xl,x=>x.id||[x.fn,x.ts].join('|'));
  sites[ib]=site
 }
 if(Object.keys(oldSites).length||Object.keys(newSites).length)merged.mtic_jobs=sites;
 return merged
}
async function restore(file){
 let z,d,legacy=null;try{
  z=await JSZip.loadAsync(file);
  const entry=z.file('data.json');
  if(entry)d=validateBackupManifest(JSON.parse(await entry.async('string')));
  else{
   const old=z.file('backup.json');if(!old)throw new Error('No contiene data.json ni backup.json');
   legacy=JSON.parse(await old.async('string'));
   if(!legacy||legacy.version!==1||!legacy.localStorage||typeof legacy.localStorage!=='object'||Array.isArray(legacy.localStorage)||!Array.isArray(legacy.stores))throw new Error('La versión o estructura del backup no es compatible');
   for(const[k,v]of Object.entries(legacy.localStorage)){if(!k.startsWith('mtic_')||typeof v!=='string')throw new Error('El backup contiene datos locales no válidos');JSON.parse(v)}
   d={ls:legacy.localStorage}
  }
 }catch(e){throw new Error('No se pudo validar el backup: '+(e.message||e))}
 const photos=[],files=[],library=[];
 if(legacy){
  const stores=new Map(legacy.stores.filter(x=>Array.isArray(x)&&x.length===2));
  for(const name of ['ph','xl','gallery']){
   const rows=stores.get(name);if(!Array.isArray(rows))throw new Error('Falta el almacén '+name+' en el backup');
   const seen=new Set(),target=name==='ph'?photos:name==='xl'?files:library;
   for(const row of rows){
    if(!row||typeof row.key!=='string'||seen.has(row.key))throw new Error('El backup contiene claves repetidas o no válidas en '+name);
    seen.add(row.key);let value=row.value;
    if(row.binary){if(typeof row.path!=='string'||!new RegExp('^files/'+name+'-\\d+\\.bin$').test(row.path))throw new Error('El backup contiene una ruta binaria no válida');const entry=z.file(row.path);if(!entry)throw new Error('Falta un archivo binario del backup: '+row.path);value=await entry.async('uint8array')}
    else if(!Object.prototype.hasOwnProperty.call(row,'value'))throw new Error('Falta un valor del almacén '+name);
    target.push([row.key,value])
   }
  }
 }else{
  for(const p of d.ph){if(p.na){photos.push([p.key,{na:1}]);continue}const entry=z.file(p.f);if(!entry)throw new Error('Falta el archivo de foto '+p.f);const data=await entry.async('base64');if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data))throw new Error('La foto '+p.f+' está dañada');photos.push([p.key,{d:'data:image/jpeg;base64,'+data,w:p.w,h:p.h}])}
  for(const x of d.xl){const entry=z.file(x.f);if(!entry)throw new Error('Falta el archivo Excel '+x.f);const data=await entry.async('uint8array');if(!data.length)throw new Error('El archivo Excel '+x.f+' está vacío');files.push([x.key,data])}
  for(const p of d.gallery||[]){const entry=z.file(p.f);if(!entry)throw new Error('Falta la foto de biblioteca '+p.f);const data=await entry.async('base64');if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data))throw new Error('La foto de biblioteca '+p.f+' está dañada');library.push([p.key,{d:'data:image/jpeg;base64,'+data,w:p.w,h:p.h,ts:p.ts,name:p.name}])}
 }
 const mode=await chooseRestoreMode();if(mode==='cancel')return;
 const previous=Object.keys(localStorage).filter(k=>k.startsWith('mtic_')).map(k=>[k,localStorage.getItem(k)]);
 try{
  if(mode==='merge'){
   const current=Object.fromEntries(previous.map(([k,v])=>[k,JSON.parse(v)]));
   const incoming=Object.fromEntries(Object.entries(d.ls).map(([k,v])=>[k,JSON.parse(v)])),merged=mergeBackupLocalStorage(incoming,current);
   Object.entries(merged).forEach(([k,v])=>localStorage.setItem(k,JSON.stringify(v)));
   await idbMergeAll(photos,files,library)
  }else{
   previous.forEach(([k])=>localStorage.removeItem(k));for(const[k,v]of Object.entries(d.ls))localStorage.setItem(k,v);await idbReplaceAll(photos,files,library)
  }
 }
 catch(e){try{Object.keys(localStorage).filter(k=>k.startsWith('mtic_')).forEach(k=>localStorage.removeItem(k));previous.forEach(([k,v])=>localStorage.setItem(k,v))}catch(rollbackError){reportStorageFailure('restaurar el estado anterior del almacenamiento',rollbackError)}throw e}
 location.reload()
}
async function cache(){let n=0;if(window.caches){for(const k of await caches.keys())if(await caches.delete(k))n++}
 try{sessionStorage.clear()}catch(e){reportStorageFailure('limpiar el almacenamiento temporal',e);throw e}
 const FS=PL('Filesystem');if(FS){try{const r=await FS.readdir({path:'',directory:'CACHE'});for(const f of r.files||[]){const nm=f.name||f;if(/\.(xlsx|zip|jpg|jpeg|png)$/i.test(nm)){await FS.deleteFile({path:nm,directory:'CACHE'});n++}}}catch(e){reportStorageFailure('limpiar archivos temporales',e);throw e}}return n}
async function storageSummary(){
 const el=$('#storage-info');if(!el)return;try{if(!(await dbp))throw new Error('El almacenamiento local no está disponible');
  const [photos,files,library]=await Promise.all([idbRange('ph'),idbRange('xl'),idbRange('gallery')]);
  const photoBytes=photos.reduce((n,[,v])=>n+(v.d||'').length*.75,0),fileBytes=files.reduce((n,[,v])=>n+(v.size||v.byteLength||v.length||0),0),galleryBytes=library.reduce((n,[,v])=>n+(v.d||'').length*.75,0),localBytes=Object.keys(localStorage).filter(k=>k.startsWith('mtic_')).reduce((n,k)=>n+(k.length+(localStorage.getItem(k)||'').length)*2,0),total=photoBytes+fileBytes+galleryBytes+localBytes;
  const fmt=n=>n<1024?Math.round(n)+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(1)+' MB';let quota='';
  if(navigator.storage&&navigator.storage.estimate){const est=await navigator.storage.estimate();if(est.quota)quota=' · '+fmt(est.usage||0)+' usados de '+fmt(est.quota)}
  el.textContent='Uso estimado de la app: '+fmt(total)+' · '+photos.length+' fotos de trabajos · '+library.length+' fotos guardadas · '+files.length+' archivos Excel'+quota
 }catch(e){el.textContent='No se pudo calcular el almacenamiento: '+(e.message||e);reportStorageFailure('calcular el almacenamiento',e)}
}