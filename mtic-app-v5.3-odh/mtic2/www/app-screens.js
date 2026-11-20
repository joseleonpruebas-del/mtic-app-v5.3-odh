// ===== pantallas
const MODO={p:'Preventivo',c:'Correctivo',pc:'Preventivo + correctivo',r:'Parada de reloj'};
function body(){const m=job.mode,B=()=>secAct()+secSerP()+secHallP();
 if(m==='r')return general()+secPar()+tecnico()+phSec();
 if(m==='p')return general()+B()+tecnico()+phSec();
 if(m==='c')return general()+secEq()+secSerC()+secFalla()+secAcomp()+tecnico()+phSec()+secObs();
 return general()+B()+'<h1 style="margin-top:18px">Apartados del correctivo</h1>'+secEq()+secSerC()+secFalla()+secAcomp()+tecnico()+phSec()+secObs()}
function bar(){const m=job.mode;return (m==='pc'?'<button class="p" data-x="exp" data-w="both">Generar los dos formatos</button><div class="g2" style="margin-top:8px"><button data-x="exp" data-w="p">Solo preventivo</button><button data-x="exp" data-w="c">Solo correctivo</button></div>':'<button class="p" data-x="exp" data-w="'+m+'">Exportar a Excel</button>')+'<div id="msg" class="m" style="margin:10px 0"></div>'}
function pageHeader(){return '<nav class="page-nav"><button data-x="back">← Atrás</button><button data-x="home">⌂ Inicio</button></nav>'}
function screen(){currentScreen='job';$('#app').innerHTML=pageHeader()+'<h1>IB '+esc(job.ib)+'</h1><div class="m">'+esc(job.f.sede||'Sede sin nombre')+' · '+MODO[job.mode]+'</div>'+body()+bar();drawP();gpsLabel();scrollTo(0,0)}
function updateNetworkStatus(){const n=$('#net');if(!n)return;const online=navigator.onLine!==false;n.classList.toggle('offline',!online);n.textContent=online?'Disponible sin conexión: los datos se guardan en este dispositivo.':'Sin conexión: puedes seguir trabajando; los datos quedan guardados en este dispositivo.'}
function home(){
 currentScreen='home';job=null;galleryTarget=null;gpsOff();
 const allWorks=Object.entries(JI).flatMap(([ib,site])=>(site.works||[]).map(w=>({ib,site,w,record:LS.g(workKey(ib,w.id))}))).sort((a,b)=>(b.w.ts||0)-(a.w.ts||0));
 const due=Object.entries(EQDATA).filter(([,e])=>e&&e.nextDate).map(([code,e])=>({code,e,days:Math.ceil((new Date(e.nextDate+'T00:00:00').getTime()-new Date(today()+'T00:00:00').getTime())/86400000)})).filter(x=>x.days<=30).sort((a,b)=>a.days-b.days);
 const reports=Object.values(JI).reduce((n,s)=>n+(s.xl||[]).length,0),fmtDate=v=>v?new Date(v+'T00:00:00').toLocaleDateString('es-CO'):'Fecha no registrada';
 $('#app').innerHTML='<header class="home-header"><h1>Mantenimientos MinTIC</h1><div id="net" class="net-state"></div></header>'+
 '<section class="s home-start"><h2>Registrar mantenimiento</h2><label>Busca el sitio por su IB<input id="ibin" list="ids" inputmode="numeric" placeholder="Escribe o selecciona el IB"></label><div class="m" id="ibh"></div><button class="p" style="margin-top:8px" data-x="ibgo">Continuar</button></section>'+
 '<div class="home-grid"><button class="home-card" data-x="equipment"><b>Consultar equipo</b><span>Escanear QR o buscar por SAP o serial</span></button><button class="home-card" data-x="codes"><b>QR y códigos de barras</b><span>Abrir lector en una pantalla independiente</span></button><button class="home-card" data-x="reg"><b>Reportes e historial</b><span>'+reports+' informes Excel guardados</span></button><button class="home-card" data-x="photos"><b>Tomar fotos</b><span>Abrir cámara y guardar evidencias</span></button><button class="home-card" data-x="bk"><b>Crear respaldo</b><span>Guardar trabajos, fotos y exportaciones</span></button><button class="home-card" data-x="gallery"><b>Biblioteca de fotos</b><span>Reutilizar evidencias sin conexión</span></button><button class="home-card" data-x="opt"><b>Opciones</b><span>Perfil, cámara y tamaño de fotos</span></button></div><div id="om" class="m home-message"></div>'+
 '<section class="s"><h2>Próximas mantenciones</h2><div class="m">Fechas registradas manualmente en las fichas de equipo.</div>'+(due.length?due.slice(0,4).map(x=>'<button class="activity-row" data-x="eqopen" data-code="'+esc(x.e.code||x.code)+'"><span><b>'+esc(x.e.name||x.e.code||x.code)+'</b><small>'+esc(x.e.location||'Ubicación sin registrar')+' · '+fmtDate(x.e.nextDate)+'</small></span><strong class="'+(x.days<0?'overdue':'')+'">'+(x.days<0?'Vencida':x.days===0?'Hoy':x.days===1?'Mañana':'En '+x.days+' días')+'</strong></button>').join(''):'<div class="m home-empty">No hay mantenciones programadas para los próximos 30 días.</div>')+'</section>'+
 '<section class="s"><h2>Últimas actividades</h2>'+(allWorks.length?allWorks.slice(0,4).map(x=>'<button class="activity-row" data-x="openwork" data-ib="'+esc(x.ib)+'" data-id="'+esc(x.w.id)+'"><span><b>IB '+esc(x.ib)+' · '+esc(MODO[x.w.mode]||x.w.mode)+'</b><small>'+esc(x.w.sede||x.record&&x.record.f&&x.record.f.sede||'Sede sin nombre')+' · '+fmtDate(x.record&&x.record.f&&x.record.f.fecha)+'</small></span><strong>Abrir</strong></button>').join(''):'<div class="m home-empty">Aún no hay trabajos guardados.</div>')+'</section>';
 updateNetworkStatus()
}
function photosScreen(){
 currentScreen='photos';
 $('#app').innerHTML=pageHeader()+'<h1>Tomar fotos</h1><section class="s"><div class="m">Las fotos nuevas se reducen al '+Math.max(10,Math.min(100,+SET.pct||100))+' % configurado ('+photoMaxEdge()+' px como máximo por el lado más largo) al capturarlas y guardarlas.</div><div class="r gallery-actions"><button class="p" data-x="gallery-capture">Abrir cámara</button><button data-x="gallery-import">Importar foto</button></div></section><section class="s"><h2>Fotos guardadas</h2><div class="m">Se guardan en la biblioteca local y, si Android lo permite, en DCIM/MinTIC Mantenimientos.</div><button data-x="photos-gallery">Ver biblioteca</button><button data-x="opt">Ajustar tamaño de foto</button></section><div id="photo-message" class="m"></div>'
}
function codesScreen(){
 currentScreen='codes';
 $('#app').innerHTML=pageHeader()+'<h1>QR y códigos de barras</h1><section class="s"><div class="m">Usa la cámara para leer un código o selecciona una imagen desde el teléfono. El lector funciona sin conexión.</div><button class="p" data-x="codes-scan">Abrir lector</button></section><section class="s"><h2>Consultar equipo</h2><div class="m">También puedes buscar un equipo por SAP, serial o IB.</div><button data-x="equipment">Ir a consulta de equipo</button></section>'
}
const equipmentKey=s=>String(s||'').trim().toLocaleLowerCase().replace(/[\s-]/g,'');
function equipmentHistory(code){
 const q=equipmentKey(code),rows=[];
 for(const[ib,site]of Object.entries(JI))for(const w of site.works||[]){
  const record=LS.g(workKey(ib,w.id));if(!record)continue;
  const tokens=[...Object.values(record.p&&record.p.s||{}),...Object.values(record.c&&record.c.sr||{})].filter(v=>v!=null&&String(v).trim());
  if(q===equipmentKey(ib)||tokens.some(v=>equipmentKey(v)===q))rows.push({ib,site,w,record});
 }
 return rows.sort((a,b)=>(b.w.ts||0)-(a.w.ts||0))
}
function equipmentScreen(){
 currentScreen='equipment';
 $('#app').innerHTML=pageHeader()+'<h1>Ficha de equipo</h1><div class="s"><label>Código SAP, serial o IB<div class="sc"><input id="equip-code" placeholder="Escribe o escanea el código" autocomplete="off"><button data-x="equip-scan">▣ Escanear</button></div></label><button class="p" style="margin-top:8px" data-x="equip-find">Consultar equipo</button></div><div id="equip-profile"></div>'
}
function equipmentProfile(code){
 const raw=String(code||'').trim();if(!raw)return;
 currentScreen='equipment';const key=equipmentKey(raw),stored=EQDATA[key]||{},site=SEED[raw],catalog=EQ.find(x=>equipmentKey(x[0])===key),records=equipmentHistory(raw);
 const latest=records[0],knownSite=latest&&latest.record.f||{},name=stored.name||(catalog&&catalog[1])||(site?'Sitio IB '+raw:raw),location=stored.location||[knownSite.sede||site&&site[3],knownSite.mpio||site&&site[0],knownSite.depto||site&&site[1]].filter(Boolean).join(' · ');
 const next=stored.nextDate||'',date=next?new Date(next+'T00:00:00'):null,days=date?Math.ceil((date.getTime()-new Date(today()+'T00:00:00').getTime())/86400000):null;
 const status=days===null?'Sin programar':days<0?'Mantención vencida':days===0?'Programada para hoy':days===1?'Programada mañana':'Programada en '+days+' días';
 const history=records.length?records.slice(0,8).map(x=>'<div class="equipment-history-row"><div><b>'+esc(MODO[x.w.mode]||x.w.mode||'Mantenimiento')+'</b><div class="m">IB '+esc(x.ib)+' · '+esc(x.record.f&&x.record.f.sede||x.site.sede||'Sede sin nombre')+' · '+esc(x.record.f&&x.record.f.fecha||'Fecha no registrada')+'</div></div><button data-x="openwork" data-ib="'+esc(x.ib)+'" data-id="'+esc(x.w.id)+'">Abrir</button></div>').join(''):'<div class="m">No hay trabajos asociados a este código en el dispositivo.</div>';
 const profile=$('#equip-profile');if(!profile)return;
 profile.innerHTML='<section class="s equipment-card"><div class="m">Código consultado</div><h2>'+esc(raw)+'</h2><label>Nombre o descripción<input id="equip-name" maxlength="120" value="'+esc(name)+'"></label><label>Ubicación<input id="equip-location" maxlength="160" placeholder="Sede, municipio o referencia" value="'+esc(location)+'"></label><label>Próxima mantención<input id="equip-next" type="date" value="'+esc(next)+'"></label><div class="equipment-due">'+esc(status)+'</div><button class="p" data-x="equip-save" data-code="'+esc(raw)+'">Guardar ficha</button></section><section class="s"><h2>Historial de mantenimiento</h2>'+history+'</section>'
}
function saveEquipmentProfile(code){
 const key=equipmentKey(code),next=$('#equip-next').value;
 if(next&&!/^\d{4}-\d{2}-\d{2}$/.test(next))return alert('Ingresa una fecha válida para la próxima mantención.');
 EQDATA[key]=Object.assign({},EQDATA[key],{code:String(code).trim(),name:$('#equip-name').value.trim(),location:$('#equip-location').value.trim(),nextDate:next,updated:Date.now()});
 try{localStorage.setItem('mtic_equipment',JSON.stringify(EQDATA));equipmentProfile(code)}catch(e){alert('No se pudo guardar la ficha del equipo: '+(e.message||e))}
}
function findEquipment(code){
 const box=$('#eq-result');if(!box)return;const raw=String(code||'').trim();if(!raw){box.innerHTML='';return}
 const norm=v=>String(v==null?'':v).trim().toLocaleLowerCase().replace(/[\s-]/g,'');
 const q=norm(raw);if(q.length<2){box.innerHTML='<div class="m">Escribe al menos dos caracteres para buscar.</div>';return}
 const hits=[],add=(kind,title,detail,ib,record)=>hits.push({kind,title,detail,ib,record});
 if(SEED[raw]){const e=SEED[raw];add('Sitio en catálogo','IB '+raw,[e[3],e[2],e[1],e[0]].filter(Boolean).join(' · '),raw,null)}
 const catalog=EQ.find(e=>norm(e[0])===q||norm(e[1])===q);
 if(catalog)add('Equipo en catálogo',catalog[0],catalog[1],null,null);
 for(const [ib,meta]of Object.entries(JI)){
  const savedJobs=(meta.works||[]).map(w=>LS.g(workKey(ib,w.id))).filter(Boolean);if(!savedJobs.length){const legacy=LS.g('mtic_job_'+ib);if(legacy)savedJobs.push(legacy)}
  const fields=[];
  if(norm(ib).includes(q))fields.push('IB');
  for(const saved of savedJobs){
   const collect=(obj,label)=>Object.entries(obj||{}).forEach(([k,v])=>{if(typeof v==='string'&&v.trim()&&norm(v).includes(q))fields.push(label+' '+k)});
   collect(saved.c&&saved.c.sr,'SAP / serial correctivo');collect(saved.c&&saved.c.sap,'SAP de evidencia');collect(saved.p&&saved.p.s,'Serial preventivo')
  }
  const seed=SEED[ib],saved=savedJobs[0],detail=[meta.sede||saved&&saved.f&&saved.f.sede,meta.mpio||saved&&saved.f&&saved.f.mpio,seed&&seed[1]].filter(Boolean).join(' · ');
  if(fields.length)add(fields.includes('IB')?'Sitio':'Coincidencia de equipo',fields.includes('IB')?'IB '+ib:fields.slice(0,4).join(', '),detail,ib,saved)
 }
 box.innerHTML=hits.length?'<div class="m">'+hits.length+' coincidencia(s) localizadas:</div>'+hits.map(h=>'<article class="equipment-match"><b>'+esc(h.title)+'</b><div class="m">'+esc(h.kind)+(h.detail?' · '+esc(h.detail):'')+'</div>'+(h.ib?'<div class="r"><button data-x="openib" data-ib="'+esc(h.ib)+'">Abrir historial del sitio</button></div>':'')+'</article>').join(''):'<div class="equipment-match"><b>No se encontró el código</b><div class="m">Verifica el IB, SAP o serial, o guarda primero un mantenimiento con ese dato.</div></div>'
}
async function galleryScreen(){
 currentScreen='gallery';const target=galleryTarget,items=(await idbRange('gallery')).map(([id,p])=>Object.assign({id},p)).sort((a,b)=>(b.ts||0)-(a.ts||0));
 $('#app').innerHTML=pageHeader()+'<h1>Fotos guardadas</h1><div class="m">Las fotos tomadas se guardan con marca de agua en la app y, si Android lo permite, en DCIM/MinTIC Mantenimientos. Las fotos importadas desde archivos se conservan sin modificar.</div><div class="r gallery-actions"><button data-x="gallery-capture">Tomar foto</button><button data-x="gallery-import">Importar foto</button><button data-x="gallery-view" data-view="grid" class="'+(galleryView==='grid'?'p':'')+'">Miniaturas</button><button data-x="gallery-view" data-view="list" class="'+(galleryView==='list'?'p':'')+'">Lista</button></div><div class="gallery-grid '+(galleryView==='list'?'gallery-list':'gallery-thumbnails')+'">'+(items.length?items.map(p=>'<article class="gallery-item"><img src="'+p.d+'" alt="Foto guardada"><div class="m">'+new Date(p.ts||0).toLocaleString('es-CO')+' · '+Math.round((p.d||'').length*0.75/1024)+' KB</div><div class="r">'+(target?'<button data-x="usephoto" data-id="'+esc(p.id)+'">Usar en formato</button>':'')+'<button data-x="gallery-delete" data-id="'+esc(p.id)+'">Borrar</button></div></article>').join(''):'<div class="s m">Todavía no hay fotos. Usa “Tomar foto” o “Importar foto” para crear tu biblioteca.</div>')+'</div>';
}
async function saveGalleryPhoto(file,watermark){
 const info=await mark(file,watermark?watermarkLines():null,{max:photoMaxEdge()}),id=newWorkId(),name='MinTIC_'+new Date().toISOString().replace(/[:.]/g,'-')+'.jpg';
 if(navigator.storage&&navigator.storage.estimate){const est=await navigator.storage.estimate();if(est.quota&&est.usage/est.quota>.9&&!confirm('El almacenamiento del teléfono está casi lleno. ¿Intentar guardar la foto de todos modos?'))return}
 const saved=await idbPut('gallery',id,{d:info.d,w:info.w,h:info.h,ts:Date.now(),name});if(saved===null)throw new Error('No se pudo guardar la foto dentro de la app');
 const Cam=PL('Cam');let dest='';if(Cam&&Cam.saveToGallery){try{const r=await Cam.saveToGallery({data:info.d.split(',')[1],name});dest=r&&r.uri?' También se guardó en DCIM/MinTIC Mantenimientos.':''}catch(e){dest=' No se pudo copiar a DCIM: '+(e.message||e)+'. La foto sigue guardada en la app.'}}
 toast('Foto guardada en la biblioteca.'+dest);setTimeout(()=>toast(''),3500);return id
}
async function useSavedPhoto(id){
 const p=await idbGet('gallery',id),t=galleryTarget;if(!p||!t)return alert('No se pudo encontrar la foto guardada.');
 if(!job)return alert('Abre primero un formato de mantenimiento.');
 try{await proc(t.ns,t.k,dataUrlBlob(p.d));galleryTarget=null;galleryReturnScreen='home';screen()}catch(e){alert('No se pudo usar la foto: '+(e.message||e))}
}
function dataUrlBlob(data){const m=data.match(/^data:([^;]+);base64,(.+)$/);if(!m)throw new Error('La foto guardada tiene un formato no válido');return new Blob([Uint8Array.from(atob(m[2]),c=>c.charCodeAt(0))],{type:m[1]})}
function sheet(h){const o=document.createElement('div');o.className='ov';o.id='ov';o.innerHTML='<div>'+h+'</div>';document.body.appendChild(o)}
function gate(ib){const e=SEED[ib],meta=JI[ib],works=(meta&&meta.works||[]).slice().sort((a,b)=>(b.ts||0)-(a.ts||0)),ex=works.length||LS.g('mtic_job_'+ib),mode=works.length?works[0].mode:ex&&ex.mode,b=(m,t)=>'<button data-x="mode" data-m="'+m+'" data-ib="'+esc(ib)+'">'+t+'</button>';
 sheet('<b>IB '+esc(ib)+(e?' · '+esc(e[3]):'')+'</b><div class="m">'+(!e?'Este IB no está en la semilla: llenarás los datos a mano. ':'')+(ex?'Se iniciará un borrador nuevo y vacío ('+MODO[mode]+'). Los trabajos y fotos anteriores seguirán en el historial.':'¿Qué formato vas a realizar?')+'</div>'+b('p','Solo preventivo')+b('c','Solo correctivo')+b('pc','Preventivo y correctivo (los dos en una sola pantalla)')+b('r','Parada de reloj')+'<button data-x="ovx">Cancelar</button>')}
