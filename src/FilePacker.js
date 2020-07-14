import * as fs from 'fs';
import mkdirp from 'mkdirp';
import * as path from 'path';
import * as process from 'process';
import rimraf from 'rimraf';
import { pack } from 'tar-pack';

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

  getFilesToPack() {
    // We always want to include at least README.md and package.json, regardless
    // if they are specified in the files array.
    let filesToPack = ['README.md', 'package.json'];
    if (this.getConfigStore().getFiles()) {
      filesToPack = filesToPack.concat(this.getConfigStore().getFiles());
    } else {
      filesToPack = [this.getConfigStore().getProjectBaseDirectory()];
    }

    for (let fileIdx in filesToPack) {
      filesToPack[fileIdx] =
        path.resolve(this.getConfigStore().getProjectBaseDirectory(),
                     filesToPack[fileIdx]);
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

    return path.join(this.getConfigStore().getProjectBaseDirectory(),
                     packageDir);
  }

  getRootPackageDirectory() {
    return path.join(this.getConfigStore().getProjectBaseDirectory(),
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

    return new Promise((resolve, reject) => {
      mkdirp(self.getPackedFilePath())
        .then(() => {
          let write = fs.createWriteStream;
          pack(self.getConfigStore().getProjectBaseDirectory(), {
            "fromBase": true,
            "ignoreFiles": [],
            "filter": (entry) => {
              if (self.getConfigStore().getProjectBaseDirectory() === entry.path) {
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
            .pipe(write(path.join(self.getPackedFilePath(),
                                  self.getPackedFileName())))
            .on('error', (error) => {
              reject(error);
            })
            .on('close', () => {
              let packedPath = self.getPackedFilePath();
              let packedFileName = self.getPackedFileName();
              resolve({
                path: packedPath,
                fileName: packedFileName
              });
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
        console.log(error);
        if (error) {
         reject(error);
        } else {
         resolve();
        }
      });
    });
  }
}
