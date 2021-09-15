import { ConfigStore } from '~/src/ConfigStore';
import { FilePacker } from '~/src/FilePacker';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from './test_helper';

let configStore, filePacker;

describe ('FilePacker', () => {
  describe ('with a shipout configuration defined in package.json and no files defined', () => {
    beforeEach(() => {
      configStore = new ConfigStore(__dirname + '/fixtures/projectWithConfig',
                                    logger);
      expect(configStore).toBeDefined();

      filePacker = new FilePacker(configStore);
    });

    describe ('#getPackedFileName()', () => {
      it ('should return the name of the packed archive', () => {
        expect(filePacker.getPackedFileName()).toBe('testproject-v1.0.0.tgz');
      });
    });

    describe ('#getFilesToPack', () => {
      it ('should include the project base directory by default', () => {
        expect(filePacker.getFilesToPack()).toContain(".");
      });
    });
  });

  describe ('with a shipout configuration defined in package.json and files defined', () => {
    beforeEach(() => {
      configStore = new ConfigStore(__dirname + '/fixtures/projectWithSomeFiles',
                                    logger);
      filePacker = new FilePacker(configStore);
    });

    describe ('#getFilesToPack()', () => {
      it ('should include README.md, package.json, and the build subdirectory', () => {
        expect(filePacker.getFilesToPack()).toContain('build');
        expect(filePacker.getFilesToPack()).toContain('README.md');
        expect(filePacker.getFilesToPack()).toContain('package.json');
      });
    });

    describe ('#packageFiles', () => {
      it ('should create a package within the package/ subdirectory', () => {
        return filePacker.packageFiles()
          .then((packageInfo) => {
            expect(fs.existsSync(path.join(packageInfo.path, packageInfo.fileName))).toBeTruthy();
            return filePacker.cleanUp()
              .then(() => {
                expect(fs.existsSync(path.join(packageInfo.path, packageInfo.fileName))).toBeFalsy();
              });
          });
      });
    });
  });
});
