const { ipcRenderer } = require('electron');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json')).vpns;

const elemMain = document.getElementById("main");
const elemErrMsg = document.getElementById("error-message");

config.forEach(item => {
    elemMain.insertAdjacentHTML('beforeend', /*html*/`
        <div class="item">${item.name}</div>
    `);
});

const allItems = document.querySelectorAll(".item");

elemMain.addEventListener("click", event => {
    let elem = event.target;
    if(!elem.matches(".item")) return;

    allItems.forEach(node => node.classList.remove('active'));

    elem.classList.add('active');
});

setTimeout(onResize, 0);

window.onkeydown = e => {
    if(e.key == 'F12') ipcRenderer.send('open-devtools');
}

ipcRenderer.on('error', (e, msg) => {
    elemErrMsg.innerHTML = msg;
    if(!elemErrMsg.classList.contains('active')) elemErrMsg.classList.add('active');
    onResize();
});

function onResize(){
    ipcRenderer.send('resize', {width: elemMain.clientWidth, height: elemMain.clientHeight, errHeight: elemErrMsg.clientHeight});
}