import _ from 'lodash';
import process from 'process';
import { isVerboseMode,
         withSSHServer,
         connectAndRunCommand } from './server_helper';
import wrap from 'jest-wrap';

wrap.register(withSSHServer);

describe ('Server Helper', () => {
  wrap().withSSHServer().describe('after having set up the SSH server', () => {
    it ('should allow connections', () => {
      return new Promise((resolve, reject) => {
        let connectionParams = {
          host: 'localhost',
          port: '4000',
          username: process.env.USER,
          privateKey: global.shipout.privateKey
        };

        let command = 'uptime';
        connectAndRunCommand(connectionParams, command)
          .then((data) => {
            expect(data).toMatch(command);
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      });
    });
  });
});
