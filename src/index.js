import * as fs from 'fs';
import mkdirp from 'mkdirp';
import moment from 'moment';
import NodeSSH from 'node-ssh';
import * as path from 'path';
import 'process';
import rimraf from 'rimraf';
import { pack } from 'tar-pack';
import { LocalFileManager } from './LocalFileManager';
import { ConfigStore } from './ConfigStore';

export function CLI(args) {
  let configStore = new ConfigStore(process.cwd());

  let remoteInstanceDir = moment().format('YYYY-MM-DD_HH:mm:ss');

  let deployUser = configStore.getDeployUser();
  let deployServer = configStore.getDeployServer();
  let remoteBaseDir = configStore.getDeployBaseDir();
  let appEnvironment = configStore.getAppEnvironment();

  // We always want to include at least README.md and package.json, regardless
  // if they are specified in the files array.
  let filesToPack = ['README.md', 'package.json'];
  if (configStore.getFiles()) {
    filesToPack = filesToPack.concat(configStore.getFiles());
  } else {
    filesToPack = [process.cwd()];
  }

  for (let fileIdx in filesToPack) {
    filesToPack[fileIdx] = path.resolve(".", filesToPack[fileIdx]);
  }

  let packedName = `${configStore.getName()}-v${configStore.getVersion()}.tgz`;

  console.log(`Packaging to package/${packedName}...`);
  mkdirp('package')
    .then((made) => {
      return packageFilesInto(filesToPack, packedName)
    })
    .then(() => {
      return createBaseDirectoryOnServer(remoteBaseDir, remoteInstanceDir, deployUser, deployServer);
    })
    .then(() => {
      console.log("Creating current link");
      return createCurrentLink(remoteBaseDir, remoteInstanceDir, deployUser, deployServer)
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

function packageFilesInto(filesToPack, packedName) {
  return new Promise((resolve, reject) => {
    let write = fs.createWriteStream;
    pack(process.cwd(), {
      "fromBase": true,
      "ignoreFiles": [],
      "filter": (entry) => {
        if (process.cwd() === entry.path) {
          // Include the base directory a duh
          return true;
        }

        if (filesToPack.includes(entry.path)) {
          return true;
        }

        for (let idx in filesToPack) {
          if (entry.path.startsWith(filesToPack[idx])) {
            return true;
          }
        }

        return false;
      }
    })
      .pipe(write(path.join("package", packedName)))
      .on('error', (error) => {
        reject(error);
      })
      .on('close', () => {
        resolve();
      });
  });
}

function createCurrentLink(remoteBaseDir, remoteInstanceDir, deployUser, deployServer) {
  return new Promise((resolve, reject) => {
    let ssh = new NodeSSH();
    let sshConfig = getSSHConfiguration(deployUser, deployServer);
    ssh.connect(sshConfig)
      .then(() => {
        let command = `if [[ -h ${remoteBaseDir}/current ]]; then rm ${remoteBaseDir}/current; fi && ln -s ${remoteBaseDir}/${remoteInstanceDir} ${remoteBaseDir}/current`;
        return ssh.execCommand(`${command}`);
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

function createBaseDirectoryOnServer(remoteBaseDir, remoteInstanceDir, deployUser, deployServer) {
  console.log(`Creating ${remoteBaseDir}/${remoteInstanceDir} as ${deployUser} on ${deployServer}...`);

  return new Promise((resolve, reject) => {
    let ssh = new NodeSSH();
    let sshConfig = getSSHConfiguration(deployUser, deployServer);
    ssh.connect(sshConfig)
    .then(() => {
      return ssh.execCommand(`mkdir -p "${remoteBaseDir}/${remoteInstanceDir}"`);
    })
    // .then((data) => {
    //   let command = `if [[ -h ${remoteBaseDir}/current ]]; then rm ${remoteBaseDir}/current; fi && ln -s ${remoteBaseDir}/${remoteInstanceDir} ${remoteBaseDir}/current`;
    //   return ssh.execCommand(`${command}`);
    // })
    .then((data) => {
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

function getSSHConfiguration(deployUser, deployServer) {
  let authSock;
  if (process.env.SSH_AUTH_SOCK) {
    authSock = process.env.SSH_AUTH_SOCK;
  }

  return {
    "host": deployServer,
    "username": deployUser,
    "agent": authSock ? authSock : false
  };
}

// ssh deployer-bot@${DEPLOY_SERVER} "cd ${DEPLOY_ROOT_DIR}/${DEPLOY_DIR} && tar xzvf app-*.tgz"
