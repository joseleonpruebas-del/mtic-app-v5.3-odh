// ===== ODH (programa aparte): correctivo MTI-F08, con su propia semilla.
// No modifica el flujo de 7K: se engancha a las funciones existentes solo cuando el trabajo es de ODH (modo 'o').
MODO.o='ODH correctivo';
document.head.insertAdjacentHTML('beforeend','<style>.odh-start{border-left:4px solid var(--ac)}</style>');
document.body.insertAdjacentHTML('beforeend','<datalist id="ids-odh">'+Object.keys(SEED_ODH).map(k=>'<option value="'+k+'">'+esc(SEED_ODH[k][6])+'</option>').join('')+'</datalist>');
const ODH_KEEP=['resp','cedr','telr','mailr','coord'];
function odhNewJob(ib){
 const j=freshJob(ib,'o'),e=SEED_ODH[ib];j.o={q:{},sr:{},hall:'',acn:'',acc:'',acd:'',act1:'',act2:'',acm:'',obsP:'',obsA:'',obsD:''};
 if(e){j.f.claro=e[0];j.f.res=e[1];j.f.cpob=e[2];j.f.daneI=e[3];j.f.nomI=e[4];j.f.daneS=e[5];j.f.sede=e[6]}
 return j
}
async function startOdh(ib){
 const j=odhNewJob(ib),site=JI[ib];let previous=null;
 for(const w of (site&&site.works||[]).filter(w=>w.mode==='o').sort((a,b)=>(b.ts||0)-(a.ts||0))){previous=LS.g(workKey(ib,w.id));if(previous)break}
 if(previous&&previous.f)ODH_KEEP.forEach(k=>{if(previous.f[k])j.f[k]=previous.f[k]});
 job=j;PH={p:{},c:{},r:{},o:{}};sv();gpsOn();screen();autoCoord()
}
async function openOdh(ib,id){
 let j=id?LS.g(workKey(ib,id)):null;
 if(!j){for(const w of ((JI[ib]&&JI[ib].works)||[]).filter(w=>w.mode==='o').sort((a,b)=>(b.ts||0)-(a.ts||0))){j=LS.g(workKey(ib,w.id));if(j)break}}
 if(!j)return startOdh(ib);
 const d=odhNewJob(ib);j.f=Object.assign({},d.f,j.f);j.o=Object.assign({},d.o,j.o);j.xl=j.xl||[];j.mode='o';j.q=j.q||{};job=j;PH={p:{},c:{},r:{},o:{}};
 (await idbRange('ph',photoPrefix(j))).forEach(([k,v])=>{const s=k.split('|'),off=j.id?2:1;if(PH[s[off]])PH[s[off]][s[off+1]]=v});
 sv();gpsOn();screen();autoCoord()
}
function odhGate(ib){
 const e=SEED_ODH[ib],works=((JI[ib]&&JI[ib].works)||[]).filter(w=>w.mode==='o');
 if(!e&&!confirm('Este IB no está en la semilla de ODH. ¿Continuar y llenar los datos a mano?'))return;
 if(!works.length)return startOdh(ib);
 sheet('<b>ODH · IB '+esc(ib)+(e?' · '+esc(e[6]):'')+'</b><div class="m">Ya hay un trabajo ODH de este IB.</div><button data-x="odhmode" data-m="new" data-ib="'+esc(ib)+'">Nuevo borrador vacío</button><button data-x="odhmode" data-m="last" data-ib="'+esc(ib)+'">Continuar el último</button><button data-x="ovx">Cancelar</button>')
}
// ---- formulario ODH
const OSAP=(p,l,blank)=>{const v=String(gp(p)||'');return '<label>'+l+'<select data-b="'+p+'"><option value="">'+blank+'</option>'+(v&&!EQ_ODH.some(e=>e[0]===v)?'<option value="'+esc(v)+'" selected>'+esc(v)+'</option>':'')+EQ_ODH.map(e=>'<option value="'+esc(e[0])+'"'+(v===e[0]?' selected':'')+'>'+esc(e[0]+' — '+e[1])+'</option>').join('')+'</select></label>'};
function odhGeneral(){return '<div class="s"><h2>Información general</h2><label>Colocar las fotos e imágenes en el Excel<select data-b="f/place"><option value="float"'+(job.f.place!=='cell'?' selected':'')+'>Sobre las celdas</option><option value="cell"'+(job.f.place==='cell'?' selected':'')+'>Dentro de la celda</option></select></label><div class="g2"><label>Contratista<input disabled value="'+F.FIX.contratista+'"></label>'+I('f/res','Resolución',{im:'numeric'})+'</div>'+
 I('f/idben','ID beneficiario (IB)',{ro:1})+I('f/claro','ID CLARO')+I('f/im','No. de caso IM (solo números)',{im:'numeric'})+I('f/fecha','Fecha',{t:'date'})+
 I('f/daneI','Código DANE institución')+I('f/nomI','Nombre de la institución')+I('f/daneS','Código DANE sede')+I('f/sede','Nombre de la sede')+I('f/cpob','Centro poblado')+
 I('f/resp','Nombre del responsable IE')+I('f/cedr','Número de cédula del responsable',{n:1})+I('f/telr','Teléfono de contacto',{n:1})+I('f/mailr','Correo electrónico')+
 I('f/coord','Coordenadas del sitio (latitud, longitud)')+'<div class="m" id="gl"></div><div class="r" style="margin-top:6px"><button data-x="gps">Usar GPS ahora</button></div>'+
 '<div class="m">Las fotos tomadas incluyen una marca de agua con IB y sede, coordenadas y fecha. Las imágenes importadas conservan su contenido original.</div></div>'}
