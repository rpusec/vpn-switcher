const { spawn } = require('child_process');

module.exports = {
    run(command){
        return new Promise(resolve => {
            let child = spawn(command, { stdio: 'inherit', shell: true });
    
            child.on('close', code => {
                if (code !== 0) {
                    return resolve({state: 'error', message: `Command failed with code ${code}`});
                }
    
                resolve({state: 'script-resolved'});
            });
        });
    }
};