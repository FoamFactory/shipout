import { exec } from 'child_process';
import fs from 'fs';
import wrap from 'jest-wrap';
import mkdirp from 'mkdirp';
import path from 'path';
import process from 'process';
import rimraf from 'rimraf';
import { isVerboseMode,
         withSSHMimicServer,
         withSFTPServer,
         connectAndRunCommand } from './server_helper';

import { createBaseDirectoryOnServer } from '../src';
import { ConfigStore } from '~/src/ConfigStore';
import { FilePacker } from '~/src/FilePacker';
import RemoteWorker from '~/src/RemoteWorker';

function setupFilePacker() {
  let filePacker = new FilePacker(configStore);
  expect(filePacker).toBeDefined();

  let packagePath = filePacker.getPackedFilePath();
  expect(packagePath).toMatch(path.join(process.cwd(), 'test',
                              'fixtures', 'projectWithSomeFiles', 'package'));

  let packageName = filePacker.getPackedFileName();
  expect(packageName).toMatch('projectwithsomefiles-v1.0.0.tgz');

  return filePacker;
}

let configStore, filePacker;

describe ('RemoteWorker', () => {
  beforeEach(() => {
    configStore = new ConfigStore(path.join(process.cwd(), 'test',
                                  'fixtures', 'projectWithSomeFiles'));
    expect(configStore).toBeDefined();

    filePacker = setupFilePacker();
  });

  describe ('#getSSHConfiguration()', () => {
    describe ('when using the staging environment', () => {
      beforeEach(() => {
        process.env.APP_ENVIRONMENT = 'staging';
      });

      describe ('when the SSH_AUTH_SOCK environment variable is set', () => {
        beforeEach(() => {
          process.env.SSH_AUTH_SOCK = 'socket-path';
        });

        it ('should return an SSH configuration using the SSH_AUTH_SOCK', () => {
          let manager = RemoteWorker.create(configStore);
          let config = manager.getSSHConfiguration();

          expect(config.agent).toBe('socket-path');
          expect(config.username).toBe('someuser');
          expect(config.host).toBe('server.somewhere.net');
        });
      });

      describe('when the SSH_AUTH_SOCK environment variable is not set', () => {
        beforeEach(() => {
          delete process.env.SSH_AUTH_SOCK;
        });

        it ('should return an SSH configuration that does not use the SSH_AUTH_SOCK', () => {
          let manager = RemoteWorker.create(configStore);
          let config = manager.getSSHConfiguration();

          expect(config.agent).toBe(false);
          expect(config.username).toBe('someuser');
          expect(config.host).toBe('server.somewhere.net');
        });
      });
    });
  });

  wrap().withSFTPServer().describe('with a base directory of /tmp and an instance directory of blorf', () => {
    let baseDir = '/tmp';
    let instanceDir = 'blorf';

    describe ('copyPackageToServer()', () => {
      beforeEach(() => {
        // Create the base directory, which is assumed to exist on the remote
        // host
        return mkdirp(path.join(baseDir, instanceDir));
      });

      afterEach(() => {
        return new Promise((resolve, reject) => {
          let resultPath = path.join(baseDir, instanceDir);
          rimraf(resultPath, (error) => {
            if (error) {
              reject(error);
            }

            expect(fs.existsSync(resultPath)).toBe(false);
            resolve();
          });
        });
      });

      let expectedCommand = '';

      it ('should copy the package archive to /tmp/blorf', () => {
        let filePacker = setupFilePacker();

        return new Promise((resolve, reject) => {
          let remoteWorker = new RemoteWorker(process.env.USER, '127.0.0.1',
                                              '4001', baseDir, instanceDir,
                                              global.shipout.privateKey);
          expect(remoteWorker.getSSHConfiguration().privateKey).toBeDefined();

          filePacker.packageFiles()
            .then((packedFileInfo) => {
              let packagePath = packedFileInfo.path;
              let packageName = packedFileInfo.fileName;

              let finalPackagePath = path.join(packagePath, packageName);
              expect(fs.existsSync(finalPackagePath)).toBe(true);

              remoteWorker.copyPackageToServer(packagePath, packageName)
                .then((result) => {
                  expect(fs.existsSync(path.join(baseDir, instanceDir, packageName))).toBe(true);
                  filePacker.cleanUp()
                    .then(() => {
                      resolve();
                    });
                })
                .catch((error) => {
                  reject(error);
                });
            })
            .catch((error) => {
              reject(error);
            });
        });
      });
    });
  });

  wrap().withSSHMimicServer()
  .describe('with a base directory of /tmp and an instance directory of blorf', () => {
    let baseDir = '/tmp';
    let instanceDir = 'blorf';

    describe ('createBaseDirectoryOnServer()', () => {
      let expectedCommand = `mkdir -p "${baseDir}/${instanceDir}"`;

      it ('should respond with a mkdir command', () => {
        return new Promise((resolve, reject) => {
          let remoteWorker
            = new RemoteWorker(process.env.USER, '127.0.0.1',
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
            = new RemoteWorker(process.env.USER, '127.0.0.1',
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

    describe('unpackRemotely()', () => {
      it ('shouild respond with a tar command', () => {
        return new Promise((resolve, reject) => {
          let filePacker = setupFilePacker();
          let expectedCommand = `cd ${baseDir}/${instanceDir} && tar xzvf ${filePacker.getPackedFileName()}`;

          let remoteWorker
            = new RemoteWorker(process.env.USER, '127.0.0.1',
                               '4000', baseDir, instanceDir,
                               global.shipout.privateKey);

          expect(remoteWorker.getSSHConfiguration().privateKey)
            .toBeDefined();

          remoteWorker.unpackRemotely(filePacker.getPackedFileName())
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
            = new RemoteWorker(process.env.USER, '127.0.0.1',
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
          let remoteWorker = new RemoteWorker(process.env.USER, '127.0.0.1',
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
