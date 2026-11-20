// ===== imágenes
const im=f=>new Promise((ok,ko)=>{const u=URL.createObjectURL(f),i=new Image();i.onload=()=>{URL.revokeObjectURL(u);ok(i)};i.onerror=ko;i.src=u});
const photoMaxEdge=()=>Math.max(128,Math.round(1280*Math.max(10,Math.min(100,+SET.pct||100))/100));
async function mark(file,lines,o={}){const i=await im(file),k=o.original?1:o.max?Math.min(1,o.max/Math.max(i.width,i.height)):(SET.pct>=100?1:SET.pct/100),w=Math.max(1,Math.round(i.width*k)),h=Math.max(1,Math.round(i.height*k)),c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.drawImage(i,0,0,w,h);
  if(lines){const fs=Math.max(12,Math.round(Math.max(w,h)/40));x.font='bold '+fs+'px sans-serif';x.textAlign='right';x.textBaseline='bottom';x.fillStyle='#fff';x.strokeStyle='rgba(0,0,0,.85)';x.lineWidth=fs/5;x.lineJoin='round';lines.forEach((t,j)=>{const y=h-fs/2-(lines.length-1-j)*fs*1.2;x.strokeText(t,w-fs/2,y);x.fillText(t,w-fs/2,y)})}
  return{d:o.png?c.toDataURL('image/png'):c.toDataURL('image/jpeg',o.original||SET.pct>=100?.95:.85),w,h}}
