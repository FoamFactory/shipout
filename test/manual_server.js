import fs from 'fs';
import _ from 'lodash';
import process from 'process';
import Client from 'ssh2';
import TestSshd from 'test-sshd';

global.shipout = {};
global.shipout.ssh_server = new TestSshd({port: 4000});

let connectParams = global.shipout.ssh_server.connectParams();

global.shipout.privateKey = connectParams.privateKey;

global.shipout.ssh_server.on('ready', () => {
  if (isVerboseMode()) {
    console.log("Resolving promise for setupSSHServer()");
  }
});

process.on('close', () => {
  global.shipout.ssh_server.stop();
});

global.shipout.ssh_server.start();

while (true) {
  // infinite loop to keep the process alive
}
