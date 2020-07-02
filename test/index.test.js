import wrap from 'jest-wrap';
import process from 'process';
import { isVerboseMode,
         withSSHServer,
         connectAndRunCommand } from './server_helper';
import { createBaseDirectoryOnServer } from '../src';

wrap.register(withSSHServer);

describe ('shipout command line', () => {
  describe ('createBaseDirectoryOnServer', () => {
    it ('should pass', () => {
      expect(true).toBe(true);
    });

    // wrap().withSSHServer().describe('with a valid remote base directory, and'
    //                                 + ' remote instance directory', () => {
    //
    // });
  });
});
