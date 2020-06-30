import * as fs from 'fs';
import moment from 'moment';
import NodeSSH from 'node-ssh';
import * as path from 'path';
import 'process';
import { ConfigStore } from './ConfigStore';
import { FilePacker } from './FilePacker';

export function CLI(args) {
  let configStore = new ConfigStore(process.cwd());

  let remoteInstanceDir = moment().format('YYYY-MM-DD_HH:mm:ss');

  let deployUser = configStore.getDeployUser();
  let deployServer = configStore.getDeployServer();
  let deployPort = configStore.getDeployPort();
  let remoteBaseDir = configStore.getDeployBaseDir()
    + "/" + configStore.getAppEnvironment();
  let appEnvironment = configStore.getAppEnvironment();

  let filePacker = new FilePacker(configStore);
  let packedName = filePacker.getPackedFileName();

  // let remoteWorker = new RemoteWorker()
  console.log(`Packaging to package/${packedName}...`);
  filePacker.packageFiles()
    .then(() => {
      let sshConfig = getSSHConfiguration(deployUser, deployServer);
      return createBaseDirectoryOnServer(sshConfig, remoteBaseDir,
                                         remoteInstanceDir);
    })
    .then(() => {
      console.log("Creating current link");
      return createCurrentLink(getSSHConfiguration(), remoteBaseDir,
                               remoteInstanceDir, deployUser, deployServer);
    })
    .then(() => {
      console.log(`Copying package/${packedName} to ${deployServer}`);
      return copyPackageToServer(packedName, remoteBaseDir, remoteInstanceDir, deployUser, deployServer);
    })
    .then(() => {
      console.log(`Unpacking ${packedName} on remote host...`);
      return unpackRemotely(packedName, remoteBaseDir, remoteInstanceDir, deployUser, deployServer);
    })
    .then(() => {
      console.log("Done");
    })
    .catch((error) => {
      console.error("Unable to deploy files due to: ");
      console.error(error.message);
      console.error(error);
      process.exit(1);
    });
}

function copyPackageToServer(packageName, remoteBaseDir, remoteInstanceDir, deployUser, deployServer) {
  return new Promise((resolve, reject) => {
    let ssh = new NodeSSH();
    let sshConfig = getSSHConfiguration(deployUser, deployServer);

    ssh.connect(sshConfig)
      .then(() => {
        let localPath = path.resolve("./package/", packageName);

        let remotePath = `${remoteBaseDir}/${remoteInstanceDir}/${packageName}`;
        return ssh.putFile(localPath, remotePath);
      })
      .then(() => {
        return ssh.dispose();
      })
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function unpackRemotely(packageName, remoteBaseDir, remoteInstanceDir, deployUser, deployServer) {
  return new Promise((resolve, reject) => {
    let ssh = new NodeSSH();
    let sshConfig = getSSHConfiguration(deployUser, deployServer);

    ssh.connect(sshConfig)
      .then(() => {
        let command = `cd ${remoteBaseDir}/${remoteInstanceDir} && tar xzvf ${packageName}`;
        return ssh.execCommand(command);
      })
      .then(() => {
        return ssh.dispose();
      })
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function getSSHConfiguration(deployUser, deployServer, deployPort) {
  let authSock;
  if (process.env.SSH_AUTH_SOCK) {
    authSock = process.env.SSH_AUTH_SOCK;
  }

  return {
    "host": deployServer,
    "port": deployPort,
    "username": deployUser,
    "agent": authSock ? authSock : false
  };
}
