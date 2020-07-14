import fs from 'fs';
import path from 'path';
import process from 'process';
import NodeSSH from 'node-ssh';

/**
 *  An object that allows the quick and easy execution of commands as a given
 *  user on a specific host using SSH.
 */
export default class RemoteWorker {

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
   */
  constructor(user, host, port, remoteBaseDir, remoteInstanceDir, privateKey) {
    this.user = user;
    this.host = host;
    this.port = port;
    this.remoteBaseDir = remoteBaseDir;
    this.remoteInstanceDir = remoteInstanceDir;
    this.privateKey = privateKey;
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

    console.log(`Creating ${remoteBaseDir}/${remoteInstanceDir} as ${deployUser} on ${deployServer}:${port}...`);

    return new Promise((resolve, reject) => {
      let response = '';
      let ssh = new NodeSSH();
      ssh.connect(sshConfig)
      .then(() => {
        return ssh.execCommand(`mkdir -p "${remoteBaseDir}/${remoteInstanceDir}"`);
      })
      .then((data) => {
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

    console.log(`Copying package to server with package path: ${packagePath} and file name: ${packageName}`);

    return new Promise((resolve, reject) => {
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
        let ssh = new NodeSSH();

        ssh.connect(sshConfig)
          .then(() => {
            return ssh.putFile(localPath, remotePath);
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
}
