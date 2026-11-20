// Eventos de la interfaz
document.addEventListener('input',e=>{const t=e.target,d=t.dataset;
 if(d.num==='1'){const clean=t.value.replace(/\D/g,'');if(clean!==t.value){const pos=t.selectionStart;t.value=clean;if(pos!==null)t.setSelectionRange(Math.min(pos,clean.length),Math.min(pos,clean.length))}}
 if(t.id==='flt'){const q=t.value.toLowerCase();document.querySelectorAll('.eq[data-t]').forEach(r=>r.classList.toggle('hid',!r.dataset.t.includes(q)));return}
 if(t.id==='device-code'){findEquipment(t.value);return}
 if(t.id==='reg-filter'){const q=t.value.trim().toLocaleLowerCase();document.querySelectorAll('.hist-item').forEach(r=>r.classList.toggle('hid',!r.dataset.search.includes(q)));return}
 if(t.id==='ibin'){const v=t.value.trim(),r=SEED[v];$('#ibh').textContent=r?r[3]+' · '+r[0]:(v.length>=4?'Este IB no está en la semilla: podrás llenar los datos a mano.':'');return}
 if(d.b){sp(d.b,t.type==='checkbox'?t.checked:t.value);if(d.b==='f/coord')job.f.coordAuto=false;if(/^p\/a\//.test(d.b))drawP();sv()}
 else if(d.t){tec[d.t]=t.value;LS.s('mtic_tec',tec)}
 else if(d.pf){PROF[d.pf]=t.value;LS.s('mtic_prof',PROF);applyProf()}
 else if(d.set==='pctc'){t.value=t.value.replace(/\D/g,'')}
});
document.addEventListener('toggle',e=>{const t=e.target;if(t.dataset&&t.dataset.sec)openS[t.dataset.sec]=t.open},true);
document.addEventListener('change',async e=>{const t=e.target,d=t.dataset,fl=t.files&&t.files[0];
 if(d.set==='pct'||d.set==='pctc'){
  if(d.set==='pct'){SET.custom=t.value==='custom';if(!SET.custom)SET.pct=+t.value}
  else{SET.custom=true;SET.pct=Math.max(10,Math.min(100,+String(t.value).replace(/\D/g,'')||10))}
  LS.s('mtic_set',SET);opt(false);return
 }
 const sapField=d.b&&d.b.match(/^c\/sr\/(r|i)(\d)$/);
 if(sapField){
  const side=sapField[1],index=sapField[2],autoKey='_auto_i'+index;
  if(side==='r'){
   sp(d.b,t.value);
   if(!job.c.sr['i'+index]||job.c.sr[autoKey]){
    job.c.sr['i'+index]=t.value;job.c.sr[autoKey]=true;
    const installed=$('select[data-b="c/sr/i'+index+'"]');if(installed)installed.value=t.value
   }
  }else{sp(d.b,t.value);job.c.sr[autoKey]=false}
  drawP();sv();return
 }
 if(d.b&&!fl){sp(d.b,t.value);if(d.b==='f/coord')job.f.coordAuto=false;if(d.b.startsWith('c/sr/i'))drawP();sv();return}
 if(!fl)return;
 try{if(t.id==='fi'&&captureHandler){const save=captureHandler;captureHandler=null;await save(fl)}
 else if(t.id==='gallery-input'){await saveGalleryPhoto(fl);if(currentScreen==='gallery')await galleryScreen();else if(currentScreen==='photos')photosScreen()}
 else if(t.id==='fi'&&ctx){const c0=ctx;ctx=null;await proc(c0.ns,c0.k,fl,c0.mk)}
 else if(d.sig){const r=await mark(fl,null,{max:500,png:true});if(d.sig==='pf'){PROF.firma=r;LS.s('mtic_prof',PROF);opt(false)}else{firmaF=r;LS.s('mtic_firma',r);$('#fp').innerHTML='<img src="'+r.d+'" style="height:60px;background:#fff;border-radius:6px;margin-top:6px">'}}
 else if(t.id==='rf')await restore(fl)}
 catch(er){alert('No se pudo procesar el archivo: '+(er.message||er))}
 t.value=''
});
$('#fi').addEventListener('cancel',()=>{captureHandler=null});
window.addEventListener('online',updateNetworkStatus);window.addEventListener('offline',updateNetworkStatus);
document.addEventListener('click',async e=>{const b=e.target.closest('[data-x]');if(!b){if(e.target.id==='ov'){ctx=null;e.target.remove()}return}const d=b.dataset,x=d.x,cl=()=>{const o=$('#ov');if(o)o.remove()};
 try{
 if(x==='home')home();
 else if(x==='back')goBack();
 else if(x==='ibgo'){const v=($('#ibin').value||'').trim();if(!v)return alert('Escribe el IB.');gate(v)}
 else if(x==='equipment')equipmentScreen();
 else if(x==='equip-find')equipmentProfile($('#equip-code').value);
 else if(x==='eqopen')equipmentProfile(d.code);
 else if(x==='equip-scan')scan(equipmentProfile);
 else if(x==='equip-save')saveEquipmentProfile(d.code);
 else if(x==='mode'){cl();await startJob(d.ib,d.m)}
 else if(x==='ovx'){ctx=null;cl()}
 else if(x==='reg')reg();
 else if(x==='gallery'){galleryTarget=null;galleryReturnScreen=currentScreen;await galleryScreen()}
 else if(x==='photos')photosScreen();
 else if(x==='codes')codesScreen();
 else if(x==='photos-gallery'){galleryTarget=null;galleryReturnScreen='photos';await galleryScreen()}
 else if(x==='gallery-capture')await capturar(async f=>{await saveGalleryPhoto(f,true);if(currentScreen==='photos')photosScreen();else if(currentScreen==='gallery')await galleryScreen()});
 else if(x==='gallery-import')$('#gallery-input').click();
 else if(x==='library'){galleryTarget={ns:d.ns,k:d.k};galleryReturnScreen=currentScreen;await galleryScreen()}
 else if(x==='usephoto')await useSavedPhoto(d.id);
 else if(x==='gallery-delete'){if(confirm('¿Borrar esta foto de la biblioteca de la app?')){await idbDel('gallery',d.id);await galleryScreen()}}
 else if(x==='gallery-view'){galleryView=d.view==='list'?'list':'grid';LS.s('mtic_gallery_view',galleryView);await galleryScreen()}
 else if(x==='opt')await opt();
 else if(x==='qr'||x==='codes-scan')scan(showCode);
 else if(x==='eqscan')scan(v=>{const n=$('#device-code');if(n)n.value=v;findEquipment(v)});
 else if(x==='scan')scan(v=>{sp(d.b,v);sv();const n=$('input[data-b="'+d.b+'"]');if(n)n.value=v});
 else if(x==='copy'){try{await navigator.clipboard.writeText(d.v);toast('Copiado');setTimeout(()=>toast(''),1200)}catch(er){alert(d.v)}}
 else if(x==='tk')tomar(d.ns,d.k);
 else if(x==='gal')galeria(d.ns,d.k,slotOf(d.ns,d.k).s.ask?1:undefined);
 else if(x==='cap')galeria(d.ns,d.k,0);
 else if(x==='na'){const p={na:1};await idbPut('ph',photoKey(d.ns,d.k),p);PH[d.ns][d.k]=p;drawP()}
 else if(x==='rm'){await idbDel('ph',photoKey(d.ns,d.k));delete PH[d.ns][d.k];drawP()}
 else if(x==='gps'){try{const pos=await getPos();if(!pos)return alert('No se pudo obtener una ubicación GPS. Activa la ubicación del teléfono y vuelve a intentar.');fixv=pos;job.f.coordAuto=true;autoCoord(true);gpsLabel()}catch(er){gpsLabel(er.message||'No se pudo obtener la ubicación');alert('No se pudo obtener una ubicación GPS: '+(er.message||er))}}
 else if(x==='exp')exportar(d.w);
 else if(x==='openib')await openJob(d.ib,JI[d.ib]&&JI[d.ib].mode||'p')
 else if(x==='openwork')await openJob(d.ib,JI[d.ib]&&(JI[d.ib].works||[]).find(w=>w.id===d.id)?.mode||'p',d.id)
 else if(x==='delib'){if(!confirm('¿Eliminar el IB '+d.ib+' con todos sus borradores, fotos y archivos guardados?'))return;for(const[k]of await idbRange('ph',d.ib+'|'))await idbDel('ph',k);for(const o of (JI[d.ib]&&JI[d.ib].xl)||[])await idbDel('xl',o.id);Object.keys(localStorage).filter(k=>k==='mtic_job_'+d.ib||k.startsWith('mtic_job_'+d.ib+'_')).forEach(k=>localStorage.removeItem(k));delete JI[d.ib];LS.s('mtic_jobs',JI);reg()}
 else if(x==='xs'){const u=await idbGet('xl',d.id),o=Object.values(JI).flatMap(j=>j.xl||[]).find(y=>y.id===d.id);if(u&&o)await guardar([{u8:u,fn:o.fn}])}
 else if(x==='xd'){if(!confirm('¿Borrar este archivo guardado?'))return;await idbDel('xl',d.id);JI[d.ib].xl=JI[d.ib].xl.filter(y=>y.id!==d.id);LS.s('mtic_jobs',JI);reg()}
 else if(x==='sigq'){PROF.firma=null;LS.s('mtic_prof',PROF);opt(false)}
 else if(x==='bk'){const m=$('#om');if(m)m.textContent='Generando copia de seguridad...';try{await guardar([{u8:await backup(),fn:'MinTIC_backup_'+today()+'.zip',mime:'application/zip'}]);if(m)m.textContent='Copia de seguridad generada y guardada.'}catch(er){if(m)m.textContent='No se pudo generar la copia: '+(er.message||er)}}
 else if(x==='rs')$('#rf').click();
 else if(x==='cc'){const m=$('#om');try{m.textContent='Caché limpiado ('+await cache()+' elementos). Tus formatos siguen intactos.'}catch(er){m.textContent='No se pudo limpiar el caché: '+(er.message||er)}}
 else if(x==='storage')await storageSummary();
 else if(x==='ca'){if(!confirm('Limpieza total: se borran sitios, fotos, archivos guardados, perfil y opciones.')||!confirm('Última confirmación: esto no se puede deshacer. ¿Borrar todo?'))return;try{await wipe();await cache();location.reload()}catch(er){alert('No se pudo completar la limpieza: '+(er.message||er))}}
 }catch(er){alert('No se pudo completar la acción: '+(er.message||er))}
});
$('#dl').innerHTML='<datalist id="ids">'+Object.keys(SEED).map(k=>'<option value="'+k+'">'+esc(SEED[k][3])+'</option>').join('')+'</datalist>';
home();
function goBack(){
 if(window.__closeScanner){window.__closeScanner();return true}
 if(window.__closeCamera){window.__closeCamera();return true}
 const modal=$('#ov');if(modal){ctx=null;if(window.__cancelRestoreChoice)window.__cancelRestoreChoice();else modal.remove();return true}
 if(currentScreen==='gallery'){galleryTarget=null;if(galleryReturnScreen==='job'&&job){screen();return true}if(galleryReturnScreen==='photos'){photosScreen();return true}home();return true}
 if(currentScreen!=='home'){home();return true}
 return false
}
window.handleHardwareBack=()=>{if(currentScreen==='home')return !confirm('¿Deseas salir de MinTIC Mantenimientos?');goBack();return true};