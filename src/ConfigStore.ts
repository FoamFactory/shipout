import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
import moment from 'moment';
import Logger from 'pretty-logger';

interface PackageConfiguration {
  shipout: object;
  files: Array<string>;
  version: string;
  name: string;
}

/**
 *  A configuration store based off of either a client's `package.json` or
 *  environment variables.
 */
export class ConfigStore {
  projectPath: string;
  remoteInstanceDir: string;
  logger: Logger;
  testMode: boolean;
  _packageConfig: PackageConfiguration;

  constructor(projectPath, logger, isTestMode=false) {
    this.projectPath = projectPath;

    // this.configurations = this.getConfigurationForEnvironment();
    this.remoteInstanceDir = moment().format('YYYY-MM-DD_HH:mm:ss');
    this.testMode = isTestMode;
    this.logger = logger;
  }

  isTestMode() {
    return this.testMode;
  }

  getLogger() {
    return this.logger;
  }

  getConfigValueForEnvironment(environment, key, defaultVal=null) {
    const config = this.getConfigurationForEnvironment(environment);

    if (config && config[key]) {
      return config[key];
    }

    this.logger.warn(`${key} not set in package.json. Using default value of "${defaultVal}"`);

    return defaultVal;
  }

  getUsername() {
    this._checkAppEnvironmentVariableExists();
    return this.getUsernameForEnvironment(process.env.APP_ENVIRONMENT);
  }

  getIsVerboseMode() {
    this._checkAppEnvironmentVariableExists();
    return this.getIsVerboseModeForEnvironment(process.env.APP_ENVIRONMENT);
  }

  getUsernameForEnvironment(environment) {
    return this.getConfigValueForEnvironment(environment, 'username',
                                             process.env.USER);
  }

  getIsVerboseModeForEnvironment(environment) {
    return this.getConfigValueForEnvironment(environment, 'verbose');
  }

  getHost() {
    this._checkAppEnvironmentVariableExists();
    return this.getHostForEnvironment(process.env.APP_ENVIRONMENT);
  }

  getHostForEnvironment(environment) {
    return this.getConfigValueForEnvironment(environment, 'host');
  }

  getPort() {
    this._checkAppEnvironmentVariableExists();
    return this.getPortForEnvironment(process.env.APP_ENVIRONMENT);
  }

  getPortForEnvironment(environment) {
    return this.getConfigValueForEnvironment(environment, "port") || 22;
  }

  getRemoteRootDirectory() {
    this._checkAppEnvironmentVariableExists();
    return this.getRemoteRootDirectoryForEnvironment(process.env.APP_ENVIRONMENT);
  }

  getRemoteRootDirectoryForEnvironment(environment) {
    return this.getConfigValueForEnvironment(environment, "base_directory");
  }

  getRemoteBaseDirectory() {
    this._checkAppEnvironmentVariableExists();
    return this.getRemoteBaseDirectoryForEnvironment(process.env.APP_ENVIRONMENT);
  }

  getRemoteBaseDirectoryForEnvironment(environment) {
    return this.getRemoteRootDirectoryForEnvironment(environment) + "/" + environment;
  }

  getRemoteInstanceDirectory() {
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

  getNumReleasesToKeep() {
    this._checkAppEnvironmentVariableExists();
    return this.getNumReleasesToKeepForEnvironment(process.env.APP_ENVIRONMENT);
  }

  getNumReleasesToKeepForEnvironment(environment) {
    let numDirs = this.getConfigValueForEnvironment(environment, "keep_releases", 5);

    return numDirs;
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
      return splitPath.slice(-1)[0];
    }

    return name;
  }

  getPathRelativeToProjectBaseDirectory(aPath) {
    const absPath = path.join(this.getAbsoluteProjectBaseDirectory(), aPath);
    const resolvedPath = path.resolve(absPath);
    const absProj = this.getAbsoluteProjectBaseDirectory();
    const relPath = path.relative(this.getAbsoluteProjectBaseDirectory(),
                                  resolvedPath);

    // Verify relative path exists.
    if (!fs.existsSync(path.resolve(path.join(this.getAbsoluteProjectBaseDirectory(), relPath)))) {
      this.logger.warn(`Path does not appear to exist: ${relPath}. Are you sure files were specified correctly in your package.json?`);
    }

    return relPath;
  }

  getAbsoluteProjectBaseDirectory() {
    return path.resolve(this.projectPath);
  }

  getProjectBaseDirectoryRelativeToWorkingDir() {
    return path.relative(process.cwd(), this.getAbsoluteProjectBaseDirectory());
  }

  getDefinedEnvironments() {
    const shipout_config = this.getPackageJsonTopLevelConfig();
    return Object.keys(shipout_config);
  }

  getConfigurationForEnvironment(environment) {
    this._checkEnvironmentDefined(environment);

    let base_dir = this.getVariableFromEnvironmentInPackageJson(environment, "base_directory");
    let host = this.getVariableFromEnvironmentInPackageJson(environment, "host");
    let port = this.getVariableFromEnvironmentInPackageJson(environment, "port");
    let username = this.getVariableFromEnvironmentInPackageJson(environment, "username");
    let verboseMode = this.getVariableFromEnvironmentInPackageJson(environment, "verbose");

    let retVal =  {
      "base_directory": base_dir,
      "host": host,
      "port": port,
      "username": username || process.env.USER,
      "verbose": !!verboseMode
    };

    if (!retVal.port) {
      retVal.port = "22";
    }

    let requiredVars = [ "base_directory", "host", "username" ];

    for (let requiredVarsIdx in requiredVars) {
      if (!retVal[requiredVars[requiredVarsIdx]]
          || retVal[requiredVars[requiredVarsIdx]] == null) {
        throw `A package.json configuration was not specified for ${requiredVars[requiredVarsIdx]} in environment "${environment}"`;
      }
    }

    return retVal;
  }

  getPackageJsonTopLevelConfig() {
    const pkg = this._getPackageConfig();

    return !!pkg.shipout && pkg.shipout;
  }

  getEnvironmentFromPackageJson(environment) {
    const topLevel = this.getPackageJsonTopLevelConfig();

    return !!topLevel && topLevel[environment];
  }

  getVariableFromEnvironmentInPackageJson(environment, varName) {
    const envConfig = this.getEnvironmentFromPackageJson(environment);

    return !!envConfig && envConfig[varName];
  }

  _getPackageConfig() {
    if (!this._packageConfig) {
      this._packageConfig = JSON.parse(
        fs.readFileSync(path.resolve(this.projectPath, "package.json"), "utf-8")
      );
    }

    return this._packageConfig;
  }

  _checkEnvironmentDefined(environment) {
    if (!this.getDefinedEnvironments().includes(environment)) {
      throw new Error(`Environment "${environment}" is not defined`);
    }
  }

  _checkAppEnvironmentVariableExists() {
    if (!process.env.APP_ENVIRONMENT) {
      throw new Error(`APP_ENVIRONMENT environment variable not defined`);
    }
  }
}
