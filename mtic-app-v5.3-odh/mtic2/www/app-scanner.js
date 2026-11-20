// ===== lector QR / barras
async function scan(cb){if(window.Html5Qrcode)return scanWeb(cb);return scanNative(cb)}
async function scanNative(cb){const S=PL('Scan');if(!S){alert('El lector no está disponible. Escribe el código manualmente.');return}try{const r=await S.scan({prompt:'Enfoca el código QR o de barras'});if(r&&r.text)cb(r.text)}catch(e){alert('No se pudo abrir el lector: '+(e.message||e))}}
function scanWeb(cb){
 const o=document.createElement('div');o.id='scan';o.className='camera-screen';o.innerHTML='<div class="scan-heading">Apunta al código QR o de barras</div><div class="camera-preview scan-preview" id="qr"><div class="scan-frame"></div></div><div class="camera-tools"><label>Zoom <input id="scan-zoom" type="range" min="1" max="1" step="any" disabled></label><div class="r"><button id="scan-torch" disabled>Linterna no disponible</button><button id="qx">Cancelar</button><label class="bt">Leer de una imagen<input type="file" accept="image/*" hidden id="qf"></label></div><div class="camera-status" id="scan-status">Conectando la cámara…</div></div>';
 document.body.appendChild(o);let q=null,detatch=()=>{},stopped=false;try{q=new Html5Qrcode('qr')}catch(e){}
 const stop=async()=>{if(stopped)return;stopped=true;window.__closeScanner=null;detatch();if(q){try{await q.stop()}catch(e){}try{q.clear()}catch(e){}}o.remove()};window.__closeScanner=stop;
 $('#qx').onclick=stop;
 $('#qf').onchange=async ev=>{const f=ev.target.files[0];if(!f||!q)return;try{const t=await q.scanFile(f,false);await stop();cb(t)}catch(e){alert('No se encontró un código en esa imagen.')}};
 if(!q){o.remove();scanNative(cb);return}
 const formats=window.Html5QrcodeSupportedFormats?Object.values(window.Html5QrcodeSupportedFormats).filter(Number.isInteger):undefined;
 q.start({facingMode:'environment'},{fps:10,qrbox:{width:260,height:160},formatsToSupport:formats},async t=>{await stop();cb(t)},()=>{}).then(async()=>{if(stopped){try{await q.stop()}catch(e){}try{q.clear()}catch(e){}return}detatch=attachCameraControls($('#qr'),()=>{const v=$('#qr video');return v&&v.srcObject&&v.srcObject.getVideoTracks()[0]},'#scan-zoom','#scan-torch','#scan-status')}).catch(async e=>{if(stopped)return;await stop();const S=PL('Scan');if(S){alert('La cámara integrada no está disponible; se abrirá el lector estándar, que puede no ofrecer zoom ni linterna.');scanNative(cb)}else alert('No se pudo abrir la cámara para escanear: '+(e.message||e))})
}
function showCode(t){const o=document.createElement('div');o.className='ov';o.id='ov';o.innerHTML='<div><b>Código leído</b><div style="word-break:break-all;font-size:17px">'+esc(t)+'</div><button data-x="copy" data-v="'+esc(t)+'">Copiar</button><button data-x="ovx">Cerrar</button></div>';document.body.appendChild(o)}
