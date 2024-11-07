const { app, screen, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const db = require("./db");
const axios = require('axios'); // Import axios for HTTP requests
const ioClient = require('socket.io-client');

//Important initialization
if (!db.get("controlerID")) {
    db.set("controlerID", Math.floor(Math.random() * 1e9))
}
const controlerID = db.get("controlerID");

let window, connectToServerWindow = null;

const { Displays } = require("./Displays.js");
const { Cues } = require("./Cues.js");
const { Actions } = require("./Actions.js");
const { Triggers } = require("./Triggers.js");
const Devices = require("./Devices.js");


function isPositionWithinBounds(x, y, width, height, tolerance = 10) {
    const displays = screen.getAllDisplays();
    for (let display of displays) {
        const bounds = display.bounds;
        if (
            x >= bounds.x - tolerance &&
            y >= bounds.y - tolerance &&
            x + width <= bounds.x + bounds.width + tolerance &&
            y + height <= bounds.y + bounds.height + tolerance
        ) {
            return true;
        }
    }
    return false;
}


let http, socket;
let serverAddress = db.get("serverAddress");
if (serverAddress) {
    app.whenReady().then(() => {
        if (socket?.connected) return;
        createConnectToServerWindow(serverAddress)
    });
    connectToServer(serverAddress);
} else {
    app.whenReady().then(createConnectToServerWindow);
}

// Create a custom menu
const menuTemplate = [
    {
        label: 'File',
        submenu: [
            { role: 'quit' },
            { type: 'separator' },
            {
                label: 'Snapshot',
                click: () => {
                    // Add your snapshot logic here
                }
            },
            {
                label: 'Load Snapshot',
                click: () => {
                    // Add your load snapshot logic here
                }
            },
            {
                label: 'Open Workspace',
                click: () => {
                    // Add your open workspace logic here
                }
            },
            {
                label: 'New Workspace',
                click: () => {
                    // Add your new workspace logic here
                }
            },
            {
                label: 'Delete Workspace',
                click: () => {
                    // Add your delete workspace logic here
                }
            },
            {
                label: 'Disconnect',
                click: () => {
                    // Add your disconnect logic here
                }
            }
        ]
    },
    {
        label: 'Edit',
        role: 'undo'
    },
    {
        label: 'View',
        submenu: [
            { role: 'reload' }, // This ensures Ctrl+R works for reloading
            { role: 'zoomin' },
            { role: 'zoomout' },
            {
                label: 'Open DevTools',
                accelerator: 'CmdOrCtrl+Shift+I',
                click: (menuItem, browserWindow) => {
                    if (browserWindow) {
                        browserWindow.webContents.openDevTools();
                    }
                }
            }
        ]
    }
];

const menu = Menu.buildFromTemplate(menuTemplate);
Menu.setApplicationMenu(menu);

function createContextMenu(template) {
    return Menu.buildFromTemplate(template);
}


function connectToServer(serverAddress) {
    axios.get(`http://${serverAddress}/api/healthcheck`) // Example endpoint to check server status
        .then(response => {
            // If the server responds, set up HTTP and socket connections
            http = axios.create({
                baseURL: `http://${serverAddress}`
            });

            socket = ioClient(`http://${serverAddress}/controler`);
            socket.on('connect', () => {
                socket.emit('id', {
                    deviceType: "controler",
                    version: "0",
                    id: controlerID
                });
                socket.on("displaysSync", (event, ...args) => {
                    Displays.emit(event, ...args)
                });
                //socket.emit("display", 694478262, "showFile", "Untitled.png") <== Test, I can't believe it actually worked first try!
                socket.on("displaySync", (id, event, ...args) => {
                    Displays.displays[id]?.emit(event, ...args);
                });
                Cues.on("sync", (event, ...args) => {
                    socket.emit("cues", event, ...args);
                });
                socket.on("cuesSync", (event, ...args) => {
                    Cues.emit(event, ...args);
                })
                socket.on("actionsSync", (event, ...args) => {
                    Actions.emit(event, ...args);
                });
                Actions.on("sync", (event, ...args) => {
                    socket.emit("actions", event, ...args);
                })
                if (db.get("serverAddress") !== serverAddress) db.set("serverAddress", serverAddress);
                connectedToServer();
            });

            socket.on('disconnect', () => {
                createConnectToServerWindow();
            });

            console.log('Connected to server successfully');
        })
        .catch(error => {
            // If the server is unreachable, set http and socket to null
            console.error('Failed to connect to server:', error);
            http = null;
            socket = null;
            return true;
        });
}

ipcMain.on("connectToAddress", (event, address) => {
    if (!address) return;
    connectToServer(address);
})

function connectedToServer() {
    console.log('Connected to server');
    if (connectToServerWindow) connectToServerWindow.close();
    connectToServerWindow = null;
    createHomeWindow();
}


function createConnectToServerWindow(serverAddress) {
    if (connectToServerWindow === null) {
        // Create the control window
        connectToServerWindow = new BrowserWindow({
            width: 800,
            height: 600,
            webPreferences: {
                preload: path.join(__dirname, 'html/connectToServerPreload.js'),
                contextIsolation: true
            },
        });
        connectToServerWindow.loadFile('html/connectToServer.html');
        connectToServerWindow.on("closed", () => {
            connectToServerWindow = null;
        })
        return connectToServerWindow;
    } else {
        if (connectToServerWindow.isMinimized()) connectToServerWindow.restore();
        connectToServerWindow.focus();
        return connectToServerWindow;
    }
    connectToServerWindow.webContents.send('connectingTo', serverAddress);
}


function createHomeWindow() {
    if (!window) {
        let windowState = db.get("windowState");
        if(!windowState) {
            windowState = {
                width: 800,
                height: 600,
                x: undefined,
                y: undefined,
                isMaximized: false,
                isFullscren: false
            }
        }
        // Check if the position is within bounds
        if (!isPositionWithinBounds(windowState.x, windowState.y, windowState.width, windowState.height)) {
            windowState.x = undefined;
            windowState.y = undefined;
        }
        
        // Create the control window
        window = new BrowserWindow({
            width: windowState.width,
            height: windowState.height,
            x: windowState.x,
            y: windowState.y,
            webPreferences: {
                preload: path.join(__dirname, 'mainPreload.js'),
            }
        });
        if(windowState.isMaximized || windowState.isFullScreen) {
            window.once("ready-to-show", ()=>{
                if(windowState.isMaximized) window.maximize();
                if(windowState.isFullscreen) window.setFullScreen(true);
            })
        }
        window.on("close", ()=> {
            const windowBounds = window.getBounds();
            const isMaximized = window.isMaximized();
            const isFullScreen = window.isFullScreen();
            db.set("windowState", {...windowBounds, isMaximized, isFullScreen});
        })
        window.loadFile('html/home.html');
        return window;
    }
    if (window.isMinimized()) window.restore();
    window.focus();
    return window;
}

ipcMain.on('show-context-menu', (event, options)=> {
    let template;
    if(!options.type) return;
    switch(options.type) {
        case("cue"): {
            template = [
                {label: "Goto", click: ()=>{

                }},
                {label: "Name", click: ()=>{
                    event.sender.send('cuectx:name', options.id, Cues.cues[options.id]?.name, Cues.cues[options.id]?.position);
                }},
                {label: "Move To", click: ()=>{
                    event.sender.send('cuectx:moveTo', options.id, Cues.cues[options.id]?.position);
                }},
                {label: "Copy To", click: ()=>{
                    event.sender.send('cuectx:copyTo', options.id);
                }},
                {label: "Delete", click: ()=>{
                    Cues.deleteCue(options.id)}
                },
                {label: "New Action", click: ()=>{
                    event.sender.send('cuectx:newAction', options.id);
                }},
                {label: "Paste Action", click: ()=>{
                    event.sender.send('cuectx:pasteAction', options.id);
                }},
            ]
            break;
        }
        case("action"): {
            template = [
                {label: "Run Action", click: ()=>{
                    Actions.triggerAction(options.id)
                }},
                {label: "Edit Action", click: ()=>{
                    event.sender.send('actionctx:edit', options.id, options.cueID, Actions.actions[options.id]?.options);
                }},
                {label: "Copy Action", click: ()=>{
                    event.sender.send('actionctx:copy', options.id);
                }},
                {label: "Delete Action", click: ()=>{
                    Cues.deleteCue(options.id)}
                }
            ]
            break;
        }
        case("triggerBox"): {
            template = [
                {label: "New Trigger", click: ()=>{
                    Tiggers.triggerAction(options.id)
                }}
            ]
            break;
        }
    }
    const menu = createContextMenu(template);
    menu.popup(BrowserWindow.fromWebContents(event.sender));
});
function emitWindow(event, ...args) {
    if(window && window.webContents) {
        window.webContents.send(event, ...args);
    }
}

ipcMain.on("cues:nameCue", (event, id, newName) => {
    Cues.nameCue(id, newName);
});
ipcMain.on("cues:createNew", () => {
    Cues.newCue();
});
ipcMain.on("cues:moveCue", (event, id, newPosition) => {
    Cues.moveCue(id, newPosition);
});
ipcMain.on("cues:createAction", (event, id, options)=> {
    Cues.createAction(id, options);
});
ipcMain.on("cues:editAction", (event, id, options)=> {
    Actions.editAction(id, options);
});
ipcMain.handle("cues:getCues", () => {
    return Cues.getCues(true);
});
ipcMain.handle("actions:getAction", (event, action) => {
    return Actions.actions[action];
});
ipcMain.handle("displays:getDisplay", (event, id) => {
    console.log(id, Displays.displays);
    return {files:Displays.displays[id].files, playlists:Displays.displays[id].playlists};
});
ipcMain.handle("getDevicesAndDisplays", (event) => {
    return {
        devices: Devices.getDevices(),
        displays: Displays.getDisplays()
    }
});
Cues.on("show", (event, ...args)=> {
    emitWindow("cues:" + event, ...args);
});
Actions.on("show", (event, ...args)=> {
    emitWindow("actions:" + event, ...args);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindows();
});