const odhEq=()=>'<div class="s"><h2>Equipos instalados / retirados (cantidad 1 a 4)</h2><div class="m">Lo que dejes vacío queda como N/A, igual que la plantilla.</div><input id="flt" placeholder="Buscar equipo o SAP"><div class="eq m"><span></span><span>Retirado</span><span>Instalado</span></div>'+EQ_ODH.map((e,i)=>'<div class="eq" data-t="'+esc((e[0]+' '+e[1]).toLowerCase())+'"><span>'+e[0]+'<br>'+esc(e[1])+'</span><input type="number" min="1" max="4" inputmode="numeric" data-b="o/q/r'+i+'" value="'+esc(gp('o/q/r'+i))+'"><input type="number" min="1" max="4" inputmode="numeric" data-b="o/q/i'+i+'" value="'+esc(gp('o/q/i'+i))+'"></div>').join('')+'</div>';
function odhSer(){let h='';for(let i=0;i<5;i++)h+='<div class="g2" style="margin-top:6px"><div>'+OSAP('o/sr/r'+i,'SAP retirado '+(i+1),'Selecciona código SAP')+SI('o/sr/rs'+i,'Serial retirado')+'</div><div>'+OSAP('o/sr/i'+i,'SAP instalado '+(i+1),'Igual al retirado')+SI('o/sr/is'+i,'Serial instalado')+'</div></div>';
 h+='<div class="g2" style="margin-top:6px"><div>'+OSAP('o/sr/r5','SAP retirado 6 (solo para la foto #6)','Sin SAP')+'</div><div>'+OSAP('o/sr/i5','SAP instalado 6','Igual al retirado')+'</div></div>';
 return '<div class="s"><h2>Serial de equipos retirados e instalados</h2><div class="m">Si no eliges SAP instalado, se usa el mismo SAP del retirado. Escribe o escanea los seriales.</div>'+h+'</div>'}
