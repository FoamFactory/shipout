import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
import moment from 'moment';

/**
 *  A configuration store based off of either a client's `package.json` or
 *  environment variables.
 */
export class ConfigStore {
  constructor(projectPath, isTestMode=false) {
    this.projectPath = projectPath;
    this.configuration = this.getConfiguration();
    this.remoteInstanceDir = moment().format('YYYY-MM-DD_HH:mm:ss');
    this.isVerboseMode = false;
  }

  isTestMode() {
    return this.isTestMode;
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

  getDeployPort() {
    return this.configuration ? this.configuration.deploy_port : null;
  }

  getDeployRootDir() {
    return this.configuration ? this.configuration.deploy_base_dir : null;
  }

  getRemoteBaseDir() {
    return this.getDeployRootDir() + "/" + this.getAppEnvironment();
  }

  getRemoteInstanceDir() {
    return this.remoteInstanceDir;
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

  isNamespacedProject() {
    let name = this.getName();
    let splitPath = name.split('/');
    if (splitPath.length > 1) {
      return true;
    }

    return false;
  }

  getNonNamespacedName() {
    let name = this.getName();
    let splitPath = name.split('/');
    if (splitPath.length > 1) {
      return splitPath.slice(-1);
    }

    return name;
  }

  getProjectBaseDirectory() {
    return this.projectPath;
  }

  getConfiguration() {
    let app_environment = this.getVariableFromPackageJson("app_environment");
    let deploy_base_dir = this.getVariableFromPackageJson("deploy_base_dir");
    let deploy_server = this.getVariableFromPackageJson("deploy_server");
    let deploy_port = this.getVariableFromPackageJson("deploy_port");
    let deploy_user = this.getVariableFromPackageJson("deploy_user");

    let retVal =  {
      "app_environment": app_environment != null ? app_environment
        : this.getVariableFromEnvironment("APP_ENVIRONMENT"),
      "deploy_base_dir": deploy_base_dir != null ? deploy_base_dir
        : this.getVariableFromEnvironment("DEPLOY_BASE_DIR"),
      "deploy_server": deploy_server != null ? deploy_server
        : this.getVariableFromEnvironment("DEPLOY_SERVER"),
      "deploy_port": deploy_port != null ? deploy_port
        : this.getVariableFromEnvironment("DEPLOY_PORT"),
      "deploy_user": deploy_user != null ? deploy_user
        : this.getVariableFromEnvironment("DEPLOY_USER")
    };

    if (!retVal.deploy_port) {
      retVal.deploy_port = "22";
    }

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
