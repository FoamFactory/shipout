import wrap from 'jest-wrap';
import process from 'process';
import { isVerboseMode,
         withSSHServer,
         connectAndRunCommand } from './server_helper';
import { createBaseDirectoryOnServer } from '../src';

wrap.register(withSSHServer);

describe ('shipout command line', () => {
  describe ('createBaseDirectoryOnServer', () => {
    wrap().withSSHServer().describe('with a valid remote base directory, and'
                                    + ' remote instance directory', () => {
      it ('should return an mkdir command', () => {
        return new Promise((resolve, reject) => {
          let connectionParams = {
            host: 'localhost',
            port: '4000',
            username: process.env.USER,
            privateKey: global.shipout.privateKey
          };

          expect(connectionParams.privateKey).toBeDefined();

          let expectedCommand = 'mkdir -p "/tmp/blorf"';

          createBaseDirectoryOnServer(connectionParams, '/tmp', 'blorf')
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
  });
});
