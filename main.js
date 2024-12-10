const { app, BrowserWindow, ipcMain } = require('electron');

let win = null;

app.whenReady().then(() => {
    win = new BrowserWindow({
        width: 150,
        height: 40,
        frame: false,
        alwaysOnTop: true,
        transparent: true,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    })
    
    win.loadFile('index.html');
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('resize', (e, props) => {
    if(!win) return;

    win.setSize(props.width, props.height);
})

ipcMain.on('open-devtools', () => {
    win?.webContents.openDevTools();
})