const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require("./db");
const axios = require('axios'); // Import axios for HTTP requests
const ioClient = require('socket.io-client');


let window, connectToServerWindow = null;


let http, socket;
let serverAddress = db.get("serverAddress");
if (serverAddress) {
  connectToServer(serverAddress);
} else {
  app.whenReady().then(createConnectToServerWindow);
}


function connectToServer(serverAddress) {
  axios.get(`http://${serverAddress}/api/healthcheck`) // Example endpoint to check server status
    .then(response => {
      // If the server responds, set up HTTP and socket connections
      http = axios.create({
        baseURL: `http://${serverAddress}`
      });

      socket = ioClient(`http://${serverAddress}`);

      socket.on('connect', () => {
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
  if(!address) return;
  connectToServer(address);
})

function connectedToServer() {
  console.log('Connected to server');
  connectToServerWindow.close();
  createHomeWindow();
}


function createConnectToServerWindow() {
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
}


function createHomeWindow() {
  if(!window) {
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