// Dragon Amulet for Mac and Windows: the same one-file game in its own window.
// F11 (or Ctrl+Cmd+F on a Mac) switches full screen; saves stay on this computer.
// Each time it starts it fetches the newest game from the play site (waiting at most a few seconds) and keeps it,
// so the app is always up to date without downloading it again; offline it plays the last copy it has.
const { app, BrowserWindow, shell, Menu, net } = require('electron');
const path = require('path');
const fs = require('fs');
const PLAY_URL = 'https://pumped60.github.io/dragon-amulet-play/index.html';

const versionOf = html => { const m = /GAME_VERSION\s*=\s*['"]([^'"]+)['"]/.exec(html || ''); return m ? m[1].replace(/[^0-9.]/g, '').split('.').map(n => parseInt(n, 10) || 0) : [0]; };
const newer = (a, b) => { for (let i = 0; i < Math.max(a.length, b.length); i++) { const d = (a[i] || 0) - (b[i] || 0); if (d) return d > 0; } return false; };
const readOr = f => { try { return fs.readFileSync(f, 'utf8'); } catch (e) { return ''; } };

async function newestGame() {
  const bundled = path.join(__dirname, 'app', 'index.html'), dir = path.join(app.getPath('userData'), 'game'), saved = path.join(dir, 'index.html');
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 5000);
    const r = await net.fetch(PLAY_URL + '?t=' + Date.now(), { signal: ctl.signal, cache: 'no-store' }); clearTimeout(t);
    if (r.ok) { const html = await r.text(); if (html.length > 100000 && html.includes('Dragon Amulet') && newer(versionOf(html), versionOf(readOr(saved))) ) { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(saved + '.tmp', html); fs.renameSync(saved + '.tmp', saved); } }
  } catch (e) { /* offline: play the copy we have */ }
  return fs.existsSync(saved) && !newer(versionOf(readOr(bundled)), versionOf(readOr(saved))) ? saved : bundled;
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 800, minWidth: 800, minHeight: 500,
    title: 'Dragon Amulet', backgroundColor: '#16121f', autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { contextIsolation: true, sandbox: true }
  });
  win.loadFile(await newestGame());
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
