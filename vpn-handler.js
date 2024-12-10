const { exec } = require('child_process');

module.exports = {
    async connect(name){
        let connRes = await getCurrentConnection();
        if(connRes.state == 'error') return connRes;
        if(!connRes.name) return await connect(name);
        
        let discRes = await disconnect(connRes.name);
        if(discRes.state == 'error') return discRes;

        return await connect(name);
    },
    getCurrentConnection,
};

function getCurrentConnection() {
    return new Promise(resolve => {
        exec(`powershell -Command "Get-VpnConnection | Where-Object { $_.ConnectionStatus -eq 'Connected' }"`, (error, stdout, stderr) => {
            if (error) {
                resolve({state: 'error', message: error.message});
                return;
            }

            if (stderr) {
                resolve({state: 'error', message: stderr});
                return;
            }
        
            if (stdout.trim()) {
                stdout += '';
                let ind = stdout.indexOf(':') + 1;
                let name = stdout.substring(ind, stdout.indexOf('\n', ind)).trim().toLowerCase();
                resolve({state: 'vpn-connected', name});
                return;
            } 

            resolve({state: 'no-vpn-connected'});
        });
    });
};

function disconnect(name){
    return new Promise(resolve => {
        exec(`rasdial ${name} /disconnect`, (error, stdout, stderr) => {
            if (error) {
                resolve({state: 'error', message: error.message});
                return;
            }

            if (stderr) {
                resolve({state: 'error', message: stderr});
                return;
            }

            resolve({state: 'vpn-disconnected'});
        });
    });
}

function connect(name){
    return new Promise(resolve => {
        exec(`rasphone -d "${name}"`, async () => {
            console.log('abc123');
            let res = await getCurrentConnection();
            console.log(res);
            resolve(res);
        });
    });
}