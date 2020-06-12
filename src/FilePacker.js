import * as fs from 'fs';
import mkdirp from 'mkdirp';
import * as path from 'path';
import * as process from 'process';
import rimraf from 'rimraf';
import { pack } from 'tar-pack';

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
    return `${this.getConfigStore().getName()}` +
      `-v${this.getConfigStore().getVersion()}.tgz`;
  }

  getConfigStore() {
    return this.configStore;
  }

  packageFiles() {
    let filesToPack = this.getFilesToPack();

    return new Promise((resolve, reject) => {
      mkdirp(path.join(this.getConfigStore().getProjectBaseDirectory(), 'package'))
        .then(() => {
          let write = fs.createWriteStream;
          pack(this.getConfigStore().getProjectBaseDirectory(), {
            "fromBase": true,
            "ignoreFiles": [],
            "filter": (entry) => {
              if (this.getConfigStore().getProjectBaseDirectory() === entry.path) {
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
            .pipe(write(path.join(this.getConfigStore().getProjectBaseDirectory(), "package", this.getPackedFileName())))
            .on('error', (error) => {
              reject(error);
            })
            .on('close', () => {
              resolve();
            });
        });
    });
  }

  cleanUp() {
    return new Promise((resolve, reject) => {
      rimraf(path.join(this.getConfigStore().getProjectBaseDirectory(), 'package'),
             (error) => {
               if (error) {
                 reject(error);
               } else {
                 resolve();
               }
             });
    });
  }
}
