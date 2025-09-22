const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script loaded');

contextBridge.exposeInMainWorld('electronAPI', {
  startMinecraft: (params) => {
    console.log('startMinecraft called from renderer');
    ipcRenderer.send('start-minecraft', {params});
  },
  noUpdate: (callback) => {
    ipcRenderer.on('no-update', callback);
  },
  requestUpdate: () => ipcRenderer.send('request-update'),
  updateProgress: (callback) => {
    ipcRenderer.on('update-progress', (event, progress) => {
      callback(progress);
    });
  }
});

console.log('electronAPI exposed to main world');