const odhFalla=()=>'<div class="s"><h2>Descripción de la falla / hallazgos</h2>'+TA('o/hall','',4)+'</div>';
const odhAcomp=()=>'<div class="s"><h2>Quien acompaña en la institución educativa</h2>'+I('o/acn','Nombres y apellidos')+I('o/acc','Cargo')+I('o/acd','Número de cédula',{n:1})+I('o/act1','Teléfono o celular 1',{n:1})+I('o/act2','Teléfono o celular 2',{n:1})+I('o/acm','Correo electrónico')+'</div>';
const odhObs=()=>'<div class="s"><h2>Observaciones</h2>'+TA('o/obsP','Pruebas necesarias',2)+TA('o/obsA','Registro antes',2)+TA('o/obsD','Registro después',2)+'</div>';
function odhBody(){return odhGeneral()+odhEq()+odhSer()+odhFalla()+odhAcomp()+tecnico().replace('Datos de quien repara y del NOC','Quien repara el servicio')+phSec()+odhObs()}
const odhBar=()=>'<button class="p" data-x="exp" data-w="o">Exportar a Excel</button><div id="msg" class="m" style="margin:10px 0"></div>';
const odhGroups=()=>grp(F.O_SLOTS.map(s=>({ns:'o',k:s.k,l:s.l,s})));
async function exportarOdh(){
 const m=$('#msg'),f=job.f;
 if(!F.digits(f.im)){alert('Falta el No. de caso IM: se usa en el nombre del archivo.');return}
 if(!f.fecha){alert('Falta la fecha.');return}
 const warn=[];if(!F.coord(f.coord))warn.push('coordenadas');if(!f.sede)warn.push('nombre de la sede');
 if(warn.length&&!confirm('Falta: '+warn.join(', ')+'. ¿Continuar?'))return;
 m.textContent='Generando Excel...';
 try{const fm=signature(),ph={},total=F.O_SLOTS.filter(s=>PH.o[s.k]&&PH.o[s.k].d).length;let n=0;
  for(const s of F.O_SLOTS){const p=PH.o[s.k];if(p&&p.d){n++;m.textContent='Optimizando foto '+n+' de '+total+' para el Excel...';ph[s.k]=await excelPhoto(p);await new Promise(requestAnimationFrame)}else if(p&&p.na)ph[s.k]={na:1}}
  const spec=F.odhSpec(f,job.o,tec,ph,fm,naImg(),f.place),fn=F.odhFile(f),u=await XL.fill(TPL.odh,spec),id=Date.now()+'-o';
  await idbPut('xl',id,u);JI[job.ib].xl=(JI[job.ib].xl||[]).concat([{id,t:'o',fn,ts:Date.now(),size:u.size||u.length}]);LS.s('mtic_jobs',JI);
  await guardar([{u8:u,fn}]);m.textContent='Listo: '+fn+'. Queda una copia en el Registro.'}
 catch(e){m.textContent=(e&&(e.code==='declined'||/cancel/i.test(e.message||'')))?'Cancelado (la copia sí quedó en el Registro).':'No se pudo exportar: '+((e&&e.message)||e)}
}
// ---- enganches (solo actúan cuando el trabajo es ODH)
{const _home=home,_body=body,_bar=bar,_groups=groups,_exportar=exportar,_openJob=openJob;
 home=function(){_home();const s=document.querySelector('.home-start');if(!s)return;const h=s.querySelector('h2');if(h)h.textContent='7K · Registrar mantenimiento';
  s.insertAdjacentHTML('afterend','<section class="s home-start odh-start"><h2>ODH · Registrar correctivo</h2><label>Busca el sitio por su IB<input id="ibin-odh" list="ids-odh" inputmode="numeric" placeholder="Escribe o selecciona el IB de ODH"></label><div class="m" id="ibh-odh"></div><button class="p" style="margin-top:8px" data-x="odhgo">Continuar con ODH</button></section>')};
 body=function(){return job&&job.mode==='o'?odhBody():_body()};
 bar=function(){return job&&job.mode==='o'?odhBar():_bar()};
 groups=function(){return job&&job.mode==='o'?odhGroups():_groups()};
 exportar=function(w){return w==='o'?exportarOdh():_exportar(w)};
 openJob=async function(ib,mode,id){if(mode==='o')return openOdh(ib,id);return _openJob(ib,mode,id)};
}
document.addEventListener('input',e=>{const t=e.target;if(t.id==='ibin-odh'){const v=t.value.trim(),r=SEED_ODH[v];$('#ibh-odh').textContent=r?r[6]+' · '+r[4]+' · '+r[2]:(v.length>=4?'Este IB no está en la semilla de ODH: podrás llenar los datos a mano.':'')}});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-x]');if(!b)return;const d=b.dataset;
 if(d.x==='odhgo'){const v=($('#ibin-odh').value||'').trim();if(!v)return alert('Escribe el IB de ODH.');odhGate(v)}
 else if(d.x==='odhmode'){const o=$('#ov');if(o)o.remove();if(d.m==='new')await startOdh(d.ib);else await openOdh(d.ib)}});
