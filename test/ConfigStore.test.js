import { ConfigStore } from '~/src/ConfigStore';
import * as process from 'process';
import * as Path from 'path';

let configStore;

describe('ConfigStore', () => {
  describe('when using projectWithConfig', () => {
    beforeEach(() => {
      configStore = new ConfigStore(Path.join(__dirname, 'fixtures', 'projectWithConfig'));
    });

    it ('should show the config store is not in test mode', () => {
      expect(configStore.isTestMode()).toBe(false);
    });

    it ('should show that the configuration has a single environment', () => {
      expect(configStore.getDefinedEnvironments()).toStrictEqual(['staging']);
    });

    it ('should be able to retrieve the configuration for the environment', () => {
      expect(configStore.getConfigurationForEnvironment('staging')).toBeDefined();
    });

    it ('should throw an error if a configuration is requested from an undefined environment', () => {
      expect(() => {
        configStore.getConfigurationForEnvironment('production')
      }).toThrow('Environment "production" is not defined');
    });

    it ('loads shipout configuration successfully', () => {
      expect(configStore.getUsernameForEnvironment('staging')).toBe('someuser');
      expect(configStore.getRemoteRootDirectoryForEnvironment('staging')).toBe('/some/path');
      expect(configStore.getHostForEnvironment('staging')).toBe('server.somewhere.net');
      expect(configStore.getPortForEnvironment('staging')).toBe('3791');

      expect(configStore.getName()).toBe('testproject');
      expect(configStore.getVersion()).toBe('1.0.0');
      expect(configStore.getFiles()).toBeUndefined();
    });

    describe ('when loading a configuration using an environment variable specifying the shipout environment', () => {
      describe ('when APP_ENVIRONMENT is specified as "staging"', () => {
        beforeEach(() => {
          process.env.APP_ENVIRONMENT = 'staging';
        });

        it ('loads shipout configuration successfully', () => {
          expect(configStore.isNamespacedProject()).toBe(false);
          expect(configStore.getNonNamespacedName()).toBe('testproject');

          expect(configStore.getUsername()).toBe('someuser');
          expect(configStore.getRemoteRootDirectory()).toBe('/some/path');
          expect(configStore.getHost()).toBe('server.somewhere.net');
          expect(configStore.getPort()).toBe('3791');
          expect(configStore.getNumReleasesToKeep()).toBe(5);

          expect(configStore.getName()).toBe('testproject');
          expect(configStore.getVersion()).toBe('1.0.0');
          expect(configStore.getFiles()).toBeUndefined();
        });
      });

      describe ('when no APP_ENVIRONMENT variable is specified', () => {
        beforeEach(() => {
          delete process.env.APP_ENVIRONMENT;
        });

        it ('should throw an exception', () => {
          expect(() => {
            configStore.getUsername();
          }).toThrow('APP_ENVIRONMENT environment variable not defined');
        });
      });
    });
  });

  describe ('when using a project with a namespace', () => {
    beforeEach(() => {
      configStore = new ConfigStore(Path.join(__dirname, 'fixtures', 'namespacedProject'));
    });

    it ('should load the configuration', () => {
      expect(configStore.isNamespacedProject()).toBe(true);
      expect(configStore.getNonNamespacedName()).toBe('namespaced-project');

      expect(configStore.getUsernameForEnvironment('staging')).toBe(process.env.USER);
      expect(configStore.getRemoteRootDirectoryForEnvironment('staging')).toBe('/tmp/shipout');
      expect(configStore.getHostForEnvironment('staging')).toBe('localhost');
      expect(configStore.getPortForEnvironment('staging')).toBe('4002');
      expect(configStore.getProjectBaseDirectory()).toBe(Path.join(__dirname, 'fixtures', 'namespacedProject'));

      expect(configStore.getName()).toBe('@loonslanding/namespaced-project');
      expect(configStore.getVersion()).toBe('1.0.0');
      expect(configStore.getFiles()).toBeUndefined();
    });
  });
});
