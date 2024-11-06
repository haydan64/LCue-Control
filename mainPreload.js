const { contextBridge, ipcRenderer } = require('electron');
console.log("Main Preload Script has started.");
const { Displays } = require("./Displays.js");
const { Cues } = require("./Cues.js");
const { Actions } = require("./Actions.js");
const { Triggers } = require("./Actions.js");
const Devices = require("./Devices.js");

console.log(Cues);

contextBridge.exposeInMainWorld('Displays', Displays);
contextBridge.exposeInMainWorld('Cues', Cues);
contextBridge.exposeInMainWorld('Actions', Actions);
contextBridge.exposeInMainWorld('Triggers', Triggers);
contextBridge.exposeInMainWorld('Devices', Devices);