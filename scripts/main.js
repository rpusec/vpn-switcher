const { app, BrowserWindow, ipcMain, screen } = require('electron');
const { existsSync, writeFileSync, readFileSync } = require('original-fs');
const { getCurrentConnection, connect } = require('./vpn-handler.js');
const { run } = require('./script-handler.js');

if(!existsSync("config.json")) updateConfig({vpns: [], scripts: [], bounds: {x: 300, y: 300}});

let config = JSON.parse(readFileSync('config.json', 'utf8'));

let win = null;
let errHeight = 0;

let screenSize = {};

app.whenReady().then(() => {
    const primaryDisplay = screen.getPrimaryDisplay();
    screenSize = primaryDisplay.workAreaSize;

    let initialPosX = config.bounds.x;
    let initialPosY = config.bounds.y;

    win = new BrowserWindow({
        width: 150,
        height: 40,
        x: initialPosX,
        y: initialPosY,
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

    win.webContents.on('did-finish-load', () => {
        setTimeout(() => {
            let {posX, posY, wWidth, wHeight, update} = getWinBoundsInsideScreen(initialPosX, initialPosY);
            if(!update) return;

            win.setBounds({
                x: posX, 
                y: posY, 
                width: wWidth, 
                height: wHeight,
            });
        }, 100);
    });

    let t;
    win.on('move', () => {
        clearTimeout(t);
        t = setTimeout(() => {
            let {posX, posY, wWidth, wHeight, update} = getWinBoundsInsideScreen();
            let bounds = {x: posX, y: posY, width: wWidth, height: wHeight};
            if(update) win.setBounds(bounds);

            config.bounds = {x: bounds.x, y: bounds.y + errHeight};
            updateConfig(config);
        }, 1000);
    });

    // Monitor focus and visibility
    win.on('minimize', () => {
        setTimeout(() => {
            win.setAlwaysOnTop(true); // Reapply always on top
            win.restore();           // Restore the window if minimized
        }, 100);
    });

    win.on('blur', () => {
        // Reapply always on top after losing focus
        setTimeout(() => {
            win.setAlwaysOnTop(true);
        }, 100);
    });
});

function getWinBoundsInsideScreen(posX, posY){
    let winBounds = win.getBounds();
    let update = false;

    if(typeof posX === 'undefined') posX = winBounds.x;
    if(typeof posY === 'undefined') posY = winBounds.y;

    let width = screenSize.width;
    let height = screenSize.height;

    if(width < posX + winBounds.width){
        posX = width - winBounds.width;
        update = true;
    }

    if(height < posY + winBounds.height){
        posY = height - winBounds.height;
        update = true;
    }

    return {
        posX, 
        posY, 
        wWidth: winBounds.width, 
        wHeight: winBounds.height, 
        update,
    };
}

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

ipcMain.on('connect', async (e, name) => updateStateUI(await connect(name), false));

function updateConfig(content){
    writeFileSync('config.json', JSON.stringify(content, null, '\t'), 'utf8');
}

if(config.vpns.length > 0) setTimeout(() => sendKeepAlive(false), 0);

function updateStateUI(result, discrete){
    if(result.state == 'error'){
        win?.webContents.send('error', result.message);
        return;
    }

    if(result.state == 'vpn-connected'){
        win?.webContents.send('vpn-connected', result.name, discrete);
        return;
    }

    if(['no-vpn-connected', 'vpn-disconnected'].includes(result.state)){
        win?.webContents.send('no-vpn-connected', discrete);
        return;
    }
}

async function sendKeepAlive(discrete){
    updateStateUI(await getCurrentConnection(), discrete);

    setTimeout(() => sendKeepAlive(true), 5000);
}

ipcMain.on('run-script', async (e, name, scriptPath) => {

    let path = scriptPath.substring(0, scriptPath.lastIndexOf('\\') + 1);
    let scriptName = scriptPath.substring(scriptPath.lastIndexOf('\\') + 1, scriptPath.length);
    console.log(path);
    console.log(scriptName);

    const result = await run(`cd ${path} && node ${scriptName}`);

    if(result.state == 'error'){
        win?.webContents.send('script-error', result.message, name);
        return;
    }

    if(result.state == 'script-resolved'){
        win?.webContents.send('script-resolved', name);
        return;
    }
});