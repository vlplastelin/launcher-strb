const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script loaded');

contextBridge.exposeInMainWorld('electronAPI', {
  startMinecraft: () => {
    console.log('startMinecraft called from renderer');
    ipcRenderer.send('start-minecraft');
  }
});

console.log('electronAPI exposed to main world');
