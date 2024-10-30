const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const db = require("./db");
const axios = require('axios'); // Import axios for HTTP requests
const ioClient = require('socket.io-client');

if (!db.get("controlerID")) {
    db.set("controlerID", Math.floor(Math.random() * 1e9))
}
const controlerID = db.get("controlerID");

let window, connectToServerWindow = null;


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
                    id: controlerID
                });
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
        // Create the control window
        window = new BrowserWindow({
            width: 800,
            height: 600,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
            },
        });
        window.loadFile('html/home.html');
        return window;
    }
    if (window.isMinimized()) window.restore();
    window.focus();
    return window;
}


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindows();
});