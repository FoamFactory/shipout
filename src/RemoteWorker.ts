import fs, { access, constants } from 'fs';
import path from 'path';
import process from 'process';
import NodeSSH from 'node-ssh';
import { Client } from 'node-scp';
import { RemoteWorkStage, PackageRemoteWorkStage } from 'RemoteWorkStage';
import { Logger } from 'pretty-logger';
import { ConfigStore } from './ConfigStore';

/**
 *  An object that allows the quick and easy execution of commands as a given
 *  user on a specific host using SSH.
 */
export default class RemoteWorker {

  static create(configStore : ConfigStore, privateKey: string | void) {
    return new RemoteWorker(configStore.getUsername(), configStore.getHost(),
                            configStore.getPort(),
                            configStore.getRemoteBaseDirectory(),
                            configStore.getRemoteInstanceDirectory(),
                            privateKey, configStore.getLogger());
  }

  user: string;
  host: string;
  port: number;
  remoteBaseDir: string;
  remoteInstanceDir: string;
  privateKey: string;
  stages: Array<RemoteWorkStage>;
  logger: Logger;

  /**
   *  Create a new instance of RemoteWorker.
   *
   *  @param {String} user The username to use to authenticate.
   *  @param {String} host The host to authenticate to.
   *  @param {String} port The port on the remote host where sshd is running
   *         (typically '22');
   *  @param {String} remoteBaseDir The base directory where the release is
   *         located on the remote host, as an absolute path.
   *  @param {String} remoteInstanceDir The specific directory (typically the
   *         date and time of the deployment) where the release is located on
   *         the remote host, as an absolute path.
   *  @param {String} privateKey The private key, in ASCII form, to use to login
   *         to the SSH server with. If not given, it is expected that the
   *         SSH_AUTH_SOCK will be used to send the key via the SSH agent or
   *         that the default ssh private key will be used (typically
   *         ~/.ssh/id_rsa).
   *  @param {Logger} logger The logger to use to print to standard output.
   *         Defaults to `null`.
   */
  constructor(user, host, port, baseDir, instanceDir, privateKey, logger) {
    this.user = user;
    this.host = host;
    this.port = port;
    this.remoteBaseDir = baseDir;
    this.remoteInstanceDir = instanceDir;
    this.privateKey = privateKey;
    this.stages = [];
    this.logger = logger;
  }

  setStages(stages) {
    let self = this;
    this.stages = stages;

    let previousStage = null;
    for (let nextStageIdx in self.stages) {
      let currentStage = self.stages[nextStageIdx];
      if (previousStage) {
        previousStage.setNextStage(currentStage);
      }

      previousStage = currentStage;
    }
  }

