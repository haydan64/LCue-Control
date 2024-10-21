const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
    'api',
    {
        send: (channel, data) => {
            if(["connectToAddress"].includes(channel))
            ipcRenderer.send(channel, data);
        }
    }
);