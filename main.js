const { app, BrowserWindow, ipcMain } = require('electron');
const { existsSync, writeFileSync, readFileSync } = require('original-fs');

if(!existsSync("config.json")) updateConfig({vpns: [], bounds: {x: 300, y: 300}});

let config = JSON.parse(readFileSync('config.json', 'utf8'));

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

    let t;
    win.on('move', e => {
        clearTimeout(t);
        t = setTimeout(() => {
            const bounds = win.getBounds();
            config.bounds = {x: bounds.x, y: bounds.y};
            updateConfig(config);
        }, 1000);
    });

    win.setPosition(config.bounds.x, config.bounds.y);
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

function updateConfig(content){
    writeFileSync('config.json', JSON.stringify(content, null, '\t'), 'utf8');
}