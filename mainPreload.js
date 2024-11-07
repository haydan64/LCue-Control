const { contextBridge, ipcRenderer } = require('electron');
//temporarily expose everything for development.
contextBridge.exposeInMainWorld('api', {
    emit: (channel, ...args) => ipcRenderer.send(channel, ...args),
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),
    once: (channel, callback) => ipcRenderer.once(channel, (event, ...args) => callback(...args)),
    removeListener: (channel, callback) => ipcRenderer.removeListener(channel, callback)
});