const { ipcRenderer } = require('electron');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('config.json'));
const vpns = config.vpns;
const scripts = config.scripts;

const elemReqMsg = document.getElementById('msg-outer');
const elemMain = document.getElementById("main");
const elemVpns = document.getElementById("vpns");
const elemScripts = document.getElementById("scripts");
const elemErrMsg = document.getElementById("error-message");

let requestingMsg = true;

if(vpns.length > 0){
    vpns.forEach(name => {
        name = name.toLowerCase();
        elemVpns.insertAdjacentHTML('beforeend', /*html*/`
            <div class="item vpn" data-name="${name}">${name}</div>
        `);
    });
}
else {
    elemVpns.insertAdjacentHTML('beforeend', /*html*/`<div class="no-vpns-msg">No VPNs Configured</div>`);
    setReqMsg(false);
}

if(scripts.length > 0){
    scripts.forEach(item => {
        elemScripts.insertAdjacentHTML('beforeend', /*html*/`
            <div 
                class="item script" 
                data-name="${item.name}" 
                data-enabled-when-active-vpn="${item.enabledWhenActiveVPN}"
                data-path="${item.path}"
            >${item.name}</div>
        `);
    });
}

const allVpnItems = [...document.querySelectorAll(".item.vpn")];
const allScriptItems = [...document.querySelectorAll(".item.script")];

disableAllScriptBtnsWithVPN();

elemVpns.addEventListener("click", event => {
    let elem = event.target;
    if(!elem.matches(".item.vpn")) return;

    removeActiveClassFromBtns();

    setReqMsg(true);
    ipcRenderer.send('connect', elem.dataset.name);
});

elemScripts.addEventListener("click", event => {
    let elem = event.target;
    if(!elem.matches(".item.script")) return;

    if(!elem.classList.contains("running")) elem.classList.add("running");

    ipcRenderer.send('run-script', elem.dataset.name, elem.dataset.path);
});

setTimeout(onResize, 0);

window.onkeydown = e => {
    if(e.key == 'F12') ipcRenderer.send('open-devtools');
}

elemErrMsg.querySelector('.close').addEventListener('click', () => {
    elemErrMsg.classList.remove('active');
    onResize();
});

ipcRenderer.on('error', (e, msg) => {
    setErrorMsg(msg);
    setReqMsg(false);
});

ipcRenderer.on('vpn-connected', (e, name, discrete) => {
    if(discrete && requestingMsg) return;

    removeActiveClassFromBtns();

    let vpnElem = allVpnItems.find(x => x.dataset['name'] == name);
    if(!vpnElem) return;

    vpnElem.classList.add('active');
    setReqMsg(false);

    allScriptItems.forEach(scriptElem => {
        let enabledIfVpn = scriptElem.dataset.enabledWhenActiveVpn;
        if(!enabledIfVpn) {
            scriptElem.classList.remove('disabled');
            return;
        }

        if(name == enabledIfVpn) scriptElem.classList.remove('disabled');
        else if(!scriptElem.classList.contains('disabled')) scriptElem.classList.add('disabled');
    });
});

ipcRenderer.on('no-vpn-connected', (e, discrete) => {
    if(discrete && requestingMsg) return;
    removeActiveClassFromBtns();
    disableAllScriptBtnsWithVPN();
    setReqMsg(false);
});

function removeActiveClassFromBtns(){
    allVpnItems.forEach(node => node.classList.remove('active'));
}

function onResize(){
    ipcRenderer.send('resize', {
        width: elemMain.clientWidth, 
        height: elemMain.clientHeight, 
        errHeight: elemErrMsg.clientHeight,
    });
}

function setReqMsg(b){
    requestingMsg = b;
    
    if(requestingMsg){
        elemReqMsg.classList.remove('hidden');
        if(!elemMain.classList.contains('disabled')) elemMain.classList.add('disabled');
        return;
    }

    if(elemReqMsg.classList.contains('hidden')) return;
        
    elemReqMsg.classList.add('hidden');
    elemMain.classList.remove('disabled');
}

ipcRenderer.on('script-resolved', (e, name) => scriptBtnEndRun(name));

ipcRenderer.on('script-error', (e, msg, name) => {
    setErrorMsg(msg);
    scriptBtnEndRun(name);
});

function setErrorMsg(msg){
    elemErrMsg.querySelector('.msg').innerHTML = msg;
    if(!elemErrMsg.classList.contains('active')) elemErrMsg.classList.add('active');
    onResize();
}

function scriptBtnEndRun(name){
    let scriptBtn = allScriptItems.find(x => x.dataset.name == name);
    if(!scriptBtn) return;

    scriptBtn.classList.remove('running');
}

function disableAllScriptBtnsWithVPN(){
    allScriptItems.forEach(scriptElem => scriptElem.dataset.enabledWhenActiveVpn && scriptElem.classList.add('disabled'));
}