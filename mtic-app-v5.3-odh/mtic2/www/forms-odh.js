/* Formato ODH: correctivo MTI-F08. Separado del formato 7K (forms.js no se modifica). */
(function(g){
const F=g.FORMS,digits=F.digits,dmy=F.dmy;
const nm=v=>{v=String(v==null?'':v).trim();return /^\d{1,15}$/.test(v)?+v:v};
const clean=s=>String(s||'').replace(/[\\/:*?"<>|]/g,'').trim();
const SH={p:'REG FOTOG PRUEBAS NECESARIAS',a:'REGISTRO FOTOGRÁFICO ANTES',d:'REGISTRO FOTOGRÁFICO DESPÚES'};
// [etiqueta, rango, solo captura]
const OP=[['COORDENADAS GEOGRÁFICAS (captura de pantalla)','B13:F27',0],['EQUIPOS WIFI INTERIOR','G12:K27',0],['EQUIPOS WIFI EXTERIOR 1 (AP 1)','L12:P27',0],['EQUIPOS WIFI EXTERIOR 2 (AP2) SI APLICA','B29:F44',0],['EQUIPOS DE CÓMPUTO CONECTADOS A INTERNET','G29:K44',1],['DISPOSITIVO MÓVIL CONECTADO AL WIFI EXTERIOR','L29:P44',1],['SEÑALÉTICA EXTERIOR','B46:F61',0],['SEÑALÉTICA INTERIOR','G46:K61',0],['SOLUCIÓN DE RESPALDO (4 HORAS) SI APLICA','L46:P61',0],['PRINT DE SERVIDOR CON EVENTO CREADO A UPS','B63:F78',1],['MEDICIÓN ELÉCTRICA 1','G63:K78',0],['MEDICIÓN ELÉCTRICA 2','L63:P78',0],['NAVEGACIÓN AP INDOOR','B80:F95',1],['NAVEGACIÓN AP OUTDOOR','G80:K95',1],['PRUEBA DE VELOCIDAD','L80:P95',1],['CONECTIVIDAD PORTAL CAUTIVO','B97:F112',1],['BLOQUEO DE PÁGINAS 1','G97:K112',1],['BLOQUEO DE PÁGINAS 2','L97:P112',1]];
const COLS=[['B','F'],['G','K'],['L','P']];
const O_SLOTS=[];
OP.forEach((x,i)=>O_SLOTS.push({k:'op'+i,sh:'p',sec:'Pruebas necesarias',l:x[0],r:x[1],only:x[2]}));
const SA=[['B15:F28','D13'],['G15:K28','I13'],['L15:P28','N13'],['B32:F45','D30'],['G32:K45','I30'],['L32:P45','N30']];
const SD=[['B16:F29','D14'],['G16:K29','I14'],['L16:P29','N14'],['B33:F46','D31'],['G33:K46','I31'],['L33:P46','N31']];
SA.forEach((x,i)=>O_SLOTS.push({k:'oas'+i,sh:'a',sec:'Repuestos a retirar (foto del serial)',l:'SERIAL DEL REPUESTO A RETIRAR #'+(i+1),r:x[0],sapCell:x[1],idx:i}));
[[48,63],[65,80],[82,97],[99,114]].forEach((r,ri)=>COLS.forEach((c,i)=>O_SLOTS.push({k:'oag'+(ri*3+i),sh:'a',sec:'Diagnóstico objeto de la visita (antes)',l:'DIAGNÓSTICO #'+(ri*3+i+1),r:c[0]+r[0]+':'+c[1]+r[1],ask:1})));
SD.forEach((x,i)=>O_SLOTS.push({k:'ods'+i,sh:'d',sec:'Repuestos instalados (foto del serial)',l:'SERIAL DEL REPUESTO INSTALADO #'+(i+1),r:x[0],sapCell:x[1],idx:i}));
[[49,64],[66,81],[83,98],[100,115]].forEach((r,ri)=>COLS.forEach((c,i)=>O_SLOTS.push({k:'odg'+(ri*3+i),sh:'d',sec:'Diagnóstico objeto de la visita (después)',l:'DIAGNÓSTICO #'+(ri*3+i+1),r:c[0]+r[0]+':'+c[1]+r[1],ask:1})));
function odhFile(f){const d=(f.fecha||'').split('-');return 'IDBen_'+clean(f.idben)+'-IM'+digits(f.im)+'-'+(d.length===3?d[2]+'-'+d[1]+'-'+d[0]:'')+'_Notificación_de_mantenimiento_Correctivo_del_Contratista.xlsx'}
function odhSpec(f,o,tec,ph,firma,na,place){
  const S='ACTA ACTIVIDADES',C=[],I=[],cm=place==='cell',c=(ref,val,sheet,st,nf)=>C.push({sheet:sheet||S,ref,val,st,noFormula:nf});
  const EQ2=g.EQ_ODH,desc=sap=>{const e=EQ2.find(x=>x[0]===String(sap));return e?e[1]:''};
  c('C11','IM'+digits(f.im));c('H11',dmy(f.fecha));
  c('B14',nm(f.res));
  const SH1={shrink:1};
  c('B16',nm(f.idben));c('D16',f.claro||'');c('F16',nm(f.daneI));c('H16',f.nomI||'',null,SH1);c('K16',nm(f.daneS));c('N16',f.sede||'',null,SH1);
  c('B18',f.resp||'',null,SH1);c('F18',digits(f.cedr));c('H18',digits(f.telr));c('K18',f.mailr||'',null,SH1);
  EQ2.forEach((e,i)=>{const r=21+i,a=o.q['r'+i],b=o.q['i'+i];c('K'+r,a?+a:'N/A');c('N'+r,b?+b:'N/A')});
  for(let i=0;i<5;i++){const r=56+i,sr=o.sr['r'+i],si=o.sr['i'+i]||sr;
    c('B'+r,sr?nm(sr):'');c('C'+r,desc(sr));c('F'+r,o.sr['rs'+i]||'');c('J'+r,si?nm(si):'');c('K'+r,desc(si));c('N'+r,o.sr['is'+i]||'')}
  c('B63',o.hall||'');
  c('E66',o.acn||'');c('E67',o.acc||'');c('E68',digits(o.acd));c('E69',digits(o.act1));c('E70',digits(o.act2));c('E71',o.acm||'');
  c('M66',tec.tecn||'');c('M67',tec.tecc||'');c('M68',digits(tec.tecd));c('M69',digits(tec.tect));c('M70',tec.tecm||'');
  if(firma)I.push({sheet:S,range:'M71:P71',...firma,cell:cm});
  const k=F.coord(f.coord);if(k){c('E12',k[1],SH.p);c('F12',k[0],SH.p)}
  c('B114',o.obsP||'',SH.p);c('B116',o.obsA||'',SH.a);c('B117',o.obsD||'',SH.d);
  // SAP de las fotos de seriales: antes = retirado; después = instalado (igual al retirado si no se eligió otro)
  const sapOf=(i,side)=>{const r=o.sr['r'+i],v=o.sr['i'+i];return side==='a'?r:(v||r)};
  O_SLOTS.forEach(s=>{
    if(s.sapCell){const sap=sapOf(s.idx,s.sh);if(sap)c(s.sapCell,sap?nm(sap):'',SH[s.sh],null,s.sh==='d')}
    const p=ph[s.k];if(p&&(p.bytes||p.base64))I.push({sheet:SH[s.sh],range:s.r,ext:'jpeg',...p,cell:cm});else if(p&&p.na&&na)I.push({sheet:SH[s.sh],range:s.r,...na,cell:cm})});
  const E='ETIQUETA_RE_FOTOGRÁFICO',st={size:11};
  C.push({sheet:E,ref:'D4',val:nm(f.idben),st},{sheet:E,ref:'D5',val:f.sede||'',st},{sheet:E,ref:'D6',val:k?k[1]:'',st},{sheet:E,ref:'E6',val:k?k[0]:'',st},{sheet:E,ref:'D7',val:dmy(f.fecha),st});
  return{cells:C,images:I,fontName:'Arial'};
}
F.O_SLOTS=O_SLOTS;F.odhSpec=odhSpec;F.odhFile=odhFile;
})(typeof window!=='undefined'?window:globalThis);
