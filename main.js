/* NEBULA OS — Electron main process. Boots a private local web server and
 * opens the renderer in a frameless, borderless window so the OS chrome
 * (taskbar + window controls) belongs entirely to the app itself. */
const { app, BrowserWindow, screen } = require("electron");
const path = require("path");
const { start } = require("./server");

let mainWindow = null;
let server = null;

function createWindow(port) {
  const { workArea } = screen.getPrimaryDisplay();

  mainWindow = new BrowserWindow({
    width: Math.min(1560, workArea.width),
    height: Math.min(940, workArea.height),
    minWidth: 1100,
    minHeight: 680,
    backgroundColor: "#04030b",
    frame: false,
    titleBarStyle: "hidden",
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "renderer", "assets", "icon.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL("http://127.0.0.1:" + port);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  // keep the app responsive to a mouse move before the renderer loads
  app.commandLine.appendSwitch("disable-features", "CalculateNativeWinOcclusion");

  try {
    server = await start({ host: "127.0.0.1", port: 0 });
    const port = server.address().port;
    createWindow(port);
  } catch (e) {
    console.error("Failed to start NEBULA server", e);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (server) {
    try {
      server.close();
    } catch (_) {}
    server = null;
  }
  app.quit();
});
