import fs from 'fs';
import process from 'process';

import rimraf from 'rimraf';

import wrap from 'jest-wrap';
import { isVerboseMode,
         withFullSSHServer,
         connectAndRunCommand } from './server_helper';
import { CLIAsync } from '../src';

wrap.register(withFullSSHServer);

describe ('shipout command line', () => {
  wrap().withFullSSHServer().describe('when given a project that has a namespace', () => {
    afterEach(() => {
      if (fs.existsSync('/tmp/shipout')) {
        rimraf.sync('/tmp/shipout');
      }
    });

    it ('should deploy the project', () => {
      process.env['DEPLOY_USER'] = process.env['USER'];

      return new Promise((resolve, reject) => {
        CLIAsync([__dirname + '/fixtures/namespacedProject'],
                 global.shipout.privateKey)
          .then(() => {
            // Package directory should be cleaned up
            expect(fs.existsSync(__dirname + '/fixtures/namespacedProject/package')).toBe(false);

            // The directory should exist on the "remote" server
            expect(fs.existsSync('/tmp/shipout/test')).toBe(true);
            resolve();
          })
          .catch((error) => {
            expect(error).toBeUndefined();
            reject(error);
          });
      });
    });
  });
});
