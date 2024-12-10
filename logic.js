const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json'));

const elemMain = document.getElementById("main");

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