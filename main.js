const { app, BrowserWindow, ipcMain } = require('electron');
const { existsSync, writeFileSync, readFileSync } = require('original-fs');

if(!existsSync("config.json")) updateConfig({vpns: [], bounds: {x: 300, y: 300}});

let config = JSON.parse(readFileSync('config.json', 'utf8'));

let win = null;
let errHeight = 0;

app.whenReady().then(() => {
    win = new BrowserWindow({
        width: 150,
        height: 40,
        x: config.bounds.x,
        y: config.bounds.y,
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
            config.bounds = {x: bounds.x, y: bounds.y + errHeight};
            updateConfig(config);
        }, 1000);
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('resize', (e, props) => {
    if(!win) return;

    errHeight = props.errHeight;

    win.setBounds({
        x: config.bounds.x,
        y: config.bounds.y - props.errHeight,
        width: props.width, 
        height: props.height + props.errHeight,
    });
})

ipcMain.on('open-devtools', () => {
    win?.webContents.openDevTools();
})

function updateConfig(content){
    writeFileSync('config.json', JSON.stringify(content, null, '\t'), 'utf8');
}

setTimeout(() => {
    win?.webContents.send('error', 'some error messagesome error messagesome error message');
}, 1000);