/* Motor XL: rellena un .xlsx existente tocando solo las celdas indicadas.
   No reescribe hojas, celdas combinadas, validaciones ni dibujos originales.
   v2: tamaños exactos de celda, estilos (color, fuente, alineación), imágenes flotantes o dentro de la celda,
   casillas de verificación de formulario. */
(function(g){
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const c2n=c=>c.split('').reduce((a,ch)=>a*26+ch.charCodeAt(0)-64,0);
const splitRef=r=>{const m=r.match(/^([A-Z]+)(\d+)$/);return[c2n(m[1]),+m[2]]};
const EMU=9525,MDW=7;
const relsOf=t=>{const o={};[...t.matchAll(/<Relationship [^>]*>/g)].forEach(m=>{const s=m[0];o[(s.match(/Id="([^"]+)"/)||[])[1]]=(s.match(/Target="([^"]+)"/)||[])[1]});return o};

// ---------- estilos: copia un formato existente cambiando solo lo pedido
function Styles(xml){
  const fm=xml.match(/<fonts([^>]*)>([\s\S]*?)<\/fonts>/),cm=xml.match(/<cellXfs([^>]*)>([\s\S]*?)<\/cellXfs>/);
  const fonts=fm[2].match(/<font>[\s\S]*?<\/font>|<font\/>/g)||[],xfs=cm[2].match(/<xf [^>]*?(?:\/>|>[\s\S]*?<\/xf>)/g)||[],cache={};
  const black=f=>{const c=f.match(/<color ([^>]*)\/>/);return !c||(/theme="1"/.test(c[1])&&!/tint/.test(c[1]))||/rgb="FF000000"/.test(c[1])};
  function get(s0,mods){
    const key=s0+'|'+JSON.stringify(mods);if(key in cache)return cache[key];
    const xf=xfs[s0];if(!xf)return cache[key]=s0;
    let f=fonts[+((xf.match(/fontId="(\d+)"/)||[0,0])[1])],fch=false,nx=xf,xch=false;
    if(mods.color==='black'&&!black(f)){f=/<color /.test(f)?f.replace(/<color [^>]*\/>/,'<color rgb="FF000000"/>'):f.replace(/<name /,'<color rgb="FF000000"/><name ');fch=true}
    if(mods.name){const m=f.match(/<name val="([^"]*)"/);if(m&&m[1]!==mods.name){f=f.replace(/<name val="[^"]*"\/>/,'<name val="'+mods.name+'"/>').replace(/<scheme [^>]*\/>/,'');fch=true}}
    if(mods.size){const m=f.match(/<sz val="([^"]*)"/);if(m&&+m[1]!==mods.size){f=f.replace(/<sz val="[^"]*"\/>/,'<sz val="'+mods.size+'"/>');fch=true}}
    if(fch){let id=fonts.indexOf(f);if(id<0){fonts.push(f);id=fonts.length-1}nx=nx.replace(/fontId="\d+"/,'fontId="'+id+'"');nx=/applyFont=/.test(nx)?nx.replace(/applyFont="\d"/,'applyFont="1"'):nx.replace('<xf ','<xf applyFont="1" ');xch=true}
    if(mods.h){const al=nx.match(/<alignment [^>]*\/>/);
      if(!(al&&new RegExp('horizontal="'+mods.h+'"').test(al[0]))){
        if(al)nx=nx.replace(al[0],/horizontal=/.test(al[0])?al[0].replace(/horizontal="[^"]*"/,'horizontal="'+mods.h+'"'):al[0].replace('<alignment ','<alignment horizontal="'+mods.h+'" '));
        else{const a='<alignment horizontal="'+mods.h+'"/>';if(/\/>$/.test(nx))nx=nx.replace(/\/>$/,'>'+a+'</xf>');else if(/<protection/.test(nx))nx=nx.replace('<protection',a+'<protection');else nx=nx.replace(/<\/xf>$/,a+'</xf>')}
        nx=/applyAlignment=/.test(nx)?nx.replace(/applyAlignment="\d"/,'applyAlignment="1"'):nx.replace('<xf ','<xf applyAlignment="1" ');xch=true}}
    if(mods.shrink){const al=nx.match(/<alignment [^>]*\/>/);
      if(!(al&&(/shrinkToFit="1"/.test(al[0])||/wrapText="1"/.test(al[0])))){
        if(al)nx=nx.replace(al[0],al[0].replace('<alignment ','<alignment shrinkToFit="1" '));
        else{const a2='<alignment shrinkToFit="1"/>';if(/\/>$/.test(nx))nx=nx.replace(/\/>$/,'>'+a2+'</xf>');else if(/<protection/.test(nx))nx=nx.replace('<protection',a2+'<protection');else nx=nx.replace(/<\/xf>$/,a2+'</xf>')}
        nx=/applyAlignment=/.test(nx)?nx.replace(/applyAlignment="\d"/,'applyAlignment="1"'):nx.replace('<xf ','<xf applyAlignment="1" ');xch=true}}
    if(!xch)return cache[key]=s0;
    xfs.push(nx);return cache[key]=xfs.length-1}
  const out=()=>xml.replace(fm[0],'<fonts'+fm[1].replace(/count="\d+"/,'count="'+fonts.length+'"')+'>'+fonts.join('')+'</fonts>').replace(cm[0],'<cellXfs'+cm[1].replace(/count="\d+"/,'count="'+xfs.length+'"')+'>'+xfs.join('')+'</cellXfs>');
  return{get,out};
}

