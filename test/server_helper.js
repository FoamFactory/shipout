import fs from 'fs';
import _ from 'lodash';
import process from 'process';
import Client from 'ssh2';
import TestSshd from 'test-sshd';

export function isVerboseMode() {
  return _.indexOf(process.argv, "--verbose") !== -1;
}

export function connectAndRunCommand(connectionParams, command) {
  return new Promise((resolve, reject) => {
    let response = '';
    let conn = new Client();
    conn.on('error', (error) => {
      reject(error);
    });

    conn.on('close', () => {
      if (isVerboseMode()) {
        console.log("Closing connection");
      }
      resolve(response);
    });

    conn.on('ready', () => {
      if (isVerboseMode()) {
        console.log(`Connection is ready. Running command: ${command}`);
      }
      conn.exec(command, {}, (err, stream) => {
        if (err) {
          reject(err);
        }

        stream.on('data', function(data, extended) {
          response = data.toString('utf-8');

          if (isVerboseMode()) {
            console.log(`Data received: ${response}`);
          }
          
          conn.end();
        });
      });
    }).connect(connectionParams);
  });
}

export function withSSHServer(port) {
  return this.extend('with an SSH server running on localhost:4000', {
    beforeAll: function() {
      return new Promise((resolve, reject) => {
        if (isVerboseMode()) {
          console.log("Setting up SSH server running on localhost:4000");
        }

        if (!global.shipout) {
          global.shipout = {};
        }

        global.shipout.ssh_server = new TestSshd({port: 4000});
        expect(global.shipout.ssh_server).toBeDefined();

        let connectParams = global.shipout.ssh_server.connectParams();

        global.shipout.privateKey = connectParams.privateKey;
        // const data = new Uint8Array(Buffer.from(global.shipout.ssh_server.connectParams().privateKey));
        // fs.writeFileSync('/tmp/private_key', data, { mode: 0o600 });
        //
        // expect(fs.existsSync('/tmp/private_key')).toBeTruthy();

        global.shipout.ssh_server.on('ready', () => {
          expect(global.shipout.ssh_server).toBeDefined();
          expect(global.shipout.ssh_server.status).toBe('started');

          resolve();
        });

        global.shipout.ssh_server.on('stdout', (message) => {
          if (isVerboseMode()) {
            console.log(`stdout: ${message}`);
          }
        });

        global.shipout.ssh_server.on('stderr', (error) => {
          if (isVerboseMode()) {
            console.log(`stderr: ${error}`);
          }
        });

        global.shipout.ssh_server.on('error', (error) => {
          reject(error);
        });

        global.shipout.ssh_server.start();
      });
    },

    afterAll: function() {
      return new Promise((resolve, reject) => {
        global.shipout.ssh_server.on('exit', function() {
          if (isVerboseMode()) {
            console.log("SSH server terminated");
          }
          // fs.unlinkSync('/tmp/private_key');
          resolve();
        });

        if (global.shipout.ssh_server.status === 'started') {
          if (isVerboseMode()) {
            console.log("Executing stop command to SSH server");
          }
          global.shipout.ssh_server.stop();
        } else {
          resolve();
        }
      });
    }
  });
}
