import * as fs from 'fs';
import * as path from 'path';
import 'process';
import Logger from 'pretty-logger';
import * as colors from 'colors';
import packageJson from '../package.json';

import { ConfigStore } from './ConfigStore';
import { FilePacker } from './FilePacker';
import RemoteWorker from './RemoteWorker';
import { CopyPackageToServerStage,
         CreateCurrentLinkStage,
         MakeDirectoryStage,
         PackageRemoteWorkStage,
         LocalCleanupStage,
         RemoteCleanupStage,
         UnpackStage } from './RemoteWorkStage';

interface Logger {
  error(input: string): any;
  info(input: string): any;
}

let logger : any;

export function CLI(args: Array<string>) {
  CLIAsync(args, null, false)
    .then((lgr: Logger) => {
      lgr.info("Shipout Complete");
    })
    .catch((errorObj) => {
      console.trace(errorObj);
      const error = errorObj.error;
      const logger : Logger = errorObj.logger;
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
      Logger.setLevel('debug');
      // Logger.setLevel('warning', true);
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
