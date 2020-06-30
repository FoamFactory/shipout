import { exec } from 'child_process';
import wrap from 'jest-wrap';
import process from 'process';
import { isVerboseMode,
         withSSHServer,
         connectAndRunCommand } from './server_helper';

import { createBaseDirectoryOnServer } from '../src';
import RemoteWorker from '~/src/RemoteWorker';

wrap.register(withSSHServer);

describe ('RemoteWorker', () => {
  describe ('#getSSHConfiguration()', () => {
    describe ('when the SSH_AUTH_SOCK environment variable is set', () => {
      beforeEach(() => {
        process.env.SSH_AUTH_SOCK = 'socket-path';
      });

      it ('should return an SSH configuration using the SSH_AUTH_SOCK', () => {
        let manager = new RemoteWorker('blah', 'somehost.somewhere.net');
        let config = manager.getSSHConfiguration();

        expect(config.agent).toBe('socket-path');
        expect(config.username).toBe('blah');
        expect(config.host).toBe('somehost.somewhere.net');
      });
    });

    describe('when the SSH_AUTH_SOCK environment variable is not set', () => {
      beforeEach(() => {
        delete process.env.SSH_AUTH_SOCK;
      });

      it ('should return an SSH configuration that does not use the SSH_AUTH_SOCK', () => {
        let manager = new RemoteWorker('blah', 'somehost.somewhere.net');
        let config = manager.getSSHConfiguration();

        expect(config.agent).toBe(false);
        expect(config.username).toBe('blah');
        expect(config.host).toBe('somehost.somewhere.net');
      });
    });
  });

  wrap().withSSHServer().describe('with a base directory of /tmp and an instance directory of blorf', () => {
    let baseDir = '/tmp';
    let instanceDir = 'blorf';

    describe ('createBaseDirectoryOnServer()', () => {
      let expectedCommand = `mkdir -p "${baseDir}/${instanceDir}"`;

      it ('should respond with a mkdir command', () => {
        return new Promise((resolve, reject) => {
          let remoteWorker
            = new RemoteWorker(process.env.USER, 'localhost',
                               '4000', baseDir, instanceDir,
                               global.shipout.privateKey);


          remoteWorker.createBaseDirectoryOnServer()
            .then((response) => {
              expect(response).toMatch(expectedCommand);
              resolve();
            })
            .catch((error) => {
              reject(error);
            });
        });
      });
    });

    describe ('createCurrentLink()', () => {
      let expectedCommand = `if [[ -h ${baseDir}/current ]]; then rm ${baseDir}/current; fi && ln -s ${baseDir}/${instanceDir} ${baseDir}/current`;

      it ('should respond with an ln command', () => {
        return new Promise((resolve, reject) => {
          let remoteWorker
            = new RemoteWorker(process.env.USER, 'localhost',
                               '4000', baseDir, instanceDir,
                               global.shipout.privateKey);

          expect(remoteWorker.getSSHConfiguration().privateKey)
            .toBeDefined();

          remoteWorker.createCurrentLink()
            .then((result) => {
              expect(result).toMatch(expectedCommand);
              resolve();
            })
            .catch((error) => {
              reject(error);
            });
        });
      });
    });
  });

  describe ('without an SSH server running', () => {
    let baseDir = '/tmp';
    let instanceDir = 'blorf';

    describe ('createBaseDirectoryOnServer()', () => {
      it ('should throw an error', () => {
        return new Promise((resolve, reject) => {
          let remoteWorker
            = new RemoteWorker(process.env.USER, 'localhost',
                               '4000', baseDir, instanceDir);


          remoteWorker.createBaseDirectoryOnServer()
            .then((response) => {
              reject();
            })
            .catch((error) => {
              expect(error.code).toMatch('ECONNREFUSED');
              resolve();
            });
        });
      });
    });

    describe ('createCurrentLink()', () => {
      it ('should throw an error', () => {
        return new Promise((resolve, reject) => {
          let remoteWorker = new RemoteWorker(process.env.USER, 'localhost',
                                              '4000', baseDir, instanceDir);
          remoteWorker.createCurrentLink()
            .then((result) => {
              reject();
            })
            .catch((error) => {
              expect(error.code).toMatch('ECONNREFUSED');
              resolve();
            });
        });
      });
    });
  });
});
