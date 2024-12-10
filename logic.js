const { ipcRenderer } = require('electron');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json')).vpns;

const elemReqMsg = document.getElementById('msg-outer');
const elemMain = document.getElementById("main");
const elemErrMsg = document.getElementById("error-message");

let requestingMsg = true;

config.forEach(item => {
    item.name = item.name.toLowerCase();
    elemMain.insertAdjacentHTML('beforeend', /*html*/`
        <div class="item ${item.name}" data-name="${item.name}">${item.name}</div>
    `);
});

const allItems = [...document.querySelectorAll(".item")];

elemMain.addEventListener("click", event => {
    let elem = event.target;
    if(!elem.matches(".item")) return;

    allItems.forEach(node => node.classList.remove('active'));
    // elem.classList.add('active');

    setReqMsg(true);
    ipcRenderer.send('connect', elem.dataset.name);
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
    elemErrMsg.querySelector('.msg').innerHTML = msg;
    if(!elemErrMsg.classList.contains('active')) elemErrMsg.classList.add('active');
    onResize();
    setReqMsg(false);
});

ipcRenderer.on('vpn-connected', (e, name) => {
    let vpnElem = allItems.find(x => x.classList.contains(name));
    if(!vpnElem) return;

    vpnElem.classList.add('active');
    setReqMsg(false);
});

ipcRenderer.on('no-vpn-connected', () => {
    setReqMsg(false);
});

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