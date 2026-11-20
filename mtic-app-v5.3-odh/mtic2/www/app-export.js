// ===== exportación
async function excelPhoto(p){
 const image=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('No se pudo preparar una foto para el Excel'));i.src=p.d});
 const scale=Math.min(1,photoMaxEdge()/Math.max(image.naturalWidth,image.naturalHeight)),w=Math.max(1,Math.round(image.naturalWidth*scale)),h=Math.max(1,Math.round(image.naturalHeight*scale)),canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('No se pudo preparar una foto para el Excel');ctx.drawImage(image,0,0,w,h);
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('No se pudo comprimir una foto para el Excel')),'image/jpeg',.78)),bytes=new Uint8Array(await blob.arrayBuffer());
 canvas.width=canvas.height=0;image.src='';
 return{bytes,w,h,ext:'jpeg'}
}
async function exportar(which){const m=$('#msg'),f=job.f,pc=job.mode==='pc',types=which==='both'?['p','c']:[which];
 for(const t of types){if(!F.digits(t==='c'&&pc?f.imc:f.im)){alert('Falta el No. de caso IM'+(pc?(t==='c'?' del correctivo':' del preventivo'):'')+': se usa en el nombre del archivo.');return}}
 if(!f.fecha){alert('Falta la fecha.');return}
 if(types.includes('r')){const cs=[1,2,3,4].map(n=>job.r['p'+n].cause).filter(v=>v!==''&&v!=null);if(!cs.length){alert('Elige al menos la causa de una parada de reloj.');return}if(new Set(cs).size!==cs.length){alert('Hay dos paradas con la misma causa. La plantilla tiene una sola fila por causa: usa causas distintas.');return}}
 const warn=[];if(!F.coord(f.coord))warn.push('coordenadas');if(!f.sede)warn.push('sede');let sf=0;if(types.includes('p'))sf=F.P_SLOTS.filter((s,i)=>!(PH.p[i]&&PH.p[i].d)&&!naOf({ns:'p',k:String(i),s})).length;
 if((warn.length||sf)&&!confirm('Falta: '+[warn.join(', '),sf?sf+' fotos del preventivo':''].filter(Boolean).join(' y ')+'. ¿Continuar?'))return;
 m.textContent='Generando Excel...';
 try{const out=[],fm=signature();let photoIndex=0,photoTotal=types.reduce((n,t)=>n+(t==='p'?F.P_SLOTS.filter((s,i)=>PH.p[i]&&PH.p[i].d).length:t==='c'?F.C_SLOTS.filter(s=>{const p=PH.c[s.k]||(pc&&MAP[s.k]!==undefined?PH.p[MAP[s.k]]:null);return p&&p.d}).length:F.R_SLOTS.filter(s=>PH.r[s.k]&&PH.r[s.k].d).length),0);
  const image=async p=>{if(!p||!p.d)return null;photoIndex++;m.textContent='Optimizando foto '+photoIndex+' de '+photoTotal+' para el Excel...';const result=await excelPhoto(p);await new Promise(requestAnimationFrame);return result};
  for(const t of types){let spec,fn,tpl;
   if(t==='p'){const ph={};for(let i=0;i<F.P_SLOTS.length;i++){const p=PH.p[i];if(p&&p.d)ph[i]=await image(p);else if(p&&p.na)ph[i]={na:1}}
    spec=F.prevSpec(Object.assign({},f,{hall:job.p.hall}),job.p.a,job.p.s,Object.assign({},tec,{imc:pc?'IM'+F.digits(f.imc):job.p.imc}),ph,fm,naImg(),f.place);fn=F.prevFile(f);tpl=TPL.prev}
   else if(t==='c'){const ph={};for(const s of F.C_SLOTS){let p=PH.c[s.k];if(!(p&&(p.d||p.na))&&pc&&MAP[s.k]!==undefined)p=PH.p[MAP[s.k]];if(p&&p.d)ph[s.k]=await image(p);else if(p&&p.na)ph[s.k]={na:1}}
    const fc2=Object.assign({},f,job.c,{im:pc?f.imc:f.im});spec=F.corrSpec(fc2,job.c.q,job.c.sr,tec,ph,fm,naImg(),f.place);fn=F.corrFile(fc2);tpl=TPL.corr}
   else{const ph={};for(const s of F.R_SLOTS){const p=PH.r[s.k];if(p&&p.d)ph[s.k]=await image(p);else if(p&&p.na)ph[s.k]={na:1}}spec=F.parSpec(f,job.r,tec,ph,fm,naImg(),f.place);fn=F.parFile(f);tpl=TPL.par}
   const u=await XL.fill(tpl,spec),id=Date.now()+'-'+t;await idbPut('xl',id,u);JI[job.ib].xl=(JI[job.ib].xl||[]).concat([{id,t,fn,ts:Date.now(),size:u.size||u.length}]);out.push({u8:u,fn})}
  LS.s('mtic_jobs',JI);await guardar(out);m.textContent='Listo: '+out.map(o=>o.fn).join(' y ')+'. Queda una copia en el Registro.'}
 catch(e){m.textContent=(e&&(e.code==='declined'||/cancel/i.test(e.message||'')))?'Cancelado (la copia sí quedó en el Registro).':'No se pudo exportar: '+((e&&e.message)||e)}}
