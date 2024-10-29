const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
    'Devices', /* Devices Class */
);