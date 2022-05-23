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
  wrap().withFullSSHServer(4002).describe('when given a project that has a namespace', () => {
    beforeEach(() => {
      process.env.APP_ENVIRONMENT = 'staging';
    });

    afterEach(() => {
      if (fs.existsSync('/tmp/shipout')) {
        rimraf.sync('/tmp/shipout');
      }
    });

    it ('should deploy the project', () => {
      return CLIAsync([__dirname + '/fixtures/namespacedProject'],
               global.shipout.privateKey, true)
      .then(() => {
        // Package directory should be cleaned up
        expect(fs.existsSync(__dirname + '/fixtures/namespacedProject/package')).toBe(false);

        // The directory should exist on the "remote" server
        expect(fs.existsSync('/tmp/shipout/staging')).toBe(true);
      });
    });
  });
});
