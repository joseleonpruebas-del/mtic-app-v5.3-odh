const $=s=>document.querySelector(s),pad=n=>String(n).padStart(2,'0'),F=FORMS;
const today=()=>{const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
const LS={g:k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},s:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const XLSX_T='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
// ===== almacenamiento de fotos y copias en IndexedDB
const dbp=new Promise(r=>{try{const q=indexedDB.open('mtic3',2);q.onupgradeneeded=()=>{for(const n of ['ph','xl','gallery'])if(!q.result.objectStoreNames.contains(n))q.result.createObjectStore(n)};q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)}catch(e){r(null)}});
const tx=async(st,md,fn)=>{const d=await dbp;if(!d)return null;return new Promise(res=>{try{const t=d.transaction(st,md),r=fn(t.objectStore(st));t.oncomplete=()=>res(r&&r.result!==undefined?r.result:true);t.onerror=()=>res(null);t.onabort=()=>res(null)}catch(e){res(null)}})};
const idbPut=(s,k,v)=>tx(s,'readwrite',o=>o.put(v,k));
async function idbDel(s,k){const result=await tx(s,'readwrite',o=>o.delete(k));if(s==='xl'){for(const[key]of await idbRange('xl'))if(String(key).endsWith('|export|'+k))await tx(s,'readwrite',o=>o.delete(key))}return result}
async function idbGet(s,k){let value=await tx(s,'readonly',o=>o.get(k));if(value===undefined&&s==='xl'){for(const[key,v]of await idbRange('xl'))if(String(key).endsWith('|export|'+k)){value=v;break}}return value}
const idbClr=s=>tx(s,'readwrite',o=>o.clear());
async function idbClearAll(){const d=await dbp;if(!d)throw new Error('No se pudo abrir la base de datos local');return new Promise((resolve,reject)=>{let t;try{t=d.transaction(['ph','xl','gallery'],'readwrite');for(const n of ['ph','xl','gallery'])t.objectStore(n).clear();t.oncomplete=()=>resolve(true);t.onerror=()=>reject(t.error||new Error('No se pudieron borrar los datos locales'));t.onabort=()=>reject(t.error||new Error('Se canceló el borrado de datos locales'))}catch(e){reject(e)}})}
async function idbReplaceAll(photos,files,library=[]){const d=await dbp;if(!d)throw new Error('No se pudo abrir la base de datos local');return new Promise((resolve,reject)=>{let t;try{t=d.transaction(['ph','xl','gallery'],'readwrite');const p=t.objectStore('ph'),x=t.objectStore('xl'),g=t.objectStore('gallery');p.clear();x.clear();g.clear();photos.forEach(([k,v])=>p.put(v,k));files.forEach(([k,v])=>x.put(v,k));library.forEach(([k,v])=>g.put(v,k));t.oncomplete=()=>resolve(true);t.onerror=()=>reject(t.error||new Error('No se pudieron restaurar los datos locales'));t.onabort=()=>reject(t.error||new Error('Se canceló la restauración de datos locales'))}catch(e){reject(e)}})}
async function idbMergeAll(photos,files,library=[]){
 const d=await dbp;if(!d)throw new Error('No se pudo abrir la base de datos local');
 const [oldPhotos,oldFiles,oldLibrary]=await Promise.all([idbRange('ph'),idbRange('xl'),idbRange('gallery')]);
 const keys=[oldPhotos,oldFiles,oldLibrary].map(rows=>new Set(rows.map(([k])=>k)));
 const rows=[[photos,keys[0]],[files,keys[1]],[library,keys[2]]];
 return new Promise((resolve,reject)=>{let t;try{
  t=d.transaction(['ph','xl','gallery'],'readwrite');
  rows.forEach(([items,existing],i)=>{const store=t.objectStore(['ph','xl','gallery'][i]);items.forEach(([k,v])=>{if(!existing.has(k))store.put(v,k)})});
  t.oncomplete=()=>resolve(true);t.onerror=()=>reject(t.error||new Error('No se pudieron mezclar los datos locales'));t.onabort=()=>reject(t.error||new Error('Se canceló la mezcla de los datos locales'))
 }catch(e){reject(e)}})
}
async function idbRange(s,pre){const d=await dbp;if(!d)return[];return new Promise(r=>{const o=[];try{const q=d.transaction(s).objectStore(s).openCursor(pre?IDBKeyRange.bound(pre,pre+'\uffff'):null);q.onsuccess=()=>{const c=q.result;if(c){o.push([c.key,c.value]);c.continue()}else r(o)};q.onerror=()=>r(o)}catch(e){r(o)}})}
// ===== estado
const NAD=['2.4','2.5','2.6','2.7','3','3.1'],PM={tecn:'nom',tecd:'ced',tect:'tel',tecm:'mail'};
const SET=Object.assign({cam:'app',pct:35},LS.g('mtic_set')||{});
const PROF=Object.assign({nom:'',ced:'',tel:'',mail:'',firma:null},LS.g('mtic_prof')||{});
const tec=Object.assign({tecc:'Técnico MinTIC',nocn:'Autogestion',nocc:'Autogestion'},LS.g('mtic_tec')||{});
function applyProf(){Object.keys(PM).forEach(k=>{if(PROF[PM[k]])tec[k]=PROF[PM[k]]});LS.s('mtic_tec',tec)}applyProf();
let JI=LS.g('mtic_jobs')||{},EQDATA=LS.g('mtic_equipment')||{},job=null,PH={p:{},c:{},r:{}},firmaF=LS.g('mtic_firma'),openS={},fixv=null,wid=null,ctx=null,captureHandler=null,currentScreen='home',galleryTarget=null,galleryReturnScreen='home',galleryView=LS.g('mtic_gallery_view')==='list'?'list':'grid';
const newWorkId=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
const workKey=(ib,id)=>'mtic_job_'+ib+'_'+id;
const photoPrefix=j=>j&&j.id?j.ib+'|'+j.id+'|':j.ib+'|';
const photoKey=(ns,k)=>photoPrefix(job)+ns+'|'+k;
function migrateWorkIndex(){
 const previous=LS.g('mtic_sites')||{},ids=new Set([...Object.keys(previous),...Object.keys(JI)]);
 for(let i=0;i<localStorage.length;i++){const m=(localStorage.key(i)||'').match(/^mtic_job_(\d+)_(.+)$/);if(m)ids.add(m[1])}
 for(const ib of ids){
  const old=previous[ib]||{},meta=JI[ib]||{},works=Array.isArray(meta.works)?meta.works.slice():[],add=(w)=>{
   if(!w||!w.id||works.some(x=>x.id===w.id))return;
   const saved=LS.g(workKey(ib,w.id));
   works.push(Object.assign({},w,{mode:(saved&&saved.mode)||w.mode||'p',sede:(saved&&saved.f&&saved.f.sede)||w.sede||'',mpio:(saved&&saved.f&&saved.f.mpio)||w.mpio||''}))
  };
  (old.jobs||[]).forEach(add);
  for(let i=0;i<localStorage.length;i++){
   const m=(localStorage.key(i)||'').match(new RegExp('^mtic_job_'+ib+'_(.+)$'));
   if(m){const saved=LS.g(workKey(ib,m[1]));add({id:m[1],mode:saved&&saved.mode,ts:saved&&saved.ts})}
  }
  if(works.length||Object.keys(meta).length||old.jobs){
   JI[ib]=Object.assign({},meta,{ib,works,xl:meta.xl||[]})
  }
 }
 try{localStorage.setItem('mtic_jobs',JSON.stringify(JI));if(localStorage.getItem('mtic_sites')!==null)localStorage.removeItem('mtic_sites')}
 catch(e){console.error('No se pudo completar la migración del historial de trabajos:',e)}
}
migrateWorkIndex();
const freshJob=(ib,mode,id=newWorkId())=>({ib,id,mode,xl:[],f:{fecha:today(),idben:ib,coordAuto:true,place:'float'},p:{a:{},s:{},hall:'',imc:'N/A'},c:{q:{},sr:{},sap:{},hall:''},r:{p1:{},p2:{},p3:{},p4:{},obs:''}});
const sv=()=>{if(!job)return;LS.s(workKey(job.ib,job.id),job);const f=job.f,site=Object.assign({xl:[],works:[]},JI[job.ib]);site.ib=job.ib;site.sede=f.sede||site.sede||'';site.mpio=f.mpio||site.mpio||'';site.mode=job.mode;site.ts=Date.now();site.works=site.works||[];const meta=Object.assign({},site.works.find(w=>w.id===job.id),{id:job.id,mode:job.mode,sede:site.sede,mpio:site.mpio,ts:site.ts,xl:(job.xl||[]).map(x=>x.id)});site.works=site.works.filter(w=>w.id!==job.id).concat(meta);JI[job.ib]=site;LS.s('mtic_jobs',JI);LS.s('mtic_tec',tec)};
const gp=p=>p.split('/').reduce((o,k)=>o==null?o:o[k],job);
const sp=(p,v)=>{const a=p.split('/'),l=a.pop();a.reduce((o,k)=>o[k]=o[k]||{},job)[l]=v};
const CAP=()=>{const c=window.Capacitor;return c&&c.isNativePlatform&&c.isNativePlatform()?c:null};
const PL=n=>{const c=CAP();return c&&c.Plugins&&c.Plugins[n]};
