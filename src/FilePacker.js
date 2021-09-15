import * as fs from 'fs';
import mkdirp from 'mkdirp';
import * as path from 'path';
import * as process from 'process';
import rimraf from 'rimraf';
import tar from 'tar';

const PACKAGE_DIR_NAME = 'package';

/**
 *  Object handling the packaging of files from within a particular app's
 *  project directory.
 */
export class FilePacker {
  /**
   *  Create a new {@link FilePacker} instance.
   *
   *  @param {ConfigStore} configStore An instance of {@link ConfigStore} used to
   *         retrieve the necessary metadata for packing.
   */
  constructor(configStore) {
    this.configStore = configStore;
  }

  // NOTE: This will always return file paths relative to the project base
  //       directory.
  getFilesToPack() {
    // We always want to include at least README.md and package.json, regardless
    // if they are specified in the files array.
    let filesToPack = ['README.md', 'package.json'];
    if (this.getConfigStore().getFiles()) {
      filesToPack = filesToPack.concat(this.getConfigStore().getFiles());
    } else {
      // If no files are specified in the package.json file, then we should
      // include the entire base package directory.
      filesToPack = ["."];
    }

    for (let fileIdx in filesToPack) {
      if (filesToPack[fileIdx] !== ".") {
        filesToPack[fileIdx] = this.getConfigStore()
        .getPathRelativeToProjectBaseDirectory(filesToPack[fileIdx]);
      }
    }

    return filesToPack;
  }

  getPackedFileName() {
    return `${this.getConfigStore().getNonNamespacedName()}` +
      `-v${this.getConfigStore().getVersion()}.tgz`;
  }

  getPackedFilePath() {
    let packageDir = PACKAGE_DIR_NAME;

    // If the project has a namespace, or a '/' in it, we need to make that
    // directory, too.
    let splitPath = this.getConfigStore().getName().split('/');
    if (splitPath.length > 1) {
      packageDir = path.join(PACKAGE_DIR_NAME,
                             splitPath.slice(0, splitPath.length - 1)
                                      .join(path.sep));
    }

    const packedFilePath
      = path.resolve(this.getConfigStore().getAbsoluteProjectBaseDirectory(),
                     packageDir);

    return packedFilePath;
  }

  getRootPackageDirectory() {
    return path.join(this.getConfigStore().getAbsoluteProjectBaseDirectory(),
                     PACKAGE_DIR_NAME);
  }

  getConfigStore() {
    return this.configStore;
  }

  /**
   *  Package all files for a given NPM package.
   *
   *  @return {Promise} A {@link Promise} that will resolve with an object
   *          containing the path of the packaged file, as well as the packaged
   *          file name, on success and will reject with any errors encountered.
   */
  packageFiles() {
    let self = this;
    let filesToPack = this.getFilesToPack();

    return mkdirp(self.getPackedFilePath())
      .then(() => {
        return new Promise((resolve, reject) => {
          let write = fs.createWriteStream;
          let relFilesToPack = [];
          for (let fileIdx in filesToPack) {
            relFilesToPack.push(path.join(
              self.getConfigStore().getProjectBaseDirectoryRelativeToWorkingDir(),
              filesToPack[fileIdx]));
          }

          return tar.c({
              gzip: true,
              file: path.join(self.getPackedFilePath(), self.getPackedFileName()),
            },
            relFilesToPack)
            .then(out => {
              this.configStore.getLogger().debug('Packed file paths: ',
                                                 relFilesToPack);

              resolve({
                path: self.getPackedFilePath(),
                fileName: self.getPackedFileName()
              });
            })
            .catch((e) => {
              this.configStore.getLogger().trace("Problem while packing file: ", e);
              reject(e);
            });
        });
      });
  }

  /**
   *  Clean up (i.e. remove) any packaged files.
   *
   *  @return {Promise} A {@link Promise} that will resolve with no arguments
   *          on success, or reject with an error on failure.
   */
  cleanUp() {
    let self = this;
    return new Promise((resolve, reject) => {
      let packagePath = self.getRootPackageDirectory();

      rimraf(packagePath, (error) => {
        if (error) {
         reject(error);
        } else {
         resolve();
        }
      });
    });
  }
}
