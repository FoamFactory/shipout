import Logger from 'pretty-logger';

/**
 * An object with the configuration parameters specific to a shipout
 * environment.
 */
export interface ShipoutEnvironmentConfiguration {
  username: string | null;
  host: string | null;
  port: string | number | null;
  base_directory: string | null;
  branch?: string;
}

export interface PackageConfiguration {
  shipout: ShipoutEnvironmentConfiguration;
  files: Array<string>;
  version: string;
  name: string;
  repository: object | null;
}

export interface IConfigStore {
  projectPath: string;
  remoteInstanceDir: string;
  logger: Logger;
  testMode: boolean;
}

/**
 *  A set of related operations that can be run by executing `run()`.
 */
export interface IWorkStage {
  name: string;
  parentWorker: any;
  configStore: IConfigStore;
  logger: Logger;
  nextStage: IWorkStage;
  isVerbose: boolean;
}

/**
 * A data structure that handles a connection to a remote machine and performs
 * tasks on it.
 */
export interface IRemoteWorker {
  user: string;
  host: string;
  port: number;
  remoteBaseDir: string;
  remoteInstanceDir: string;
  privateKey: string;
  stages: Array<IWorkStage>;
  logger: Logger;

  /**
   *  Create the necessary base directory for deployment on the remote host.
   *
   *  @return {Promise} A Promise that will resolve with any output written to
   *          standard out on the remote host while the base directory is being
   *          created on success, or an error, on failure.
   */
  createBaseDirectoryOnServer(): Promise<string>;

  /**
   *  Create a symbolic link to the current released version of the application
   *  on the remote host.
   *
   *  @return {Promise} A {@link Promise} that will resolve with any output when
   *          the current link has been created on the remote host.
   */
  createCurrentLink(): Promise<string>;

  /**
   *  Copy a package to the remote host.
   *
   *  @param  {String} packagePath The absolute path of the directory in which
   *          the package to copy is located on the local machine, as a
   *          {@link String}.
   *  @param  {String} packageName The file name of the package to copy.
   *
   *  @return {Promise} A Promise that will resolve once the package has been
   *          copied.
   */
  copyPackageToServer(packagePath: string, packageName: string): Promise<void>;

  /**
   *  Unpack a package on the remote host.
   *
   *  @param  {String} packageName The file name of the package to unpack.
   *
   *  @return {Promise} A Promise that will resolve with any output written to
   *          standard out on the remote host while the base directory is being
   *          created on success, or an error, on failure.
   */
  unpackRemotely(packageName): Promise<string>;

  /**
   * Clean up any temporary directories on the remote host.
   *
   * @param  numDirectoriesToKeep The number of directories to keep on the
   *         remote host. Defaults to 5.
   *
   * @return A promise that resolves when the operation is complete.
   */
  cleanUpRemoteDirectories(numDirectoriesToKeep: number): Promise<any>
}
