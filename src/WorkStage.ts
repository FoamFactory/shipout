import * as colors from 'colors';
import { ConfigStore } from 'ConfigStore';
import Logger from 'pretty-logger';

import { FilePacker } from './FilePacker';

import { IRemoteWorker, IWorkStage } from './types';

/**
 *  A set of related operations that can be run by executing `run()`.
 */
export class WorkStage implements IWorkStage {
  name: string;
  parentWorker: any;
  configStore: ConfigStore;
  logger: Logger;
  nextStage: WorkStage;
  isVerbose: boolean = false;

  constructor(options) {
    this.name = options.name;
    this.parentWorker = options.parentWorker;
    this.configStore = options.configStore;
    this.logger = options.logger;
  }

  run(data: any) : Promise<any> {
    throw new Error('Cannot run an undefined work stage');
  }

  getName() {
    return this.name;
  }

  getLogger() {
    return this.logger;
  }

  getConfigStore() {
    return this.configStore;
  }

  getParentWorker(): IRemoteWorker {
    return this.parentWorker;
  }

  setNextStage(stage: WorkStage) {
    this.nextStage = stage;
  }

  getNextStage(): WorkStage {
    return this.nextStage;
  }

  runNextStage(data) {
    let self = this;

    if (self.getNextStage()) {
      return self.getNextStage().run(data);
    }

    return new Promise<void>((resolve, reject) => {
      resolve(data);
    });
  }

  reportError(error) {
    console.trace(error);

    if (error.message) {
      this.logger.error(error.message);
    } else {
      this.logger.error(error);
    }

    if (this.isVerbose && error.stack) {
      this.logger.error(error.stack);
    }
  }
}

/**
 *  A `WorkStage` that packages an application locally and prepares it for
 *  copy to a remote machine.
 */
export class PackageWorkStage extends WorkStage {
  constructor(options) {
    super(Object.assign(options, { 'name': 'package' }));
  }

  run (data: any) : Promise<any> {
    let self = this;
    let filePacker = new FilePacker(this.getConfigStore());

    if (!self.getConfigStore().isTestMode()) {
      self.getLogger().info(`Packaging to ${filePacker.getPackedFilePath()}/${filePacker.getPackedFileName()}...`);
    }

    if (!self.getNextStage()) {
      return filePacker.packageFiles();
    } else {
      return filePacker.packageFiles()
        .then((data) => {
          return self.runNextStage(data);
        })
        .catch((error) => {
          self.reportError(error);
        });
    }
  }
}

/**
 *  A `WorkStage` that creates the target deployment directory on the
 *  remote host.
 */
export class MakeDirectoryStage extends WorkStage {
  constructor(options) {
    super(Object.assign(options, { 'name': 'mkdir' }));
  }

  run (data: any) : Promise<any> {
    let self = this;

    let configStore = self.getConfigStore();
    let remoteBaseDir = configStore.getRemoteBaseDirectory();
    let remoteInstanceDir = configStore.getRemoteInstanceDirectory();
    let deployUser = configStore.getUsername();
    let deployServer = configStore.getHost();
    let port = configStore.getPort();

    let returnData = data;

    if (!self.getConfigStore().isTestMode()) {
      self.getLogger().info(`Creating ${remoteBaseDir}/${remoteInstanceDir} as ${deployUser} on ${deployServer}:${port}...`);
    }

    return self.getParentWorker().createBaseDirectoryOnServer()
      .then((newData) => {
        returnData = Object.assign(returnData, newData);
        return self.runNextStage(returnData);
      })
      .catch((error) => {
        self.reportError(error);
      });
  }
}

/**
 *  A `WorkStage` that creates a link called `current` in the base
 *  deployment directory of the remote host that points to the specific
 *  directory where the application will be deployed on the remote host.
 */
export class CreateCurrentLinkStage extends WorkStage {
  constructor(options) {
    super(Object.assign(options, { 'name': 'link' }));
  }

  run (data: any) : Promise<any> {
    this.getLogger().debug('Creating current link');
    let self = this;

    let returnData = data;
    return this.getParentWorker().createCurrentLink()
      .then((newData) => {
        returnData = Object.assign(returnData, newData);
        self.getLogger().debug('Current link created successfully');
        return self.runNextStage(returnData);
      })
      .catch((error) => {
        self.reportError(error);
      });
  }
}

/**
 *  A `WorkStage` that copies the previously created package to the remote
 *  host.
 */
