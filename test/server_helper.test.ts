import _ from 'lodash';
import process from 'process';
import { isVerboseMode,
         withSSHMimicServer,
         connectAndRunCommand } from './server_helper';
import wrap from 'jest-wrap';

wrap.register(withSSHMimicServer);
const PORT : number = 4022;

describe ('Server Helper', () => {
  wrap().withSSHMimicServer(PORT).describe('after having set up the SSH server', () => {
    it ('should allow connections', () => {
      return new Promise<void>((resolve, reject) => {
        let connectionParams = {
          host: '127.0.0.1',
          port: PORT,
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