const u8=d=>Uint8Array.from(atob(d.split(',')[1]),c=>c.charCodeAt(0));
const fc=c=>Math.abs(c[0]).toFixed(6)+(c[0]>=0?'N':'S')+' '+Math.abs(c[1]).toFixed(6)+(c[1]>=0?'E':'W');
function naImg(){const c=document.createElement('canvas');c.width=470;c.height=220;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,470,220);x.fillStyle='#000';x.font='bold 120px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('N/A',235,115);return{bytes:u8(c.toDataURL('image/png')),w:470,h:220,ext:'png'}}
const signature=()=>{const g=PROF.firma||firmaF;return g?{bytes:u8(g.d),w:g.w,h:g.h,ext:'png'}:null};
// ===== GPS en vivo
let gpsRequest=null;
function getPos(){if(gpsRequest)return gpsRequest;gpsRequest=(async()=>{const Cam=PL('Cam');if(Cam&&Cam.getLocation){const p=await Cam.getLocation();return{c:[p.latitude,p.longitude],acc:p.accuracy||0,t:p.timestamp||Date.now()}}return new Promise(r=>{if(!navigator.geolocation)return r(null);navigator.geolocation.getCurrentPosition(p=>r({c:[p.coords.latitude,p.coords.longitude],acc:p.coords.accuracy,t:Date.now()}),()=>r(null),{enableHighAccuracy:true,timeout:15000,maximumAge:0})})})();return gpsRequest.finally(()=>{gpsRequest=null})}
function gpsOn(){if(wid!==null)return;const Cam=PL('Cam');if(Cam&&Cam.getLocation){getPos().then(p=>{fixv=p;autoCoord();gpsLabel()}).catch(e=>gpsLabel(e.message||'No se pudo obtener la ubicación'));return}if(!navigator.geolocation)return;try{wid=navigator.geolocation.watchPosition(p=>{fixv={c:[p.coords.latitude,p.coords.longitude],acc:p.coords.accuracy,t:Date.now()};autoCoord();gpsLabel()},()=>{gpsLabel('GPS sin señal o sin permiso: escribe las coordenadas a mano')},{enableHighAccuracy:true,maximumAge:5000,timeout:30000})}catch(e){gpsLabel(e.message||'No se pudo iniciar el GPS')}}
function gpsOff(){if(wid!==null&&navigator.geolocation)navigator.geolocation.clearWatch(wid);wid=null}
function autoCoord(force){if(!job||!fixv)return;const f=job.f;if(f.coordAuto===false&&!force)return;if(force||!f.coord||fixv.acc<(f.cacc||1e9)-1){f.coord=fixv.c[0].toFixed(6)+', '+fixv.c[1].toFixed(6);f.cacc=fixv.acc;const n=$('input[data-b="f/coord"]');if(n)n.value=f.coord;sv()}}
function gpsLabel(t){const n=$('#gl');if(n)n.textContent=t||(fixv?'GPS en vivo: '+fc(fixv.c)+' (±'+Math.round(fixv.acc)+' m)':'Buscando señal GPS...')}
function toast(t){let n=$('#tt');if(!n){n=document.createElement('div');n.id='tt';n.style.cssText='position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));background:var(--ac);color:var(--bg);padding:10px;border-radius:10px;text-align:center;z-index:30';document.body.appendChild(n)}n.textContent=t;n.style.display=t?'block':'none'}
function attachCameraControls(root,getTrack,zoomId,torchId,statusId){
 const zoom=$(zoomId),lamp=$(torchId),status=$(statusId);let track=null,torchOn=false;
 const message=t=>{if(status)status.textContent=t};
 const setZoom=async value=>{if(!track||!zoom||zoom.disabled)return;const c=track.getCapabilities&&track.getCapabilities(),z=c&&c.zoom;if(!z)return;const v=Math.max(z.min,Math.min(z.max,+value));try{await track.applyConstraints({advanced:[{zoom:v}]});zoom.value=String(v)}catch(e){message('Este dispositivo no permite cambiar el zoom durante la captura.')}};
 const onZoom=()=>setZoom(zoom.value);
 const onLamp=async()=>{if(!track)return;try{torchOn=!torchOn;await track.applyConstraints({advanced:[{torch:torchOn}]});lamp.textContent=torchOn?'Linterna: encendida':'Linterna: apagada';lamp.setAttribute('aria-pressed',String(torchOn))}catch(e){torchOn=!torchOn;message('No se pudo cambiar la linterna en esta cámara.')}};
 if(!root)return()=>{};
 const distance=e=>{const a=e.touches[0],b=e.touches[1];return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)};
 let pinchStart=0,zoomStart=1;
 const touchStart=e=>{if(e.touches.length===2&&track){const c=track.getCapabilities&&track.getCapabilities(),z=c&&c.zoom;if(z){pinchStart=distance(e);zoomStart=(track.getSettings&&track.getSettings().zoom)||+zoom.value||z.min}}};
 const touchMove=e=>{if(e.touches.length===2&&pinchStart){e.preventDefault();const c=track&&track.getCapabilities&&track.getCapabilities(),z=c&&c.zoom;if(z)setZoom(Math.max(z.min,Math.min(z.max,zoomStart*distance(e)/pinchStart))) }};
 root.addEventListener('touchstart',touchStart,{passive:true});root.addEventListener('touchmove',touchMove,{passive:false});
 const init=()=>{try{track=getTrack();const c=track&&track.getCapabilities?track.getCapabilities():{},z=c.zoom;
  if(z&&zoom){zoom.min=z.min;zoom.max=z.max;zoom.step=z.step||'any';zoom.value=(track.getSettings&&track.getSettings().zoom)||z.min;zoom.disabled=false;zoom.oninput=onZoom;message('Usa el control o pellizca la imagen para ajustar el zoom.')}
  else{if(zoom)zoom.disabled=true;message('El zoom no está disponible en esta cámara.')}
  if(lamp){lamp.disabled=!c.torch;lamp.textContent=c.torch?'Linterna: apagada':'Linterna no disponible';lamp.onclick=c.torch?onLamp:null}
 }catch(e){if(zoom)zoom.disabled=true;if(lamp)lamp.disabled=true;message('No se pudieron consultar los controles de la cámara.')}};
 init();
 return()=>{zoom&&(zoom.oninput=null);lamp&&(lamp.onclick=null);root.removeEventListener('touchstart',touchStart);root.removeEventListener('touchmove',touchMove);torchOn=false;track=null}
}
// ===== guardar / compartir archivos
async function guardar(files){const C=CAP(),bytes=async f=>{const value=f.load?await f.load():f.u8,size=value&&(value.size||value.byteLength||value.length);if(!value||!size)throw new Error('El archivo '+f.fn+' no está disponible en el almacenamiento local');return value};
 if(C){const{Filesystem,Share}=C.Plugins,uris=[];for(const f of files){const u=await bytes(f),b=await new Promise((r,j)=>{const fr=new FileReader();fr.onload=()=>r(fr.result.split(',')[1]);fr.onerror=()=>j(fr.error||new Error('No se pudo preparar el archivo para compartir'));fr.readAsDataURL(new Blob([u]))});uris.push((await Filesystem.writeFile({path:f.fn,data:b,directory:'CACHE'})).uri)}
  await Share.share(uris.length>1?{title:'MinTIC',files:uris}:{title:files[0].fn,url:uris[0]});return}
 const dl=window.claude&&window.claude.use?await window.claude.use('downloads'):null;
 for(const f of files){const bl=new Blob([await bytes(f)],{type:f.mime||XLSX_T});if(dl)await dl.save({filename:f.fn,data:bl});else{const a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download=f.fn;document.body.appendChild(a);a.click();a.remove()}}}
