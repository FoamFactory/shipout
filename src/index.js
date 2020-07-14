import * as fs from 'fs';
import moment from 'moment';
import NodeSSH from 'node-ssh';
import * as path from 'path';
import 'process';

import { ConfigStore } from './ConfigStore';
import { FilePacker } from './FilePacker';
import RemoteWorker from '~/src/RemoteWorker';


export function CLI(args) {
  CLIAsync(args)
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

export function CLIAsync(args, privateKey) {
  // args is pruned to eliminate node and the name of the called executable,
  // assuming you invoked it with bin/shipout.js
  let workingDir;

  if (args.length > 0) {
      workingDir = args[0];
  } else {
    workingDir = process.cwd();
  }

  let configStore = new ConfigStore(path.resolve(workingDir));

  let remoteInstanceDir = moment().format('YYYY-MM-DD_HH:mm:ss');

  let deployUser = configStore.getDeployUser();
  let deployServer = configStore.getDeployServer();
  let deployPort = configStore.getDeployPort();
  let remoteBaseDir = configStore.getDeployBaseDir()
    + "/" + configStore.getAppEnvironment();
  let appEnvironment = configStore.getAppEnvironment();

  let filePacker = new FilePacker(configStore);

  let packedFilePath;
  let packedFileName;

  let remoteWorker = new RemoteWorker(deployUser, deployServer, deployPort,
                                      remoteBaseDir, remoteInstanceDir,
                                      privateKey ? privateKey : null);

  console.log(`Packaging to ${filePacker.getPackedFilePath()}/${filePacker.getPackedFileName()}...`);

  return filePacker.packageFiles()
    .then((packedFileInfo) => {
      packedFilePath = packedFileInfo.path;
      packedFileName = packedFileInfo.fileName;
      return remoteWorker.createBaseDirectoryOnServer();
    })
    .then(() => {
      console.log("Creating current link");
      return remoteWorker.createCurrentLink();
    })
    .then(() => {
      console.log(`Copying package/${packedFileName} to ${deployServer}`);
      return remoteWorker.copyPackageToServer(packedFilePath, packedFileName);
    })
    .then(() => {
      console.log(`Unpacking ${packedFileName} on remote host...`);
      return remoteWorker.unpackRemotely(packedFileName);
    })
    .then(() => {
      console.log(`Cleaning up ${packedFilePath}...`);
      return filePacker.cleanUp();
    })
}
