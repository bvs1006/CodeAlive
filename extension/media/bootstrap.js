window.codeAliveHost=acquireVsCodeApi();
function reportStudioError(event){const text=String(event.message||event.reason?.message||event.reason||'Unknown studio error');const status=document.getElementById('editorStatus');if(status)status.textContent='Studio error: '+text;window.codeAliveHost.postMessage({type:'bridgeError',message:text});}
window.addEventListener('error',reportStudioError);
window.addEventListener('unhandledrejection',reportStudioError);
