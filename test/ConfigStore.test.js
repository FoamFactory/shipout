import { ConfigStore } from '~/src/ConfigStore';
import * as process from 'process';

describe('ConfigStore', () => {
  describe('when loading configuration from project.json', () => {
    it ('loads shipout configuration successfully', () => {
      let configStore = new ConfigStore(__dirname + '/fixtures/projectWithConfig');

      expect(configStore.getAppEnvironment()).toBe('staging');
      expect(configStore.getDeployUser()).toBe('someuser');
      expect(configStore.getDeployBaseDir()).toBe('/some/path');
      expect(configStore.getDeployServer()).toBe('server.somewhere.net');
      expect(configStore.getDeployPort()).toBe('3791');

      expect(configStore.getName()).toBe('testproject');
      expect(configStore.getVersion()).toBe('1.0.0');
      expect(configStore.getFiles()).toBeUndefined();
    });
  });

  describe('when loading configuration from environment variables', () => {
    beforeEach(() => {
      process.env.APP_ENVIRONMENT = 'staging';
      process.env.DEPLOY_BASE_DIR = '/some/where';
      process.env.DEPLOY_USER = 'hello';
      process.env.DEPLOY_SERVER = 'localhost';
    });

    it ('loads shipout configuration successfully', () => {
      let configStore = new ConfigStore(__dirname + '/fixtures/projectWithNoConfig');

      expect(configStore.getAppEnvironment()).toBe('staging');
      expect(configStore.getDeployUser()).toBe('hello');
      expect(configStore.getDeployPort()).toBe("22");
      expect(configStore.getDeployBaseDir()).toBe('/some/where');
      expect(configStore.getDeployServer()).toBe('localhost');
    });
  });

  describe ('when no configuration is specified', () => {
    beforeEach(() => {
      delete process.env.APP_ENVIRONMENT;
      delete process.env.DEPLOY_BASE_DIR;
      delete process.env.DEPLOY_USER;
      delete process.env.DEPLOY_SERVER;
    });

    it ('will throw an exception if one of the environment variables is not specified', () => {
      expect(() => {
        new ConfigStore(__dirname + '/fixtures/projectWithNoConfig');
      }).toThrow('Neither a package.json configuration nor an environment variable was specified for app_environment');
    });
  });
});
