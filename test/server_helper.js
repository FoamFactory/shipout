import fs from 'fs';
import wrap from 'jest-wrap';
import _ from 'lodash';
import process from 'process';
import Client from 'ssh2';
import TestSshd from 'test-sshd';

wrap.register(withSSHServer);
wrap.register(withSFTPServer);

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

function setupSSHServer(options) {
  return new Promise((resolve, reject) => {
    if (isVerboseMode()) {
      console.log("Setting up SSH server running on localhost:4000");
    }

    if (!global.shipout) {
      global.shipout = {};
    }

    global.shipout.ssh_server = new TestSshd(options);
    expect(global.shipout.ssh_server).toBeDefined();

    let connectParams = global.shipout.ssh_server.connectParams();

    global.shipout.privateKey = connectParams.privateKey;

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
}

function tearDownSSHServer() {
  return new Promise((resolve, reject) => {
    global.shipout.ssh_server.on('exit', function() {
      if (isVerboseMode()) {
        console.log("SSH server terminated");
      }
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

export function withSSHServer() {
  return this.extend('with an SSH server running on localhost:4000', {
    beforeAll: function() {
      return setupSSHServer({port: 4000});
    },

    afterAll: function() {
      return tearDownSSHServer();
    }
  });
}

export function withSFTPServer() {
  return this.extend('with an SFTP server running on localhost:4000', {
    beforeAll: function() {
      return setupSSHServer({ port: 4000, mode: 'transfer'});
    },

    afterAll: function() {
      return tearDownSSHServer();
    }
  });
}
