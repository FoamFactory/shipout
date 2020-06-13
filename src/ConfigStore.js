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
    this.configuration = this.getConfiguration();
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

  getConfiguration() {
    let app_environment = this.getVariableFromPackageJson("app_environment");
    let deploy_base_dir = this.getVariableFromPackageJson("deploy_base_dir");
    let deploy_server = this.getVariableFromPackageJson("deploy_server");
    let deploy_user = this.getVariableFromPackageJson("deploy_user");

    let retVal =  {
      "app_environment": app_environment != null ? app_environment
        : this.getVariableFromEnvironment("APP_ENVIRONMENT"),
      "deploy_base_dir": deploy_base_dir != null ? deploy_base_dir
        : this.getVariableFromEnvironment("DEPLOY_BASE_DIR"),
      "deploy_server": deploy_server != null ? deploy_server
        : this.getVariableFromEnvironment("DEPLOY_SERVER"),
      "deploy_user": deploy_user != null ? deploy_user
        : this.getVariableFromEnvironment("DEPLOY_USER")
    };

    let requiredVars = [ "app_environment", "deploy_base_dir", "deploy_server",
                         "deploy_user" ];

    for (let requiredVarsIdx in requiredVars) {
      if (!retVal[requiredVars[requiredVarsIdx]]
          || retVal[requiredVars[requiredVarsIdx]] == null) {
        throw "Neither a package.json configuration nor an environment "
              + `variable was specified for ${requiredVars[requiredVarsIdx]}`;
      }
    }

    return retVal;
  }

  getVariableFromPackageJson(varName) {
    const pkg = this._getPackageConfig();

    if (!pkg.shipout) {
      return null;
    }

    return pkg.shipout[varName];
  }

  getVariableFromEnvironment(varName) {
    return process.env[varName];
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
