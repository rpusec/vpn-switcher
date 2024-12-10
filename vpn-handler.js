const { exec } = require('child_process');

module.exports = {
    getCurrencConnection() {
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
    },
};