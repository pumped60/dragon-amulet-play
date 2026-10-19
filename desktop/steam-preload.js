// The Steam copy only: lets the game report an achievement to Steam (desktop/main.js passes it on) and nothing else.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('steamBridge', { achieve: name => ipcRenderer.send('steam-achieve', String(name)) });
