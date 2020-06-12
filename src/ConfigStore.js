import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';

/**
 *  A configuration store based off of either a client's `package.json` or
 *  environment variables.
 */
export class ConfigStore {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.configuration = this.getConfigurationFromPackageJson();

    if (!this.configuration) {
      this.configuration = this.getConfigFromEnvironment();
    }
  }

  getAppEnvironment() {
    return this.configuration ? this.configuration.app_environment : null;
  }

  getDeployUser() {
      return this.configuration ? this.configuration.deploy_user : null;
  }

  getDeployServer() {
    return this.configuration ? this.configuration.deploy_server : null;
  }

  getDeployBaseDir() {
    return this.configuration ? this.configuration.deploy_base_dir : null;
  }

  getFiles() {
    return this._getPackageConfig().files;
  }

  getVersion() {
    return this._getPackageConfig().version;
  }

  getName() {
    return this._getPackageConfig().name;
  }

  getProjectBaseDirectory() {
    return this.projectPath;
  }

  getConfigurationFromPackageJson() {
    const pkg = this._getPackageConfig();

    if (pkg.shipout && pkg.shipout.app_environment
          && pkg.shipout.deploy_base_dir && pkg.shipout.deploy_server
          && pkg.shipout.deploy_user) {
      return {
        "app_environment": pkg.shipout.app_environment,
        "deploy_base_dir": pkg.shipout.deploy_base_dir,
        "deploy_server": pkg.shipout.deploy_server,
        "deploy_user": pkg.shipout.deploy_user
      }
    }

    return null;
  }

  getConfigFromEnvironment() {
    // Verify we have the correct environment variables to continue
    let requiredVars = [ 'APP_ENVIRONMENT', 'DEPLOY_BASE_DIR', 'DEPLOY_SERVER',
                         'DEPLOY_USER' ];

    for (let requiredVarsIdx in requiredVars) {
      if (!process.env.hasOwnProperty(requiredVars[requiredVarsIdx])) {
        throw `The environment variable ${requiredVars[requiredVarsIdx]} was not specified`;
      }
    }

    return {
      "app_environment": process.env.APP_ENVIRONMENT,
      "deploy_base_dir": process.env.DEPLOY_BASE_DIR,
      "deploy_server": process.env.DEPLOY_SERVER,
      "deploy_user": process.env.DEPLOY_USER
    }
  }

  _getPackageConfig() {
    if (!this._packageConfig) {
      this._packageConfig = JSON.parse(
        fs.readFileSync(path.resolve(this.projectPath, "package.json"), "utf-8")
      );
    }

    return this._packageConfig;
  }
}
