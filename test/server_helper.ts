import fs from 'fs';
import wrap from 'jest-wrap';
import _ from 'lodash';
import process from 'process';
import * as ssh2 from 'ssh2';
import * as TestSSHDng from 'test-sshdng';

export function isVerboseMode() {
  return _.indexOf(process.argv, "--verbose") !== -1;
}

type ShipoutData = {
  ssh_server?: any;
  privateKey?: string;
}

declare global {
  var shipout: ShipoutData;
}

// XXX_jwir3: Do not use localhost in place of 127.0.0.1! Sometimes, host
//            resolution resolves localhost to ::1 (IPv6) instead of 127.0.0.1,
//            which doesn't appear to work with test-sshd.
export function connectAndRunCommand(connectionParams, command) {
  return new Promise((resolve, reject) => {
    let response = '';
    let conn = new ssh2.Client();
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

// This version of the function is used to test the server manually.
export function runServer(options) {
  return new Promise<void>((resolve, reject) => {
    if (isVerboseMode()) {
      console.log("Setting up SSH server running on 127.0.0.1:4000");
    }

    if (!global.shipout) {
      global.shipout = {};
    }

    global.shipout.ssh_server = new TestSSHDng.TestSSHD(options);
    // expect(global.shipout.ssh_server).toBeDefined();

    let connectParams = global.shipout.ssh_server.connectParams();

    global.shipout.privateKey = connectParams.privateKey;

    global.shipout.ssh_server.on('ready', () => {
      // expect(global.shipout.ssh_server).toBeDefined();
      // expect(global.shipout.ssh_server.status).toBe('started');

      if (isVerboseMode()) {
        console.log("Resolving promise for setupSSHServer()");
      }

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
      if (isVerboseMode()) {
        console.error(`Encountered an error: ${error}`);
      }
      reject(error);
    });

    global.shipout.ssh_server.start();
  });
}

export function setupSSHServer(options) {
  return new Promise<void>((resolve, reject) => {
    if (isVerboseMode()) {
      console.log("Setting up SSH server running on 127.0.0.1:4000");
    }

    if (!global.shipout) {
      global.shipout = {};
    }

    global.shipout.ssh_server = new TestSSHDng.TestSSHD(options);
    expect(global.shipout.ssh_server).toBeDefined();

    let connectParams = global.shipout.ssh_server.connectParams();

    global.shipout.privateKey = connectParams.privateKey;

    global.shipout.ssh_server.on('ready', () => {
      expect(global.shipout.ssh_server).toBeDefined();
      expect(global.shipout.ssh_server.status).toBe('started');

      if (isVerboseMode()) {
        console.log("Resolving promise for setupSSHServer()");
      }
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
  return new Promise<void>((resolve, reject) => {
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

export function withSSHMimicServer(port: number = 4000) {
  return this.extend('with an SSH server running on 127.0.0.1:4000 that mimicks the input command', {
    beforeAll: function() {
      return setupSSHServer({port: port});
    },

    afterAll: function() {
      return tearDownSSHServer();
    }
  });
}

export function withSFTPServer() {
  return this.extend('with an SFTP server running on 127.0.0.1:4001', {
    beforeAll: function() {
      return setupSSHServer({ port: 4001, mode: 'transfer'});
    },

    afterAll: function() {
      return tearDownSSHServer();
    }
  });
}

export function withFullSSHServer() {
  return this.extend('with an SSH server running on 127.0.0.1:4002', {
    beforeAll: function() {
      return setupSSHServer({port: 4002, mode: 'exec'});
    },

    afterAll: function() {
      return tearDownSSHServer()
    }
  });
}