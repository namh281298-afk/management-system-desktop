// Management System – vỏ ứng dụng máy tính (Windows / macOS) mở https://hethong.thejungleherbs.com
const { app, BrowserWindow, Menu, Tray, shell, nativeImage, session, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'app-config.json'), 'utf8'));
const APP_URL = cfg.url.replace(/\/+$/, '') + '/';
const ORIGIN = new URL(APP_URL).origin;
const TITLE = cfg.title || 'Management System';

app.setAppUserModelId('com.thejungleherbs.management');   // để thông báo Windows hiện đúng tên ứng dụng

if (!app.requestSingleInstanceLock()) { app.quit(); }

let win = null, tray = null, quitting = false;
// Khởi động cùng máy: mở ẩn (chạy nền), không bật cửa sổ làm phiền
const startHidden = process.argv.includes('--hidden') || (process.platform === 'darwin' && app.getLoginItemSettings().wasOpenedAtLogin);
const prefFile = path.join(app.getPath('userData'), 'prefs.json');
function loadPrefs() { try { return JSON.parse(fs.readFileSync(prefFile, 'utf8')); } catch (e) { return {}; } }
function savePrefs(p) { try { fs.writeFileSync(prefFile, JSON.stringify(p)); } catch (e) {} }
function applyAutoStart(on) {
  try { app.setLoginItemSettings({ openAtLogin: !!on, openAsHidden: true, args: ['--hidden'] }); } catch (e) {}
}
function autoStartOn() { const p = loadPrefs(); return p.autostart !== false; }   // mặc định BẬT
function setAutoStart(on) { const p = loadPrefs(); p.autostart = !!on; savePrefs(p); applyAutoStart(on); buildMenu(); if (tray) createTrayMenu(); }
const stateFile = path.join(app.getPath('userData'), 'window-state.json');

function loadState() { try { return JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch (e) { return {}; } }
function saveState() {
  if (!win || win.isDestroyed()) return;
  try {
    const b = win.getNormalBounds();
    fs.writeFileSync(stateFile, JSON.stringify({ ...b, max: win.isMaximized() }));
  } catch (e) {}
}

function iconImage() {
  const p = path.join(__dirname, 'build', 'icon.png');
  return fs.existsSync(p) ? nativeImage.createFromPath(p) : nativeImage.createEmpty();
}

function createWindow() {
  const st = loadState();
  win = new BrowserWindow({
    width: st.width || 1360, height: st.height || 880, x: st.x, y: st.y, minWidth: 420, minHeight: 600,
    title: TITLE, backgroundColor: '#f6f3ee', show: false, autoHideMenuBar: true,
    icon: iconImage(),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false, backgroundThrottling: false }   // không làm chậm khi chạy nền → vẫn nhận tin / thông báo
  });
  if (st.max) win.maximize();
  win.once('ready-to-show', () => { if (!startHidden) win.show(); });
  win.loadURL(APP_URL);

  // Liên kết ra ngoài hệ thống → mở bằng trình duyệt mặc định; cùng hệ thống → mở trong ứng dụng
  win.webContents.setWindowOpenHandler(({ url }) => {
    try { if (new URL(url).origin === ORIGIN) return { action: 'allow' }; } catch (e) {}
    shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (url.startsWith('app://retry')) { e.preventDefault(); win.loadURL(APP_URL); return; }
    try { const u = new URL(url); if (u.origin !== ORIGIN && u.protocol.startsWith('http')) { e.preventDefault(); shell.openExternal(url); } } catch (err) {}
  });
  // Mất mạng / lỗi tải → trang báo lỗi nhẹ, tự thử lại
  win.webContents.on('did-fail-load', (e, code, desc, url, isMain) => {
    if (isMain && code !== -3) win.loadFile(path.join(__dirname, 'offline.html'));
  });
  // Số tin chưa đọc hiện trên tiêu đề "(3) …" → hiện lên biểu tượng ứng dụng
  win.webContents.on('page-title-updated', (e, title) => {
    const m = /^\((\d+)\)/.exec(title); const n = m ? +m[1] : 0;
    try { app.setBadgeCount(n); } catch (err) {}
    if (tray) tray.setToolTip(n ? `${TITLE} – ${n} chưa đọc` : TITLE);
  });
  win.on('close', (e) => {
    saveState();
    if (!quitting && process.platform !== 'darwin') { e.preventDefault(); win.hide(); }   // Windows: thu xuống khay để vẫn nhận thông báo
  });
  win.on('resize', saveState); win.on('move', saveState);
}

function showWin() { if (!win) createWindow(); else { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } }

function buildMenu() {
  const mac = process.platform === 'darwin';
  const tpl = [
    ...(mac ? [{ role: 'appMenu' }] : []),
    { role: 'editMenu' },   // cần để Ctrl/Cmd + C, V, X hoạt động
    { label: 'Xem', submenu: [
      { label: 'Tải lại', accelerator: 'CmdOrCtrl+R', click: () => win && win.webContents.reload() },
      { label: 'Tải lại (xoá bộ nhớ đệm)', accelerator: 'CmdOrCtrl+Shift+R', click: () => win && win.webContents.reloadIgnoringCache() },
      { type: 'separator' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' }, { role: 'togglefullscreen' },
      { type: 'separator' }, { label: 'Tự khởi động cùng máy (chạy nền)', type: 'checkbox', checked: autoStartOn(), click: (i) => setAutoStart(i.checked) }
    ] },
    { role: 'windowMenu' }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(tpl));
}

function createTrayMenu() {
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Mở ' + TITLE, click: showWin },
    { label: 'Tải lại', click: () => win && win.webContents.reload() },
    { type: 'separator' },
    { label: 'Tự khởi động cùng máy (chạy nền)', type: 'checkbox', checked: autoStartOn(), click: (i) => setAutoStart(i.checked) },
    { type: 'separator' },
    { label: 'Thoát', click: () => { quitting = true; app.quit(); } }
  ]));
}
function createTray() {
  try {
    const img = iconImage().resize({ width: 18, height: 18 });
    tray = new Tray(img);
    tray.setToolTip(TITLE);
    createTrayMenu();
    tray.on('click', showWin);
  } catch (e) {}
}

app.whenReady().then(() => {
  // Chỉ cho phép hệ thống của mình dùng thông báo, bộ nhớ tạm, micro/camera nếu cần
  session.defaultSession.setPermissionRequestHandler((wc, permission, cb, details) => {
    let ok = false; try { ok = new URL(details.requestingUrl).origin === ORIGIN; } catch (e) {}
    cb(ok && ['notifications', 'clipboard-read', 'clipboard-sanitized-write', 'media', 'fullscreen'].includes(permission));
  });
  applyAutoStart(autoStartOn());   // lần đầu: tự đăng ký chạy cùng máy
  buildMenu(); createWindow(); createTray();
  app.on('activate', showWin);   // macOS: bấm biểu tượng Dock
});
app.on('second-instance', showWin);
app.on('before-quit', () => { quitting = true; saveState(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin' && quitting) app.quit(); });