// ---------- celdas
function cellXml(ref,s,f,val){
  const sa=s!==''&&s!=null?' s="'+s+'"':'';
  if(val&&typeof val==='object'&&val.vm)return '<c r="'+ref+'"'+sa+' t="e" vm="'+val.vm+'"><v>#VALUE!</v></c>';
  if(f){if(val===''||val==null)return '<c r="'+ref+'"'+sa+'>'+f+'</c>';
    return typeof val==='number'?'<c r="'+ref+'"'+sa+'>'+f+'<v>'+val+'</v></c>':'<c r="'+ref+'"'+sa+' t="str">'+f+'<v>'+esc(val)+'</v></c>'}
  if(val===''||val==null)return '<c r="'+ref+'"'+sa+'/>';
  if(typeof val==='number')return '<c r="'+ref+'"'+sa+'><v>'+val+'</v></c>';
  return '<c r="'+ref+'"'+sa+' t="inlineStr"><is><t xml:space="preserve">'+esc(val)+'</t></is></c>';
}
function setCell(xml,ref,val,mapS,preserveFormula=true){
  const re=new RegExp('<c r="'+ref+'"([^>]*?)(?:/>|>([\\s\\S]*?)</c>)'),m=xml.match(re);
  if(m){const s0=((m[1].match(/\ss="(\d+)"/)||[])[1])||'',s=mapS&&s0!==''?mapS(+s0):s0;
    const f=preserveFormula?((m[2]||'').match(/<f[^>]*?(?:\/>|>[\s\S]*?<\/f>)/)||[''])[0]:'';
    return xml.replace(re,()=>cellXml(ref,s,f,val))}
  const [cn,rn]=splitRef(ref),rr=new RegExp('<row r="'+rn+'"([^>]*?)(/>|>([\\s\\S]*?)</row>)'),rm=xml.match(rr);
  if(!rm)throw new Error('Fila '+rn+' no existe para '+ref);
  const cells=(rm[3]||'').match(/<c r="[A-Z]+\d+"[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g)||[];let out='',done=false;
  cells.forEach(c=>{const cc=c2n(c.match(/r="([A-Z]+)/)[1]);if(!done&&cc>cn){out+=cellXml(ref,'',null,val);done=true}out+=c});
  if(!done)out+=cellXml(ref,'',null,val);
  return xml.replace(rr,()=>'<row r="'+rn+'"'+rm[1].replace(/\/$/,'')+'>'+out+'</row>');
}

// ---------- geometría exacta de la hoja (el ancho guardado ya incluye el relleno: px = ancho x 7)
function geom(xml){
  const dcw=+((xml.match(/defaultColWidth="([\d.]+)"/)||[])[1]||8.43),drh=+((xml.match(/defaultRowHeight="([\d.]+)"/)||[])[1]||15);
  const cols=[];(xml.match(/<col [^>]*>/g)||[]).forEach(t=>{const a=+t.match(/min="(\d+)"/)[1],b=+t.match(/max="(\d+)"/)[1],w=+((t.match(/width="([\d.]+)"/)||[])[1]||dcw);if(b>200)return;for(let i=a;i<=b;i++)cols[i]=w});
  const rows=[];(xml.match(/<row [^>]*>/g)||[]).forEach(t=>{rows[+t.match(/ r="(\d+)"/)[1]]=+((t.match(/ ht="([\d.]+)"/)||[])[1]||drh)});
  return{cw:i=>Math.round((cols[i]||dcw)*MDW)*EMU,rh:i=>Math.round((rows[i]||drh)*96/72)*EMU};
}
const pos=(fn,start,off)=>{let i=start;while(off>=fn(i)&&i<start+400){off-=fn(i);i++}return[i,Math.round(off)]};

async function fill(tplB64,spec){
  const zip=await JSZip.loadAsync(tplB64,{base64:true}),rd=async p=>zip.file(p).async('string'),has=p=>!!zip.file(p);
  const wb=await rd('xl/workbook.xml'),wr=await rd('xl/_rels/workbook.xml.rels');
  const sheetPath=name=>{const m=[...wb.matchAll(/<sheet [^>]*?name="([^"]*)"[^>]*?r:id="([^"]*)"/g)].find(x=>x[1].replace(/&amp;/g,'&')===name);
    if(!m)throw new Error('Hoja no encontrada: '+name);return 'xl/'+relsOf(wr)[m[2]].replace(/^\/?(xl\/)?/,'')};
  const xmls={},get=async n=>{const p=sheetPath(n);if(!(p in xmls))xmls[p]=await rd(p);return p};
  const parts={},part=async p=>{if(!(p in parts))parts[p]=await rd(p);return parts[p]};
  const ST=Styles(await rd('xl/styles.xml'));
  let ct=await rd('[Content_Types].xml'),wrs=wr;
  const calcRels=[...wrs.matchAll(/<Relationship\b[^>]*\/>/g)].filter(m=>/Type="[^"]*\/calcChain"/.test(m[0]));
  calcRels.forEach(m=>{wrs=wrs.replace(m[0],'')});
  zip.remove('xl/calcChain.xml');
  ct=ct.replace(/<Override\b[^>]*\/>/g,m=>/PartName="\/xl\/calcChain\.xml"/.test(m)?'':m);
  // 0) imágenes dentro de la celda: se registran primero para conocer su vm
  const cellImgs=spec.images.filter(i=>i.cell),floatImgs=spec.images.filter(i=>!i.cell);
  const vmOf=new Map();
  if(cellImgs.length){
    const R={rv:'xl/richData/rdrichvalue.xml',st:'xl/richData/rdrichvaluestructure.xml',ty:'xl/richData/rdRichValueTypes.xml',rel:'xl/richData/richValueRel.xml',rr:'xl/richData/_rels/richValueRel.xml.rels',md:'xl/metadata.xml'};
    const NS='xmlns="http://schemas.microsoft.com/office/spreadsheetml/2017/richdata"';
    if(!has(R.rv)){
      zip.file(R.st,'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n<rvStructures '+NS+' count="1"><s t="_localImage"><k n="_rvRel:LocalImageIdentifier" t="i"/><k n="CalcOrigin" t="i"/></s></rvStructures>');
      zip.file(R.rv,'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n<rvData '+NS+' count="0"></rvData>');
      zip.file(R.ty,'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n<rvTypesInfo xmlns="http://schemas.microsoft.com/office/spreadsheetml/2017/richdata2" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x" xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><global><keyFlags><key name="_Self"><flag name="ExcludeFromFile" value="1"/><flag name="ExcludeFromCalcComparison" value="1"/></key><key name="_DisplayString"><flag name="ExcludeFromCalcComparison" value="1"/></key><key name="_Flags"><flag name="ExcludeFromCalcComparison" value="1"/></key><key name="_Format"><flag name="ExcludeFromCalcComparison" value="1"/></key><key name="_SubLabel"><flag name="ExcludeFromCalcComparison" value="1"/></key><key name="_Attribution"><flag name="ExcludeFromCalcComparison" value="1"/></key><key name="_Icon"><flag name="ExcludeFromCalcComparison" value="1"/></key><key name="_Display"><flag name="ExcludeFromCalcComparison" value="1"/></key><key name="_CanonicalPropertyNames"><flag name="ExcludeFromCalcComparison" value="1"/></key><key name="_ClassificationId"><flag name="ExcludeFromCalcComparison" value="1"/></key></keyFlags></global></rvTypesInfo>');
      zip.file(R.rel,'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n<richValueRels xmlns="http://schemas.microsoft.com/office/spreadsheetml/2022/richvaluerel" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"></richValueRels>');
      zip.file(R.rr,'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>');
      zip.file(R.md,'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n<metadata xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:xlrd="http://schemas.microsoft.com/office/spreadsheetml/2017/richdata"><metadataTypes count="1"><metadataType name="XLRICHVALUE" minSupportedVersion="120000" copy="1" pasteAll="1" pasteValues="1" merge="1" splitFirst="1" rowColShift="1" clearFormats="1" clearComments="1" assign="1" coerce="1"/></metadataTypes><futureMetadata name="XLRICHVALUE" count="0"></futureMetadata><valueMetadata count="0"></valueMetadata></metadata>');
      const ov=(p,t)=>'<Override PartName="'+p+'" ContentType="'+t+'"/>';
      ct=ct.replace('</Types>',ov('/xl/metadata.xml','application/vnd.openxmlformats-officedocument.spreadsheetml.sheetMetadata+xml')+ov('/xl/richData/richValueRel.xml','application/vnd.ms-excel.richvaluerel+xml')+ov('/xl/richData/rdrichvalue.xml','application/vnd.ms-excel.rdrichvalue+xml')+ov('/xl/richData/rdrichvaluestructure.xml','application/vnd.ms-excel.rdrichvaluestructure+xml')+ov('/xl/richData/rdRichValueTypes.xml','application/vnd.ms-excel.rdrichvaluetypes+xml')+'</Types>');
      const rl=(id,t,tg)=>'<Relationship Id="'+id+'" Type="'+t+'" Target="'+tg+'"/>';
      wrs=wrs.replace('</Relationships>',rl('rIdRD1','http://schemas.openxmlformats.org/officeDocument/2006/relationships/sheetMetadata','metadata.xml')+rl('rIdRD2','http://schemas.microsoft.com/office/2022/10/relationships/richValueRel','richData/richValueRel.xml')+rl('rIdRD3','http://schemas.microsoft.com/office/2017/06/relationships/rdRichValue','richData/rdrichvalue.xml')+rl('rIdRD4','http://schemas.microsoft.com/office/2017/06/relationships/rdRichValueStructure','richData/rdrichvaluestructure.xml')+rl('rIdRD5','http://schemas.microsoft.com/office/2017/06/relationships/rdRichValueTypes','richData/rdRichValueTypes.xml')+'</Relationships>');
    }
    let rv=await rd(R.rv),rel=await rd(R.rel),rr=await rd(R.rr),md=await rd(R.md);
    let nRv=+rv.match(/count="(\d+)"/)[1],nRel=(rel.match(/<rel /g)||[]).length,nFm=+md.match(/<futureMetadata[^>]*count="(\d+)"/)[1],nVm=+md.match(/<valueMetadata[^>]*count="(\d+)"/)[1];
    let addRv='',addRel='',addRr='',addFm='',addVm='';
    cellImgs.forEach((im,k)=>{
      const mp='xl/media/mticc'+(k+1)+'.'+im.ext,id='rIdMC'+(k+1);zip.file(mp,im.bytes);
      addRel+='<rel r:id="'+id+'"/>';addRr+='<Relationship Id="'+id+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/mticc'+(k+1)+'.'+im.ext+'"/>';
      addRv+='<rv s="0"><v>'+nRel+'</v><v>5</v></rv>';addFm+='<bk><extLst><ext uri="{3e2802c4-a4d2-4d8b-9148-e3be6c30e623}"><xlrd:rvb i="'+nRv+'"/></ext></extLst></bk>';
      addVm+='<bk><rc t="1" v="'+nFm+'"/></bk>';nRel++;nRv++;nFm++;nVm++;vmOf.set(im,nVm)});
    zip.file(R.rv,rv.replace(/count="\d+"/,'count="'+nRv+'"').replace('</rvData>',addRv+'</rvData>'));
    zip.file(R.rel,rel.replace('</richValueRels>',addRel+'</richValueRels>'));zip.file(R.rr,rr.replace('</Relationships>',addRr+'</Relationships>'));
    zip.file(R.md,md.replace(/(<futureMetadata[^>]*count=")\d+/,'$1'+nFm).replace('</futureMetadata>',addFm+'</futureMetadata>').replace(/(<valueMetadata[^>]*count=")\d+/,'$1'+nVm).replace('</valueMetadata>',addVm+'</valueMetadata>'));
    if(!/Extension="png"/i.test(ct))ct=ct.replace(/(<Types[^>]*>)/,'$1<Default Extension="png" ContentType="image/png"/>');
  }
  // 1) celdas (con estilo: texto negro y fuente del formato)
  const FN=spec.fontName===undefined?'Calibri':spec.fontName;
  for(const c of spec.cells){const p=await get(c.sheet),has2=!(c.val===''||c.val==null);
    const mods=Object.assign(has2?(FN?{color:'black',name:FN}:{color:'black'}):{},c.st||{});
    xmls[p]=setCell(xmls[p],c.ref,c.val,Object.keys(mods).length?s0=>ST.get(s0,mods):null,c.noFormula!==true)}
  for(const im of cellImgs){const p=await get(im.sheet);xmls[p]=setCell(xmls[p],im.range.split(':')[0],{vm:vmOf.get(im)},null)}
  // 2) imágenes flotantes
  const ext=new Set(floatImgs.map(i=>i.ext));
  ext.forEach(e=>{if(!new RegExp('Extension="'+e+'"','i').test(ct))ct=ct.replace(/(<Types[^>]*>)/,'$1<Default Extension="'+e+'" ContentType="image/'+(e==='jpg'?'jpeg':e)+'"/>')});
  const dr={};let n=0;
  for(const im of floatImgs){
    const sp=await get(im.sheet),sx=xmls[sp],sf=sp.replace('worksheets/','worksheets/_rels/')+'.rels',srel=await rd(sf),dt=srel.match(/Target="\.\.\/drawings\/(drawing[^"]+)"/)[1],dp='xl/drawings/'+dt,drp='xl/drawings/_rels/'+dt+'.rels';
    if(!(dp in dr))dr[dp]={xml:await rd(dp),rel:await rd(drp)};
    const d=dr[dp];n++;const mp='xl/media/mtic'+n+'.'+im.ext;zip.file(mp,im.bytes);const rid='rIdM'+n;
    d.rel=d.rel.replace('</Relationships>','<Relationship Id="'+rid+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/mtic'+n+'.'+im.ext+'"/></Relationships>');
    const [a,b]=im.range.split(':'),[c1,r1]=splitRef(a),[c2,r2]=splitRef(b||a),G=geom(sx);
    let W=0,H=0;for(let i=c1;i<=c2;i++)W+=G.cw(i);for(let i=r1;i<=r2;i++)H+=G.rh(i);
    const k=Math.min(W/im.w,H/im.h),cx=Math.round(im.w*k),cy=Math.round(im.h*k),[ci,co]=pos(G.cw,c1,(W-cx)/2),[ri,ro]=pos(G.rh,r1,(H-cy)/2);
    d.xml=d.xml.replace('</xdr:wsDr>','<xdr:oneCellAnchor><xdr:from><xdr:col>'+(ci-1)+'</xdr:col><xdr:colOff>'+co+'</xdr:colOff><xdr:row>'+(ri-1)+'</xdr:row><xdr:rowOff>'+ro+'</xdr:rowOff></xdr:from><xdr:ext cx="'+cx+'" cy="'+cy+'"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="'+(2000+n)+'" name="Foto '+n+'"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="'+rid+'"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="'+cx+'" cy="'+cy+'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>');
  }
  // 3) casillas de verificación de formulario (Paradas de reloj)
  const NMAP={'14:152400':1,'14:685800':2,'15:419100':3,'16:209550':4};
  for(const ck of spec.checks||[]){
    const sp=await get(ck.sheet),sx=xmls[sp],sf=sp.replace('worksheets/','worksheets/_rels/')+'.rels',rl=relsOf(await rd(sf)),G=geom(sx);
    const vmlT=Object.values(rl).find(t=>/vmlDrawing/.test(t)),vp=vmlT&&'xl/drawings/'+vmlT.split('/').pop();
    const re=/<control shapeId="(\d+)" r:id="(rId\d+)"[^>]*>[\s\S]*?<from><xdr:col>(\d+)<\/xdr:col><xdr:colOff>(\d+)<\/xdr:colOff><xdr:row>(\d+)<\/xdr:row><xdr:rowOff>(\d+)<\/xdr:rowOff><\/from><to><xdr:col>(\d+)<\/xdr:col><xdr:colOff>(\d+)<\/xdr:colOff><xdr:row>(\d+)<\/xdr:row><xdr:rowOff>(\d+)<\/xdr:rowOff><\/to>/g;
    const yAt=(r0,off)=>{let y=0;for(let i=1;i<=r0;i++)y+=G.rh(i);return y+off};
    for(const m of sx.matchAll(re)){
      const num=NMAP[m[3]+':'+m[4]];if(num!==ck.n)continue;
      const cy=(yAt(+m[5],+m[6])+yAt(+m[9],+m[10]))/2;let acc=0,R=1;while(acc+G.rh(R)<=cy&&R<400){acc+=G.rh(R);R++}
      if(R!==ck.row)continue;
      const cp='xl/ctrlProps/'+rl[m[2]].split('/').pop();let t=await part(cp);if(!/checked=/.test(t))parts[cp]=t.replace(/(\/?>)\s*$/,' checked="Checked"$1');
      if(vp){let v=await part(vp);const i=v.indexOf('id="_x0000_s'+m[1]+'"');if(i>=0){const j=v.indexOf('</x:ClientData>',i);if(j>=0&&!v.slice(i,j).includes('<x:Checked>'))parts[vp]=v.slice(0,j)+'<x:Checked>1</x:Checked>\n  '+v.slice(j)}}
    }
  }
  zip.file('[Content_Types].xml',ct);
  Object.keys(xmls).forEach(p=>zip.file(p,xmls[p]));Object.keys(parts).forEach(p=>zip.file(p,parts[p]));
  Object.keys(dr).forEach(p=>{zip.file(p,dr[p].xml);zip.file(p.replace('drawings/','drawings/_rels/')+'.rels',dr[p].rel)});
  zip.file('xl/styles.xml',ST.out());
  zip.file('xl/_rels/workbook.xml.rels',wrs);
  const calcPr=wb.match(/<calcPr\b([^>]*?)(?:\/>|>[\s\S]*?<\/calcPr>)/);
  const recalculated=calcPr?wb.replace(calcPr[0],'<calcPr'+calcPr[1].replace(/\s(?:fullCalcOnLoad|forceFullCalc|calcMode)="[^"]*"/g,'')+' fullCalcOnLoad="1" forceFullCalc="1" calcMode="auto"/>'):wb.replace('</workbook>','<calcPr fullCalcOnLoad="1" forceFullCalc="1" calcMode="auto"/></workbook>');
  zip.file('xl/workbook.xml',recalculated);
  return zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',compression:'STORE'});
}
g.XL={fill,setCell};
})(typeof window!=='undefined'?window:globalThis);