async function startJob(ib,mode){
 const j=freshJob(ib,mode),site=JI[ib],e=SEED[ib];
 if(e){j.f.mpio=e[0];j.f.depto=e[1];j.f.cpob=e[2];j.f.sede=e[3];j.f.idmin=e[4]}
 let previous=null;for(const w of (site&&site.works||[]).slice().sort((a,b)=>(b.ts||0)-(a.ts||0))){previous=LS.g(workKey(ib,w.id));if(previous)break}if(!previous)previous=LS.g('mtic_job_'+ib);
 const keep=['depto','mpio','cpob','sede','idmin','resp','cedr','telr','mailr','coord'];
 if(previous&&previous.f)keep.forEach(k=>{if(previous.f[k])j.f[k]=previous.f[k]});
 job=j;PH={p:{},c:{},r:{}};sv();gpsOn();screen();autoCoord()
}
async function openJob(ib,mode,id){
 let j=id?LS.g(workKey(ib,id)):null;
 if(!j&&!id){const works=(JI[ib]&&JI[ib].works||[]).slice().sort((a,b)=>(b.ts||0)-(a.ts||0));for(const w of works){j=LS.g(workKey(ib,w.id));if(j)break}}
 if(!j)j=LS.g('mtic_job_'+ib);
 if(!j)return startJob(ib,mode);
 const legacy=!j.id,oldPhotos=legacy?await idbRange('ph',ib+'|'):[];const d=freshJob(ib,mode,j.id||id||newWorkId());j.f=Object.assign({},d.f,j.f);j.p=Object.assign({},d.p,j.p);j.c=Object.assign({},d.c,j.c);j.r=Object.assign({},d.r,j.r);j.xl=j.xl||[];j.id=d.id;j.mode=mode||j.mode;job=j;PH={p:{},c:{},r:{}};
 if(legacy)for(const[k,v]of oldPhotos){const s=String(k).split('|');if(s.length===3&&PH[s[1]])await idbPut('ph',photoKey(s[1],s[2]),v)}
 const prefix=photoPrefix(j);
 (await idbRange('ph',prefix)).forEach(([k,v])=>{const s=k.split('|'),off=j.id?2:1;if(PH[s[off]])PH[s[off]][s[off+1]]=v});
 sv();gpsOn();screen();autoCoord()
}
function reg(){
 currentScreen='history';const L=Object.values(JI).sort((a,b)=>b.ts-a.ts),fm=t=>new Date(t||0).toLocaleString('es-CO');
 const blk=(j,t)=>{const xs=(j.xl||[]).filter(x=>x.t===t).sort((a,b)=>b.ts-a.ts);return '<b class="hist-type">'+({p:'Preventivo',c:'Correctivo',r:'Parada de reloj',o:'ODH · Correctivo'})[t]+'</b>'+(xs.length?xs.map(x=>'<div class="hist-file"><div class="hist-filename">'+esc(x.fn)+'</div><div class="r hist-file-actions"><button data-x="xs" data-id="'+x.id+'">Compartir</button><button data-x="xd" data-ib="'+esc(j.ib)+'" data-id="'+x.id+'">Borrar</button></div><div class="m">'+fm(x.ts)+' · '+Math.round(x.size/1024)+' KB</div></div>').join(''):'<div class="m">Sin exportar todavía</div>')};
 const sites=L.map(j=>{
  const search=[j.ib,j.sede,j.mpio,MODO[j.mode],...(j.xl||[]).map(x=>x.fn),...(j.works||[]).map(w=>w.mode+' '+w.sede)].join(' ').toLocaleLowerCase();
  const works=(j.works||[]).slice().sort((a,b)=>(b.ts||0)-(a.ts||0)).map(w=>'<details class="work-item"><summary>'+esc(MODO[w.mode]||w.mode)+' · '+fm(w.ts)+'</summary><div class="m">'+esc(w.sede||'Sede sin nombre')+' · '+esc(w.mpio||'')+'</div><div class="r hist-actions"><button data-x="openwork" data-ib="'+esc(j.ib)+'" data-id="'+esc(w.id)+'">Continuar borrador</button></div></details>').join('')||'<div class="m">Sin borradores previos.</div>';
  return '<details class="hist-item" data-search="'+esc(search)+'"><summary><span>IB '+esc(j.ib)+'</span><span class="hist-site-name">'+esc(j.sede||'sin sede')+'</span><span class="m">'+(j.works||[]).length+' trabajos</span></summary><div class="m">'+esc(j.mpio||'')+' · Último registro '+fm(j.ts)+'</div><div class="r hist-actions"><button data-x="openib" data-ib="'+esc(j.ib)+'">Abrir último trabajo</button><button data-x="delib" data-ib="'+esc(j.ib)+'">Eliminar sitio</button></div>'+works+['p','c','r','o'].filter(t=>(j.xl||[]).some(x=>x.t===t)).map(t=>blk(j,t)).join('')+'</details>'
 }).join('');
 $('#app').innerHTML=pageHeader()+'<h1>Historial de sitios</h1><div class="m">Busca por IB, sede, municipio o nombre de archivo. Los informes exportados también se guardan aquí.</div><input id="reg-filter" placeholder="Buscar en el historial" autocomplete="off">'+(L.length?sites:'<div class="s m">Todavía no hay sitios. Empieza desde Inicio con un IB.</div>')
}
async function opt(){currentScreen='options';
 $('#app').innerHTML=pageHeader()+'<h1>Opciones</h1>'+
 '<div class="s"><h2>Perfil (opcional)</h2><div class="m">Si lo llenas, se aplica solo en los datos del técnico de los dos formatos.</div>'+[['nom','Nombre completo'],['ced','Cédula'],['tel','Teléfono'],['mail','Correo']].map(a=>'<label>'+a[1]+'<input data-pf="'+a[0]+'"'+(['ced','tel'].includes(a[0])?' type="tel" inputmode="numeric" pattern="[0-9]*" data-num="1"':'')+' value="'+esc(PROF[a[0]])+'"></label>').join('')+'<label>Firma (imagen)<input type="file" accept="image/*" data-sig="pf"></label><div id="fp">'+(PROF.firma?'<img src="'+PROF.firma.d+'" style="height:60px;background:#fff;border-radius:6px;margin-top:6px"> <button data-x="sigq">Quitar firma</button>':'')+'</div></div>'+
 '<div class="s"><h2>Resolución de fotos</h2><label>Resolución máxima de las evidencias ('+photoMaxEdge()+' px por el lado más largo)<select data-set="pct">'+[[100,'100 % (1280 px)'],[75,'75 % (960 px)'],[50,'50 % (640 px)'],[35,'35 % (448 px)'],[25,'25 % (320 px)']].map(a=>'<option value="'+a[0]+'"'+(!SET.custom&&SET.pct===a[0]?' selected':'')+'>'+a[1]+'</option>').join('')+'<option value="custom"'+(SET.custom||![100,75,50,35,25].includes(SET.pct)?' selected':'')+'>Personalizado</option></select></label>'+(SET.custom||![100,75,50,35,25].includes(SET.pct)?'<label>Porcentaje personalizado (10 a 100)<input type="number" min="10" max="100" step="1" inputmode="numeric" data-set="pctc" value="'+Math.max(10,Math.min(100,SET.pct))+'"></label>':'')+'<div class="m">El porcentaje se aplica inmediatamente al tomar o importar fotos nuevas, antes de guardarlas. También limita las imágenes que se insertan al exportar y ayuda a reducir el tamaño del Excel. No modifica fotos ya guardadas.</div></div>'+
 '<div class="s"><h2>Datos y almacenamiento</h2><div class="m" id="storage-info">Calculando espacio utilizado...</div><div class="r"><button data-x="storage">Actualizar espacio</button><button data-x="bk">Exportar backup completo</button><button data-x="rs">Cargar backup</button></div><div class="r" style="margin-top:8px"><button data-x="cc">Limpiar caché</button><button data-x="ca">Limpieza total</button></div><div class="m">Los datos se guardan en este dispositivo y no se sincronizan en internet. La limpieza total borra sitios, fotos, archivos, perfil y opciones.</div><div class="m" id="om"></div></div>';storageSummary()}
