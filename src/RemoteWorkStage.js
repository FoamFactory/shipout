import * as colors from 'colors';
import Logger from 'pretty-logger';

import { FilePacker } from './FilePacker';

/**
 *  A set of tasks that are run on a remote machine by executing `run()`.
 *
 *  Note that `RemoteWorkStage` is a bit of a misnomer, because not all stages
 *  actually happen on the remote machine.
 */
class RemoteWorkStage {
  constructor(options) {
    this.name = options.name;
    this.parentWorker = options.parentWorker;
    this.configStore = options.configStore;
    this.isVerbose = !!options.isVerbose;

    this.logger = new Logger({
      showMillis: true,
      showTimestamp: false,
      info: "gray",
      error: "red",
      warn: "yellow",
      debug: "green",
      prefix: '[' + `STAGE: ${this.name}`.blue + ']'
    });
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

  getParentWorker() {
    return this.parentWorker;
  }

  setNextStage(stage) {
    this.nextStage = stage;
  }

  getNextStage() {
    return this.nextStage;
  }

  runNextStage(data) {
    let self = this;
    if (self.getNextStage()) {
      return self.getNextStage().run(data);
    }
  }

  reportError(error) {
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
 *  A `RemoteWorkStage` that packages an application locally and prepares it for
 *  copy to a remote machine.
 */
export class PackageRemoteWorkStage extends RemoteWorkStage {
  constructor(options) {
    super(Object.assign(options, { 'name': 'package' }));
  }

  run (data) {
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
 *  A `RemoteWorkStage` that creates the target deployment directory on the
 *  remote host.
 */
export class MakeDirectoryStage extends RemoteWorkStage {
  constructor(options) {
    super(Object.assign(options, { 'name': 'mkdir' }));
  }

  run (data) {
    let self = this;

    let configStore = self.getConfigStore();
    let remoteBaseDir = configStore.getRemoteBaseDir();
    let remoteInstanceDir = configStore.getRemoteInstanceDir();
    let deployUser = configStore.getDeployUser();
    let deployServer = configStore.getDeployServer();
    let port = configStore.getDeployPort();

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
 *  A `RemoteWorkStage` that creates a link called `current` in the base
 *  deployment directory of the remote host that points to the specific
 *  directory where the application will be deployed on the remote host.
 */
export class CreateCurrentLinkStage extends RemoteWorkStage {
  constructor(options) {
    super(Object.assign(options, { 'name': 'link' }));
  }

  run (data) {
    let self = this;

    let returnData = data;

    if (!self.getConfigStore().isTestMode()) {
      self.getLogger().info(`Creating current link...`);
    }

    return this.getParentWorker().createCurrentLink()
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
 *  A `RemoteWorkStage` that copies the previously created package to the remote
 *  host.
 */
export class CopyPackageToServerStage extends RemoteWorkStage {
  constructor(options) {
    super(Object.assign(options, { 'name': 'copy' }));
  }

  run (data) {
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
    let deployServer = self.getConfigStore().getDeployServer();

    if (!self.getConfigStore().isTestMode()) {
      self.getLogger().info(`Copying package/${packedFileName} to ${deployServer}`);
    }

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
 *  A `RemoteWorkStage` that unpacks the copied package on the remote host.
 */
export class UnpackStage extends RemoteWorkStage {
  constructor(options) {
    super(Object.assign(options, { 'name': 'unpack' }));
  }

  run (data) {
    let self = this;
    let returnData = data;
    let packedFileName = data.fileName;

    if (!data.hasOwnProperty('fileName')) {
      throw 'Data does not contain a fileName property. Did a previous stage fail?';
    }

    if (!self.getConfigStore().isTestMode()) {
      self.getLogger().info(`Unpacking ${packedFileName} on remote host...`);
    }

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
 *  A `RemoteWorkStage` that cleans up the `package/` directory on the local
 *  host.
 */
export class LocalCleanupStage extends RemoteWorkStage {
  constructor(options) {
    super(Object.assign(options, { 'name': 'localCleanup' }));
  }

  run (data) {
    let self = this;

    let returnData = data;
    let packedFilePath = data.path;
    if (!packedFilePath) {
      throw 'Data does not contain a path property. Did a previous stage fail?';
    }

    let filePacker = new FilePacker(self.getConfigStore());

    if (!self.getConfigStore().isTestMode()) {
      self.getLogger().info(`Cleaning up ${filePacker.getPackedFilePath()}...`);
    }

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
