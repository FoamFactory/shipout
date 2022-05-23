import { exec } from 'child_process';
import fs from 'fs';
import wrap from 'jest-wrap';
import mkdirp from 'mkdirp';
import path from 'path';
import process from 'process';
import rimraf from 'rimraf';
import { isVerboseMode,
         withFullSSHServer,
         withSSHMimicServer,
         withSFTPServer,
         connectAndRunCommand } from './server_helper';

import { ConfigStore } from '../src/ConfigStore';
import { FilePacker } from '../src/FilePacker';
import RemoteWorker from '../src/RemoteWorker';
import { CheckNpmStage } from '../src/WorkStage';

import { logger } from './test_helper';

wrap.register(withFullSSHServer);
wrap.register(withSSHMimicServer);
wrap.register(withSFTPServer);

let configStore;

describe('CheckNpmStage', () => {
  beforeEach(() => {
    configStore = new ConfigStore(path.join(process.cwd(), 'test',
                                  'fixtures', 'projectWithSomeFiles'), logger);
    expect(configStore).toBeDefined();
  });

  describe('with a baseDir of /tmp and an instance directory of blorf', () => {
    let baseDir = '/tmp';
    let instanceDir = 'blorf';

    wrap()
    .withFullSSHServer('4617')
    .describe('with a fully initialized RemoteWorker object', () => {
      describe('when expecting a version of npm greater than or equal to 7.1.4', () => {
        let minVersion = "7.1.4";

        it ('should throw an exception', () => {
          let remoteWorker = new RemoteWorker(process.env.USER, '127.0.0.1',
                                              '4617', baseDir, instanceDir,
                                              global.shipout.privateKey, logger);

          let options = {
            'parentWorker': remoteWorker,
            'configStore': configStore,
            'logger': logger,
            'minVersion': minVersion
          };

          remoteWorker.setStages([
            new CheckNpmStage(options)
          ]);

          return remoteWorker.run()
            .then(() => {
              fail('this should not be reached');
            })
            .catch((error) => {
              expect(error).toBe(`npm version 6.14.14 is less than specified minimum version of ${minVersion}.`);
            });
        });
      });

      describe('when expecting a version of npm greater than or equal to 6.0.0', () => {
        let minVersion = "6.0.0";

        it ('should be successful', () => {
          let remoteWorker = new RemoteWorker(process.env.USER, '127.0.0.1',
                                              '4617', baseDir, instanceDir,
                                              global.shipout.privateKey, logger);

          let options = {
            'parentWorker': remoteWorker,
            'configStore': configStore,
            'logger': logger,
            'minVersion': minVersion
          };

          remoteWorker.setStages([
            new CheckNpmStage(options)
          ]);

          return remoteWorker.run()
            .then((version) => {
              expect(version).toBe("6.14.14");
            })
            .catch((error) => {
              fail(error);
            });
        });
      });
    });
  });
});
