// Dragon Amulet for Mac and Windows: the same one-file game in its own window.
// F11 (or Ctrl+Cmd+F on a Mac) switches full screen; saves stay on this computer.
const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 800, minWidth: 800, minHeight: 500,
    title: 'Dragon Amulet', backgroundColor: '#16121f', autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { contextIsolation: true, sandbox: true }
  });
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
  // links to other sites open in the normal browser, not inside the game
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
}

// a small menu so Mac users keep the usual Quit, copy and paste, and full screen shortcuts
Menu.setApplicationMenu(Menu.buildFromTemplate([
  ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
  { role: 'editMenu' },
  { label: 'View', submenu: [{ role: 'togglefullscreen' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }] },
  { role: 'windowMenu' }
]));

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
