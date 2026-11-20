/* Definición de los dos formatos: campos, fotos y mapeo exacto a celdas de las plantillas originales. */
(function(g){
const FIX={contrato:'1042 de 2020',contratista:'COMCEL SA'}; // fijos, tal cual la plantilla
const nm=v=>{v=String(v==null?'':v).trim();return /^\d{1,15}$/.test(v)?+v:v};
const dmy=s=>{const p=(s||'').split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:''};
const digits=s=>String(s||'').replace(/\D/g,'');
const clean=s=>String(s||'').replace(/[\\/:*?"<>|]/g,'').trim();
const coord=s=>{s=s||'';const m=s.match(/-?\d+(\.\d+)?/g);if(!m||m.length<2)return null;let a=+m[0],o=+m[1];if(/S/i.test(s)&&a>0)a=-a;if(/[WO]/i.test(s)&&o>0)o=-o;return isNaN(a)||isNaN(o)?null:[a,o]};

// ===== PREVENTIVO (MTIC-F27)
const P_ACT=[['1','Ajuste y limpieza de elementos que componen el kit de WiFi incluidos herrajes y mástiles'],['1.1','AP INTERIOR'],['1.2','AP EXTERIOR 1'],['1.3','AP EXTERIOR 2'],['2','Ajuste y limpieza de elementos que componen el kit de Energía'],['2.1','Rack Metalico'],['2.2','UPS'],['2.3','Batería'],['2.4','Kit Panel Solarx4 Fotovoltaico'],['2.5','Controlador'],['2.6','Inversor PST - 600 - 48 Modulo Solar SAMLX'],['2.7','Poste 3Mts Soporte Panel Solar'],['3','Ajuste y limpieza de elementos que componen el kit de Radio'],['3.1','Radio Suscriptor'],['4','Señalética'],['4.1','Interior'],['4.2','Exterior'],['5','Medición eléctrica'],['6','Prueba de gestión de UPS'],['7','Velocidad UP - DOWN'],['8','Portal cautivo'],['9','Bloqueo de páginas'],['10','Ajuste y limpieza de elementos que componen el kit Satelital'],['10.1','Antena'],['11','Validación física Politica de Seguridad'],['12','Validación diagrama unifilar'],['13','Equipotencialización rack de equipos']];
const P_SER=['Ap Indoor','Ap Outdoor 1','Ap Outdoor 2','Mikrotik (Router)','UPS','Panel Solar','Controlador','Inversor','Batería','MW (Radio)'];
const R3=(c,r1,r2)=>[[c[0],r1,c[1],r2],[c[2],r1,c[3],r2],[c[4],r1,c[5],r2]];
const rg=(a,b,c,d)=>a+b+':'+c+d;
const P_SLOTS=(()=>{const s=[],T=[['B','G'],['H','M'],['N','S']];
 const rows=[[14,30,['EQUIPOS WIFI INTERIOR','EQUIPOS WIFI EXTERIOR 1 (AP 1)','EQUIPOS WIFI EXTERIOR 2 (AP2)'],['1.1','1.2','1.3']],[32,48,['RACK METALICO','EQUIPOTENCIALIZACION RACK DE EQUIPOS','UPS'],['2.1','13','2.2']],[50,66,['BATERIA','KIT PANEL SOLAR X4 (SI APLICA)','CONTROLADOR (SI APLICA)'],['2.3','2.4','2.5']],[68,84,['INVERSOR PST-600-48 (SI APLICA)','POSTE 3MTS SOPORTE PANEL (SI APLICA)','RADIO SUSCRIPTOR (SI APLICA)'],['2.6','2.7','3.1']],[86,102,['SEÑALÉTICA INTERIOR','SEÑALÉTICA EXTERIOR','MEDICIÓN ELÉCTRICA 1'],['4.1','4.2','5']],[104,120,['MEDICIÓN ELÉCTRICA 2','DIAGRAMA UNIFILAR','PRINT SERVIDOR TRIARA CON EVENTO A UPS'],['5','12','6']]];
 rows.forEach(r=>T.forEach((t,i)=>s.push({l:r[2][i],r:rg(t[0],r[0],t[1],r[1]),a:r[3][i],shot:(r[2][i].startsWith('DIAGRAMA')||r[2][i].startsWith('PRINT'))?1:0})));
 s.push({l:'PRUEBA DE VELOCIDAD',r:'B122:S131',a:'7',shot:1});
 [['NAVEGACIÓN AP INDOOR',null,'B','G'],['NAVEGACIÓN AP OUTDOOR',null,'H','M'],['CONECTIVIDAD PORTAL CAUTIVO','8','N','S']].forEach(x=>s.push({l:x[0],r:rg(x[2],133,x[3],150),a:x[1],shot:1}));
 [['BLOQUEO DE PÁGINAS 1','9','B','G',1],['BLOQUEO DE PÁGINAS 2','9','H','M',1],['KIT SATELITAL (SI APLICA)','10.1','N','S',0]].forEach(x=>s.push({l:x[0],r:rg(x[2],152,x[3],167),a:x[1],shot:x[4]}));
 s.push({l:'ACERCAMIENTO COMUNIDAD',r:'B169:G184',a:null,shot:0});return s})();

function prevFile(f){return 'Notificación_de_mantenimiento_Preventivo_del_Contratista_IDBen_'+clean(f.idben)+'-IM'+digits(f.im)+'-'+(dmy(f.fecha).replace(/\//g,''))+'.xlsx'}

const CEN={h:'center'};
const GEN=['B15','F15','K15','N15','B17','D17','F17','K17','N17','B19'];
function prevSpec(f,a,sr,tec,ph,firma,na,place){
  const S='ACTA DE MANTENIMIENTO',C=[],I=[],cm=place==='cell',c=(ref,val,sheet,st)=>C.push({sheet:sheet||S,ref,val,st});
  c('B10','No. DE CASO IM: '+digits(f.im));c('G10',dmy(f.fecha));
  c('B15',f.depto||'',0,CEN);c('F15',f.mpio||'',0,CEN);c('K15',f.cpob||'',0,CEN);c('N15',f.sede||'',0,CEN);
  c('B17',nm(f.idben),0,CEN);c('D17',nm(f.idmin),0,CEN);c('F17',f.resp||'',0,CEN);c('K17',digits(f.cedr)||'',0,CEN);c('N17',digits(f.telr)||'',0,CEN);c('B19',f.mailr||'',0,CEN);
  P_ACT.forEach((x,i)=>{const v=a[x[0]]||'',r=22+i;c('K'+r,v==='SI'?'X':'');c('M'+r,v==='NO'?'X':'');c('O'+r,v==='N/A'?'X':'')});
  P_SER.forEach((x,i)=>{c('F'+(51+i),sr['r'+i]||'',S,CEN);c('N'+(51+i),sr['i'+i]||'',S,CEN)});
  c('B63',f.hall||'');
  c('E65',tec.tecn||'',S,CEN);c('E66',tec.tecc||'',S,CEN);c('E67',digits(tec.tecd)||'',S,CEN);c('E68',digits(tec.tect)||'',S,CEN);c('E69',tec.tecm||'',S,CEN);
  c('L65',tec.nocn||'',S,CEN);c('L67',tec.nocc||'',S,CEN);c('L69',tec.imc||'',S,CEN);
  if(firma)I.push({sheet:S,range:'E70:H70',...firma,cell:cm});
  P_SLOTS.forEach((s,i)=>{const p=ph[i],hasPhoto=p&&(p.bytes||p.base64),isNA=(p&&p.na)||(!hasPhoto&&s.a&&a[s.a]==='N/A');
    if(hasPhoto)I.push({sheet:'REGISTRO FOTOGRÁFICO',range:s.r,ext:'jpeg',...p,cell:cm});else if(isNA&&na)I.push({sheet:'REGISTRO FOTOGRÁFICO',range:s.r,...na,cell:cm})});
  etq(C,f);return{cells:C,images:I};
}
function etq(C,f){const k=coord(f.coord),S='ETIQUETA_RE_FOTOGRÁFICO',st={size:11};
  C.push({sheet:S,ref:'D4',val:nm(f.idben),st},{sheet:S,ref:'D5',val:f.sede||'',st},{sheet:S,ref:'D6',val:k?k[1]:'',st},{sheet:S,ref:'E6',val:k?k[0]:'',st},{sheet:S,ref:'D7',val:dmy(f.fecha),st})}

// ===== CORRECTIVO (MTIC-F40)
const CS={p:'REG FOTOG PRUEBAS NECESARIAS',a:'REGISTRO FOTOGRÁFICO ANTES',d:'REGISTRO FOTOGRÁFICO DESPÚES'};
const C3=['B','F','G','K','L','P'];
const C_SAP_CELLS=['D12','I12','N12','D29','I29','N29'];
const C_SLOTS=(()=>{const s=[];
 const pr=[[13,27,['CAPTURA DE COORDENADAS GPS (mín. 5 decimales)','EQUIPOS WIFI INTERIOR','EQUIPOS WIFI EXTERIOR 1 (AP 1)']],[29,44,['EQUIPOS WIFI EXTERIOR 2 (AP2) SI APLICA','EQUIPOS DE CÓMPUTO CONECTADOS A INTERNET','DISPOSITIVO MÓVIL CONECTADO AL WIFI EXTERIOR']],[46,61,['SEÑALÉTICA EXTERIOR','SOLUCIÓN DE RESPALDO (4 HORAS) SI APLICA','SEÑALÉTICA INTERIOR']],[63,78,['PRINT SERVIDOR TRIARA CON EVENTO A UPS','MEDICIÓN ELÉCTRICA 1','MEDICIÓN ELÉCTRICA 2']],[80,95,['NAVEGACIÓN AP INDOOR','NAVEGACIÓN AP OUTDOOR','PRUEBA DE VELOCIDAD']],[97,112,['CONECTIVIDAD PORTAL CAUTIVO','BLOQUEO DE PÁGINAS 1','BLOQUEO DE PÁGINAS 2']]];
 pr.forEach((r,ri)=>r[2].forEach((l,i)=>{let a=r[0];if(ri===0&&i>0)a=12;const shot=/PRINT|NAVEGACIÓN|VELOCIDAD|PORTAL|BLOQUEO|CAPTURA/.test(l)?1:0;
   s.push({k:'p'+s.length,sh:'p',sec:'Pruebas necesarias',l,r:C3[i*2]+a+':'+C3[i*2+1]+r[1],shot,gps:ri===0&&i===0?1:0})}));
 const dg=[[47,62],[64,79],[81,96],[98,113]];
 [['a','Repuestos a retirar (foto del serial)','SERIAL DEL REPUESTO A RETIRAR'],['d','Repuestos instalados (foto del serial)','SERIAL DEL REPUESTO INSTALADO']].forEach(x=>{
   [[14,27],[31,44]].forEach((r,ri)=>[0,1,2].forEach(i=>s.push({k:x[0]+'s'+s.length,sh:x[0],sec:x[1],l:x[2]+' #'+(ri*3+i+1),r:C3[i*2]+r[0]+':'+C3[i*2+1]+r[1],shot:0,sap:C_SAP_CELLS[ri*3+i]})));
   dg.forEach((r,ri)=>[0,1,2].forEach(i=>s.push({k:x[0]+'g'+s.length,sh:x[0],sec:x[0]==='a'?'Diagnóstico objeto de la visita (antes)':'Diagnóstico objeto de la visita (después)',l:'DIAGNÓSTICO #'+(ri*3+i+1),r:C3[i*2]+r[0]+':'+C3[i*2+1]+r[1],shot:0,ask:1})));
 });return s})();
// el slot 0 (captura GPS) ocupa B13:F27, los demás de la fila 1 empiezan en la fila 12
C_SLOTS[0].r='B13:F27';
['p4','p5','p9','p12','p13','p14','p15','p16','p17'].forEach(k=>{const x=C_SLOTS.find(y=>y.k===k);if(x){x.only=1;x.shot=1}});

function corrFile(f){return 'IDBen_'+clean(f.idben)+'-IM'+digits(f.im)+'-'+(f.fecha||'')+'_Notificación_de_mantenimiento_Correctivo_del_Contratista.xlsx'}
const LEF={h:'left'};
function corrSpec(f,q,sr,tec,ph,firma,na,place){
  const S='ACTA ACTIVIDADES',C=[],I=[],cm=place==='cell',c=(ref,val,sheet,st)=>C.push({sheet:sheet||S,ref,val,st});
  const serialSap=i=>sr['i'+i]||'';
  c('C9','IM'+digits(f.im));c('H9',dmy(f.fecha));
  c('B14',f.depto||'');c('F14',f.mpio||'');c('K14',f.cpob||'');c('N14',f.sede||'');
  c('B16',nm(f.idben));c('F16',f.resp||'');c('K16',digits(f.cedr)||'');c('N16',digits(f.telr)||'');c('B18',f.mailr||'');
  EQ.forEach((e,i)=>{const r=21+i,a=q['r'+i],b=q['i'+i];c('K'+r,a?+a:'');c('N'+r,b?+b:'')});
  const desc=sap=>{const e=EQ.find(x=>x[0]===String(sap));return e?e[1]:''};
  for(let i=0;i<5;i++){const r=62+i,sr1=sr['rs'+i]||'',sr2=sr['is'+i]||'',sapI=serialSap(i);
    c('B'+r,sr['r'+i]?nm(sr['r'+i]):'',S,CEN);c('C'+r,desc(sr['r'+i]),S,CEN);c('F'+r,sr1,S,CEN);
    c('J'+r,sapI?nm(sapI):'',S,CEN);c('K'+r,desc(sapI),S,CEN);c('N'+r,sr2,S,CEN)}
  c('B69',f.hall||'');
  c('E72',f.acn||'',S,CEN);c('E73',f.acc||'',S,CEN);c('E74',digits(f.acd)||'',S,CEN);c('E75',digits(f.act1)||'',S,CEN);c('E76',digits(f.act2)||'',S,CEN);c('E77',f.acm||'',S,CEN);
  c('M72',tec.tecn||'',S,CEN);c('M73',tec.tecc||'',S,CEN);c('M74',digits(tec.tecd)||'',S,CEN);c('M75',digits(tec.tect)||'',S,CEN);c('M76',tec.tecm||'',S,CEN);
  if(firma)I.push({sheet:S,range:'M77:P77',...firma,cell:cm});
  const k=coord(f.coord);if(k){c('E12',k[1],CS.p);c('F12',k[0],CS.p)}
  c('B114',f.obsP||'',CS.p);c('B115',f.obsA||'',CS.a);c('B115',f.obsD||'',CS.d);
  C_SLOTS.forEach(s=>{if(s.sap){const index=C_SAP_CELLS.indexOf(s.sap),sap=index>=0&&index<5?(s.sh==='a'?sr['r'+index]:sr['i'+index]):'',ref={sheet:CS[s.sh],ref:s.sap,val:sap?nm(sap):''};if(s.sh==='d')ref.noFormula=true;C.push(ref)}const p=ph[s.k];if(p&&(p.bytes||p.base64))I.push({sheet:CS[s.sh],range:s.r,ext:'jpeg',...p,cell:cm});else if(p&&p.na&&na)I.push({sheet:CS[s.sh],range:s.r,...na,cell:cm})});
  etq(C,f);return{cells:C,images:I};
}

// ===== PARADA DE RELOJ (MTIC-F29)
const R_CAUSES=['Fuerza Mayor - Vandalismo','Fuerza Mayor - Robo','Fuerza Mayor - Terrorismo','Fuerza Mayor - Orden Público','Fuerza Mayor - Paros Cívicos','Fuerza Mayor - Desastres','Fuerza Mayor - Descargas Atmosfericas','Fuerza Mayor - CD Energía Alternativa','Caso Fortuito - Centro Digital Temporizado','Caso Fortuito - Fibra Daños Animales y/o Humanos','Caso Fortuito - Manipulación elementos por Terceros','Atribuible Terceros - Falla Energia Electrica en CD','Atribuible Terceros - Falla Infraestructura fisica CD','Atribuible Terceros - Falla Energia Comercial Zona','Atribuible Terceros - Imposibilidad accesos BTS (Terceros, Bases Militares)','Atribuible Terceros - Imposibilidad accesos al CD','Atribuible Terceros - Imposibilidad programar actividad','Continuidad Servicio - Trabajo Programado'];
const R_SLOTS=(()=>{const s=[],rows=[12,29,46,63],C=[['B','F'],['G','K'],['L','P']];
 rows.forEach((r0,n)=>C.forEach((c,i)=>s.push({k:'r'+(n+1)+'abc'[i],sh:'r',sec:'Parada de reloj '+(n+1),l:'PARADA DE RELOJ '+(n+1)+' - FOTO '+(i+1),r:c[0]+r0+':'+c[1]+(r0+15),shot:0,ask:1})));return s})();
function parFile(f){return 'IDBen_'+clean(f.idben)+'-IM'+digits(f.im)+'-'+(f.fecha||'')+'_Paradas_de_Reloj.xlsx'}
function parSpec(f,r,tec,ph,firma,na,place){
  const S='ACTA DE INSTALACIÓN',PF='REGISTRO FOTOGRÁFICO',C=[],I=[],K=[],cm=place==='cell',c=(ref,val,sheet,st)=>C.push({sheet:sheet||S,ref,val,st});
  c('C2','Formato Paradas de Reloj IDBen_'+clean(f.idben)+'-IM'+digits(f.im)+'-'+(f.fecha||''));c('C9','N° DE CASO : IM'+digits(f.im));c('H9','FECHA: '+dmy(f.fecha));
  c('C14',nm(f.idben));c('E14',nm(f.idmin));c('G14',f.cpob||'');c('I14',f.sede||'');c('L14',f.depto||'');c('O14',f.mpio||'');
  [1,2,3,4].forEach(n=>{const p=r['p'+n]||{};
    if(p.cause!==''&&p.cause!=null&&!isNaN(+p.cause)){const row=17+ +p.cause;c('G'+row,dmy(p.fi));c('I'+row,p.hi||'');c('K'+row,dmy(p.ff));c('M'+row,p.hf||'');K.push({sheet:S,row,n})}
    c('C'+(34+n*2),p.desc||'')});
  c('F44',tec.tecn||'',S,CEN);c('F45',tec.tecc||'',S,CEN);c('F46',digits(tec.tecd)||'',S,CEN);c('F47',digits(tec.tect)||'',S,CEN);c('F48',tec.tecm||'',S,CEN);
  if(firma)I.push({sheet:S,range:'F49:Q49',...firma,cell:cm});
  c('B80',r.obs||'',PF);
  R_SLOTS.forEach(s=>{const p=ph[s.k];if(p&&(p.bytes||p.base64))I.push({sheet:PF,range:s.r,ext:'jpeg',...p,cell:cm});else if(p&&p.na&&na)I.push({sheet:PF,range:s.r,...na,cell:cm})});
  etq(C,f);return{cells:C,images:I,checks:K};
}
g.FORMS={FIX,P_ACT,P_SER,P_SLOTS,C_SLOTS,C_SAP_CELLS,R_CAUSES,R_SLOTS,prevFile,prevSpec,corrFile,corrSpec,parFile,parSpec,coord,digits,dmy};
})(typeof window!=='undefined'?window:globalThis);
