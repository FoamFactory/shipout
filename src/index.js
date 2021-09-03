import * as fs from 'fs';
import NodeSSH from 'node-ssh';
import * as path from 'path';
import 'process';
import Logger from 'pretty-logger';
import * as colors from 'colors';
import packageJson from '../package';

import { ConfigStore } from './ConfigStore';
import { FilePacker } from './FilePacker';
import RemoteWorker from '~/src/RemoteWorker';
import { CopyPackageToServerStage,
         CreateCurrentLinkStage,
         MakeDirectoryStage,
         PackageRemoteWorkStage,
         LocalCleanupStage,
         RemoteCleanupStage,
         UnpackStage } from '~/src/RemoteWorkStage';

let logger;

export function CLI(args) {
  CLIAsync(args, null, false)
    .then((logger) => {
      logger.info("Shipout Complete");
    })
    .catch((errorObj) => {
      const error = errorObj.error;
      const logger = errorObj.logger;
      logger.error(`Unable to deploy files to remote host because of error: ${error.message}`);
      process.exit(1);
    });
}

export function CLIAsync(args, privateKey, isTestMode=false) {
  return new Promise((resolve, reject) => {

    // args is pruned to eliminate node and the name of the called executable,
    // assuming you invoked it with bin/shipout.js
    let workingDir;

    if (args.length > 0) {
        workingDir = args[0];
    } else {
      workingDir = process.cwd();
    }

    // Initialize logger and config store
    let logger = new Logger({
      showTimestamp: false,
      info: "gray",
      error: "red",
      warn: "yellow",
      debug: "green",
      prefix: '[' + `Main Process`.green + ']'
    });

    let configStore = new ConfigStore(path.resolve(workingDir), logger,
                                      isTestMode);

    if (isTestMode) {
      Logger.setLevel('warning', true);
    } else if (configStore.getIsVerboseMode()) {
      Logger.setLevel('debug');
    } else {
      Logger.setLevel('info', true);
    }

    logger.info(`Shipout v${packageJson.version} initialized`);

    let filePacker = new FilePacker(configStore);

    let packedFilePath;
    let packedFileName;

    let remoteWorker = RemoteWorker.create(configStore,
                                           privateKey ? privateKey : null);


    let options = {
      'parentWorker': remoteWorker,
      'configStore': configStore,
      'logger': logger
    };

    remoteWorker.setStages([new PackageRemoteWorkStage(options),
                            new MakeDirectoryStage(options),
                            new CreateCurrentLinkStage(options),
                            new CopyPackageToServerStage(options),
                            new UnpackStage(options),
                            new RemoteCleanupStage(options),
                            new LocalCleanupStage(options)]);
    return remoteWorker.run()
      .then(() => {
        resolve(logger);
      })
      .catch((error) => {
        reject({error, logger});
      });
  });
}
