const { app, BrowserWindow } = require('electron');
const path = require('path');
require('dotenv').config();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 450,
    height: 650,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    frame: true,
    resizable: true,
    alwaysOnTop: true,
    // THIS IS THE KEY: Set content protection to exclude from screen capture
    contentProtection: true,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1e1e1e'
  });

  // CRITICAL: Set the window to be excluded from screen capture
  // This works on macOS to hide from Zoom, Teams, etc.
  if (process.platform === 'darwin') {
    mainWindow.setContentProtection(true);
  }

  mainWindow.loadFile('index.html');

  // Optional: Open DevTools in development
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  console.log('✅ Window created with content protection enabled');
  console.log('   Window should be invisible to screen sharing');
}

app.whenReady().then(() => {
  // Hide from Dock on macOS
  if (process.platform === 'darwin' && app.dock) {
    app.dock.hide();
  }
  
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