  run() {
    let self = this;

    return new Promise<void>((resolve, reject) => {
      if (self.stages.length > 0) {
        return self.stages[0].run(null)
          .then((data) => {
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      } else {
        resolve();
      }
    });
  }

  /**
   *  Create a symbolic link to the current released version of the application
   *  on the remote host.
   *
   *  @return {Promise} A {@link Promise} that will resolve when the current
   *          link has been created on the remote host.
   */
  createCurrentLink() {
    let self = this;

    return new Promise((resolve, reject) => {
      let remoteBaseDir = self.remoteBaseDir;
      let remoteInstanceDir = self.remoteInstanceDir;
      let ssh = new NodeSSH();
      let sshConfig = self.getSSHConfiguration();
      let result = '';

      ssh.connect(sshConfig)
        .then(() => {
          let command = `if [[ -h ${remoteBaseDir}/current ]]; then rm ${remoteBaseDir}/current; fi && ln -s ${remoteBaseDir}/${remoteInstanceDir} ${remoteBaseDir}/current`;
          return ssh.execCommand(command);
        })
        .then((data) => {
          if (data) {
            result = data.stdout;
          }
          return ssh.dispose();
        })
        .then(() => {
          resolve(result);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  cleanUpRemoteDirectories(numDirectoriesToKeep) {
    let self = this;

    // return new Promise<any>((resolve, reject) => {
      let remoteBaseDir = self.remoteBaseDir;
      let ssh = new NodeSSH();
      let sshConfig = self.getSSHConfiguration();
      return ssh.connect(sshConfig)
        .then(() => {
          let command = `ls -l ${remoteBaseDir} | awk '{ print $9 }'`;
          return ssh.execCommand(command);
        })
        .then((data: any) => {
          return new Promise<any>((resolve, reject) => {
            let result = data.stdout.split('\n');
            let directoriesToDispose = [];
            let hasCurrentLink = result.includes('current');

            if (hasCurrentLink) {
              result = result.slice(0, result.length - 1);
            }

            let directoriesToKeep = [];
            if (numDirectoriesToKeep > result.length) {
              directoriesToKeep.concat(result);
            } else {
              for (let i = 0; i < numDirectoriesToKeep; i++) {
                let idx = result.length - 1 - i;
                directoriesToKeep.push(result[idx]);
              }

              for (let i = 0; i < result.length - numDirectoriesToKeep; i++) {
                directoriesToDispose.push(result[i]);
              }
            }

            if (!hasCurrentLink) {
              resolve({
                directoriesToKeep: directoriesToKeep,
                hasCurrentLink: false,
                directoriesToDispose: directoriesToDispose
              });
            } else {
              let command = `readlink -f ${remoteBaseDir}/current`;
              ssh.execCommand(command)
                .then((commandResult) => {
                  let commandResultSplit = commandResult.stdout.split('/');
                  let subDir = commandResultSplit[commandResultSplit.length - 1];
                  if (!directoriesToKeep.includes(subDir)) {
                    directoriesToKeep.push(subDir);
                  }

                  if (directoriesToDispose.includes(subDir)) {
                    let idx = directoriesToDispose.indexOf(subDir);
                    if (idx > -1) {
                      directoriesToDispose.splice(idx, 1);
                    }
                  }

                  resolve({
                    directoriesToKeep: directoriesToKeep,
                    directoriesToDispose: directoriesToDispose,
                    hasCurrentLink: true
                  });
                });
            }
          });
        })
        .then((data: any) => {
          if (numDirectoriesToKeep >= 0) {
            let command = `rm -rf`;
            for (let i = 0; i < data.directoriesToDispose.length; i++) {
              command = command.concat(` ${remoteBaseDir}/${data.directoriesToDispose[i]}`);
            }

            return ssh.execCommand(command);
          }
        })
        .then((data) => {
          this.logger.debug('Finished with remote cleanup. Disposing of ssh connection.');
          return ssh.dispose();
        })
        .catch((error) => {
          this.logger.error(error);
        });
  }

  /**
   *  Create the necessary base directory for deployment on the remote host.
   *
   *  @return {Promise} A Promise that will resolve with any output written to
   *          standard out on the remote host while the base directory is being
   *          created on success, or an error, on failure.
   */
  createBaseDirectoryOnServer() {
    let self = this;

    let sshConfig = self.getSSHConfiguration();
    let remoteBaseDir = self.remoteBaseDir;
    let remoteInstanceDir = self.remoteInstanceDir;
    let deployUser = sshConfig.username;
    let deployServer = sshConfig.host;
    let port = sshConfig.port;

    return new Promise((resolve, reject) => {
      let response = '';
      let ssh = new NodeSSH();
      this.logger.debug(`Executing mkdir -p "${remoteBaseDir}/${remoteInstanceDir}"`)
      ssh.connect(sshConfig)
        .then(() => {
          return ssh.execCommand(`mkdir -p "${remoteBaseDir}/${remoteInstanceDir}"`);
        })
        .then((data) => {
          this.logger.debug("Output from mkdir -p command: ", data);

          if (data.stderr && data.stderr !== '') {
            reject(data.stderr);
          }
          if (data) {
            response = data.stdout;
          }

          return ssh.dispose();
        })
        .then(() => {
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  /**
   *  Copy a package to the remote host.
   *
   *  @param  {String} packagePath The absolute path of the directory in which
   *          the package to copy is located on the local machine, as a
   *          {@link String}.
   *  @param  {String} packageName The file name of the package to copy.
   *
   *  @return {Promise} A Promise that will resolve with any output written to
   *          standard out on the remote host while the base directory is being
   *          created on success, or an error, on failure.
   */
  copyPackageToServer(packagePath, packageName) {
    let self = this;
    let sshConfig = this.getSSHConfiguration();

    return new Promise<void>((resolve, reject) => {
      let result = '';

      // Rather than doing this through SSH, if the deploy host is localhost,
      // then we perform the copy directly. This enables us to perform testing
      // using a single SSH server test instance, rather than trying to spin up
      // multiple test instances, one with SFTP and one with SSH.
      let localPath = path.resolve(packagePath, packageName);
      let remotePath = `${self.remoteBaseDir}/${self.remoteInstanceDir}/${packageName}`;

      if (sshConfig.host == '127.0.0.1' || sshConfig.host == 'localhost') {
        fs.copyFile(localPath, remotePath, (error) => {
          if (error) {
            reject(error);
          }
          resolve();
        });
      } else {
        return Client(this.getSSHConfiguration()).then(client => {
          this.logger.debug(`Connected to SSH server. Attempting file transfer from ${localPath} to ${sshConfig.host}:${remotePath}`);
          this.logger.debug(`Local path exists? `, fs.existsSync(localPath));

          return client.uploadFile(localPath, remotePath)
            .then((response) => {
              client.close();
              resolve();
            })
            .catch((error) => {
              this.logger.error("Unable to copy file to ssh server due to: ", error);
              reject(error);
            })
        }).catch((e) => {
          this.logger.error(`Unable to connect to ssh host "${sshConfig.host}: `, e);
          reject(e);
        });
      }
    });
  }

  /**
   *  Unpack a package on the remote host.
   *
   *  @param  {String} packageName The file name of the package to unpack.
   *
   *  @return {Promise} A Promise that will resolve with any output written to
   *          standard out on the remote host while the base directory is being
   *          created on success, or an error, on failure.
   */
  unpackRemotely(packageName) {
    let self = this;

    return new Promise((resolve, reject) => {
      let result = '';
      let ssh = new NodeSSH();
      let sshConfig = self.getSSHConfiguration();

      ssh.connect(sshConfig)
        .then(() => {
          let command = `cd ${self.remoteBaseDir}/${self.remoteInstanceDir} && tar xzvf ${packageName}`;
          return ssh.execCommand(command);
        })
        .then((data) => {
          if (data) {
            result = data.stdout;
          }
          return ssh.dispose();
        })
        .then(() => {
          resolve(result);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  /**
   *  Retrieve the SSH configuration for running commands remotely
   *
   *  @return {Object} An object, in JSON form, that will contain the remote
   *          host, the username to use to login to the remote host, and, if
   *          using ssh-agent, the value for the SSH_AUTH_SOCK environment
   *          variable.
   */
  getSSHConfiguration() {
    let authSock;
    if (!this.privateKey) {
      if (process.env.SSH_AUTH_SOCK) {
        authSock = process.env.SSH_AUTH_SOCK
      } else {
        this._resolvePrivateKeyIfNotExist();
      }
    }

    if (!this.privateKey && process.env.SSH_AUTH_SOCK) {
      authSock = process.env.SSH_AUTH_SOCK;
    }

    return {
      "host": this.host,
      "username": this.user,
      "port": this.port,
      "privateKey": this.privateKey,
      "agent": authSock ? authSock : false
    };
  }

  getPrivateKey() {
    return this.privateKey;
  }

  _resolvePrivateKeyIfNotExist() {
    if (!this.privateKey) {
      const sshKeyPath = path.join(process.env.HOME, '.ssh', 'id_rsa');
      let data = fs.readFileSync(sshKeyPath, 'utf8');
      if (!data) {
        throw new Error('Unable to read private key from id_rsa');
      }

      this.privateKey = data;
    }
  }
}
