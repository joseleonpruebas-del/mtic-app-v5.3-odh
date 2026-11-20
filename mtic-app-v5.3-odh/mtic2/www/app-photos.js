// ===== fotos
const EXTRA=['p0','p4','p5','p7'],MAP={p1:0,p2:1,p3:2,p6:13,p8:12,p9:17,p10:14,p11:15,p12:19,p13:20,p14:18,p15:21,p16:22,p17:23};
F.P_SLOTS.slice(17,24).forEach(s=>s.only=1);
const slotOf=(ns,k)=>({ns,k,s:ns==='p'?F.P_SLOTS[+k]:(ns==='r'?F.R_SLOTS:ns==='o'?F.O_SLOTS:F.C_SLOTS).find(s=>s.k===k)});
const grp=L=>{const g={};L.forEach(x=>(g[x.s.sec]=g[x.s.sec]||[]).push(x));return Object.keys(g).map(t=>({t:t==='Pruebas necesarias'&&job.mode==='pc'?'Pruebas del correctivo (solo las que faltan)':t,x:g[t]}))};
function groups(){const P=F.P_SLOTS.map((s,i)=>({ns:'p',k:String(i),l:(i+1)+'. '+s.l,s})),C=F.C_SLOTS.map(s=>({ns:'c',k:s.k,l:s.l,s})),m=job.mode;
 if(m==='r')return grp(F.R_SLOTS.map(s=>({ns:'r',k:s.k,l:s.l,s})));if(m==='p')return[{t:'Registro fotográfico del preventivo',x:P}];if(m==='c')return grp(C);
 return[{t:'Registro fotográfico del preventivo',x:P}].concat(grp(C.filter(x=>x.s.sh!=='p'||EXTRA.includes(x.k))))}
const naOf=x=>{const p=PH[x.ns][x.k];return !!((p&&p.na)||(x.ns==='p'&&!(p&&p.d)&&x.s.a&&job.p.a[x.s.a]==='N/A'))};
function watermarkLines(){
 const now=new Date(),date=[pad(now.getDate()),pad(now.getMonth()+1),now.getFullYear()].join('/')+' '+[pad(now.getHours()),pad(now.getMinutes()),pad(now.getSeconds())].join(':');
 const sede=job&&job.f&&(job.f.sede||job.f.sedee)||'',coords=job&&job.f&&String(job.f.coord||'').trim()||fixv&&fixv.c.map(v=>Number(v).toFixed(6)).join(', ');
 return ['IB '+(job&&job.ib||'')+(sede?' - '+sede:''),coords||'Coordenadas no disponibles',date]
}
function card(x){const p=PH[x.ns][x.k],na=naOf(x),a=x.s.ask,at='data-ns="'+x.ns+'" data-k="'+x.k+'"',sapIndex=x.s.sap?F.C_SAP_CELLS.indexOf(x.s.sap):-1,sap=sapIndex>=0&&sapIndex<5?job.c.sr[(x.s.sh==='a'?'r':'i')+sapIndex]:'',sapItem=sap&&EQ.find(e=>String(e[0])===String(sap)),part=x.s.sh==='a'?'retirado':'instalado';
 return '<div class="ph"><b>'+esc(x.l)+'</b>'+(x.s.sap?'<div class="m">SAP automático desde el serial '+part+': '+esc(sap?(sap+' — '+(sapItem?sapItem[1]:'')):'selecciona el SAP en Seriales de equipos')+'</div>':'')+(p&&p.d?'<img src="'+p.d+'">':'<div class="e">'+(na?'N/A':'Sin foto')+'</div>')+
 '<div class="r">'+(x.s.only?'<button data-x="cap" '+at+'>'+(p&&p.d?'Cambiar foto':'Subir foto o captura')+'</button>':'<button data-x="tk" '+at+'>'+(p&&p.d?'Cambiar: tomar foto':'Tomar foto')+'</button><button data-x="gal" '+at+'>'+(a?'Galería (foto)':'Importar del teléfono')+'</button>'+(a?'<button data-x="cap" '+at+'>Captura</button>':''))+'<button data-x="library" '+at+'>Fotos guardadas</button>'+(x.s.only?'':'<button data-x="na" '+at+'>N/A</button>')+(p?'<button data-x="rm" '+at+'>Quitar</button>':'')+'</div></div>'}
function drawP(){const box=$('#ph');if(!box||!job)return;box.innerHTML=groups().map((g,gi)=>{const n=g.x.filter(x=>(PH[x.ns][x.k]&&PH[x.ns][x.k].d)||naOf(x)).length;return '<details data-sec="'+esc(g.t)+'"'+((openS[g.t]!==undefined?openS[g.t]:(job.mode==='p'&&gi===0))?' open':'')+'><summary>'+esc(g.t)+' ('+n+' de '+g.x.length+')</summary>'+g.x.map(card).join('')+'</details>'}).join('')}
async function proc(ns,k,fl,mk){if(mk&&job&&!String(job.f.coord||'').trim()){try{const pos=await getPos();if(pos){fixv=pos;job.f.coordAuto=true;autoCoord(true)}}catch(e){gpsLabel(e.message||'No se pudo obtener la ubicación')}}const r=await mark(fl,mk?watermarkLines():null,{max:photoMaxEdge()});PH[ns][k]=r;const saved=await idbPut('ph',photoKey(ns,k),r);if(saved===null)throw new Error('No se pudo guardar la foto en este dispositivo');drawP()}
async function capturar(onCaptured){
 const Cam=PL('Cam');
 if(Cam&&Cam.capture){
  try{const r=await Cam.capture();if(r&&r.data)await onCaptured(new Blob([Uint8Array.from(atob(r.data),c=>c.charCodeAt(0))],{type:'image/jpeg'}))}
  catch(e){alert('No se pudo abrir la cámara del teléfono: '+(e.message||e))}
  return
 }
 captureHandler=onCaptured;const fi=$('#fi');fi.setAttribute('capture','environment');fi.click()
}
function tomar(ns,k){return capturar(fl=>proc(ns,k,fl,true))}
function galeria(ns,k,mk){ctx={ns,k,mk};const fi=$('#fi');fi.removeAttribute('capture');fi.click()}