export class CopyPackageToServerStage extends WorkStage {
  constructor(options) {
    super(Object.assign(options, { 'name': 'copy' }));
  }

  run (data: any) : Promise<any> {
    let self = this;

    if (!data.hasOwnProperty('path')) {
      throw 'Data does not contain a path property. Did a previous stage fail?';
    }

    if (!data.hasOwnProperty('fileName')) {
      throw 'Data does not contain a fileName property. Did a previous stage fail?';
    }

    let returnData = data;
    let packedFileName = data.fileName;
    let packedFilePath = data.path;
    let deployServer = self.getConfigStore().getHost();

    self.getLogger().debug(`Copying ${packedFilePath}/${packedFileName} to ${deployServer}`);

    return self.getParentWorker()
    .copyPackageToServer(packedFilePath, packedFileName)
      .then((newData) => {
        returnData = Object.assign(returnData, newData);
        return self.runNextStage(returnData);
      })
      .catch((error) => {
        self.reportError(error);
      });
  }
}

/**
 *  A `WorkStage` that unpacks the copied package on the remote host.
 */
export class UnpackStage extends WorkStage {
  constructor(options) {
    super(Object.assign(options, { 'name': 'unpack' }));
  }

  run (data: any) : Promise<any> {
    let self = this;
    let returnData = data;
    let packedFileName = data.fileName;

    if (!data.hasOwnProperty('fileName')) {
      throw 'Data does not contain a fileName property. Did a previous stage fail?';
    }

    // if (!self.getConfigStore().isTestMode()) {
      self.getLogger().debug(`Unpacking ${packedFileName} on remote host...`);
    // }

    return self.getParentWorker().unpackRemotely(packedFileName)
      .then((newData) => {
        returnData = Object.assign(returnData, {
          "remoteFileList": newData.split("\n")
        });
        return self.runNextStage(returnData);
      })
      .catch((error) => {
        self.reportError(error);
      });
  }
}

/**
 *  A `WorkStage` that cleans up all but a specified number of "old"
 *  releases on the remote host. Relies on the `package.json` configuration
 *  option `keep_releases`.
 */
export class RemoteCleanupStage extends WorkStage {
  constructor (options) {
    super(Object.assign(options, { 'name': 'remoteCleanup' }));
  }

  run (data: any) : Promise<any> {
    let self = this;
    self.getLogger().debug('Cleaning up remote directories');

    let returnData = data;

    let numDirectoriesToKeep = self.getConfigStore().getNumReleasesToKeep();
    let isTestMode = self.getConfigStore().isTestMode();

    if (numDirectoriesToKeep < 0) {
      self.getLogger().debug("Skipping cleanup of remote releases");
    } else {
      self.getLogger().debug(`Cleaning up all but latest ${numDirectoriesToKeep} releases on the remote host`);
    }

    return self.getParentWorker().cleanUpRemoteDirectories(numDirectoriesToKeep)
      .then((newData) => {
        return self.runNextStage(returnData);
      })
      .catch((error) => {
        self.reportError(error);
      });
  }
}

/**
 *  A `WorkStage` that cleans up the `package/` directory on the local
 *  host.
 */
export class LocalCleanupStage extends WorkStage {
  constructor(options) {
    super(Object.assign(options, { 'name': 'localCleanup' }));
  }

  run (data: any) : Promise<any> {
    let self = this;

    let returnData = data;
    let packedFilePath = data.path;
    if (!packedFilePath) {
      throw 'Data does not contain a path property. Did a previous stage fail?';
    }

    let filePacker = new FilePacker(self.getConfigStore());

    self.getLogger().debug(`Cleaning up ${filePacker.getPackedFilePath()}...`);

    return filePacker.cleanUp()
      .then((newData) => {
        returnData = Object.assign(returnData, newData);
        return self.runNextStage(returnData);
      })
      .catch((error) => {
        self.reportError(error);
      });
  }
}

export class CheckNpmStage extends WorkStage {
  minVersion: string;

  constructor(options) {
    super(
      {
        ...options,
        'name': "checkNpm"
      }
    );

    this.minVersion = options.minVersion;
  }

  run(data: any): Promise<any> {
    let self = this;

    return self.getParentWorker().checkNpmVersion(this.minVersion)
    .then((newData) => {
      return self.runNextStage(newData);
    })
    .catch((error) => {
      self.reportError(error);
      throw error;
  });
  }
}
