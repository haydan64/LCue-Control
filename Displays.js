const { EventEmitter } = require('events');
const db = require("./db");

class Display extends EventEmitter {
    constructor(id, name, alwaysOnTop, startFullscreen, startInKiosk, files, playlists) {
        super();
        this.id = id;
        this.name = name;
        this.alwaysOnTop = alwaysOnTop;
        this.startFullscreen = startFullscreen;
        this.startInKiosk = startInKiosk;
        this.files = files || [];
        this.playlists = playlists || [];
        this.on("fileList", (fileList) => {
            this.files = fileList;
            this.emit("files", fileList);
        })
        this.on("playlist", (playlists)=> {
            this.playlists = playlists;
            this.emit("sync", "playlists", playlists);
        })
        this.on("showFile", this.showFile);
        this.on("showPlaylist", this.showPlaylist);
        this.on("advancePlaylist", this.advancePlaylist);
        this.on("downloadFile", this.downloadFile);
        this.on("name", this.changeName);
        this.on("alwaysOnTop", this.changeAlwaysOnTop);
        this.on("startFullscreen", this.changeStartFullscreen);
        this.on("startInKiosk", this.changeStartInKiosk);
    }
}

function sanitizeName(name) {
    return name.replace(/[^a-zA-Z0-9 ]/g, ''); // Remove any characters that are not letters, numbers, or spaces
}

class Displays extends EventEmitter {
    constructor() {
        super();
        this.displays = {};
    }
    setDisplays(displays) {
        displays.forEach((display)=>{

        })
    }
}

const displays = new Displays();

module.exports = { Displays: displays };