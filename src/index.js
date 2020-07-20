import * as fs from 'fs';
import NodeSSH from 'node-ssh';
import * as path from 'path';
import 'process';
import Logger from 'pretty-logger';
import * as colors from 'colors';

import { ConfigStore } from './ConfigStore';
import { FilePacker } from './FilePacker';
import RemoteWorker from '~/src/RemoteWorker';
import { CopyPackageToServerStage,
         CreateCurrentLinkStage,
         MakeDirectoryStage,
         PackageRemoteWorkStage,
         LocalCleanupStage,
         UnpackStage } from '~/src/RemoteWorkStage';

let logger = new Logger({
  showTimestamp: false,
  info: "gray",
  error: "red",
  warn: "yellow",
  debug: "green",
  prefix: '[' + `Main Process`.green + ']'
});

export function CLI(args) {
  logger.info("Shipout Starting");

  CLIAsync(args)
    .then(() => {
      logger.info("Shipout Complete");
    })
    .catch((error) => {
      console.error("Unable to deploy files due to: ");
      console.error(error.message);
      console.error(error);
      process.exit(1);
    });
}

export function CLIAsync(args, privateKey, isTestMode=false) {
  // args is pruned to eliminate node and the name of the called executable,
  // assuming you invoked it with bin/shipout.js
  let workingDir;

  if (args.length > 0) {
      workingDir = args[0];
  } else {
    workingDir = process.cwd();
  }

  let configStore = new ConfigStore(path.resolve(workingDir), isTestMode);

  let filePacker = new FilePacker(configStore);

  let packedFilePath;
  let packedFileName;

  let remoteWorker = new RemoteWorker(configStore.getDeployUser(),
                                      configStore.getDeployServer(),
                                      configStore.getDeployPort(),
                                      configStore.getRemoteBaseDir(),
                                      configStore.getRemoteInstanceDir(),
                                      privateKey ? privateKey : null);

  let options = {
    'parentWorker': remoteWorker,
    'configStore': configStore
  };

  remoteWorker.setStages([new PackageRemoteWorkStage(options),
                          new MakeDirectoryStage(options),
                          new CreateCurrentLinkStage(options),
                          new CopyPackageToServerStage(options),
                          new UnpackStage(options),
                          new LocalCleanupStage(options)]);
  return remoteWorker.run();
}
