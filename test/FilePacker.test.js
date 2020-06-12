import { ConfigStore } from '~/src/ConfigStore';
import { FilePacker } from '~/src/FilePacker';
import * as path from 'path';

let configStore, filePacker;

describe ('FilePacker', () => {
  describe ('with a shipout configuration defined in package.json and no files defined', () => {
    beforeEach(() => {
      configStore = new ConfigStore(__dirname + '/fixtures/projectWithConfig');
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
        expect(filePacker.getFilesToPack()).toContain(configStore.getProjectBaseDirectory());
      });
    });
  });

  describe ('with a shipout configuration defined in package.json and files defined', () => {
    beforeEach(() => {
      configStore = new ConfigStore(__dirname + '/fixtures/projectWithSomeFiles');
      filePacker = new FilePacker(configStore);
    });

    describe ('#getFilesToPack()', () => {
      it ('should include README.md, package.json, and the build subdirectory', () => {
        let basePath = path.resolve('.', 'test', 'fixtures', 'projectWithSomeFiles');
        expect(filePacker.getFilesToPack()).toContain(path.join(basePath, 'README.md'));
        expect(filePacker.getFilesToPack()).toContain(path.join(basePath, 'package.json'));

        let buildPath = path.join(basePath, 'build');
        expect(filePacker.getFilesToPack()).toContain(path.join(buildPath));
      });
    });

    describe ('#packageFiles', () => {
      it ('should create a package within the package/ subdirectory', (done) => {
        filePacker.packageFiles()
          .then(() => {
            return filePacker.cleanUp();
          })
          .then(() => {
            done();
          });
      });
    });
  });
});
