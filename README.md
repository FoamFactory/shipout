# shipout
A lightweight tool for deploying node applications from within a source repository

## Usage
1. You will need to add the following to an `.npmrc` file in order to get access
to packages hosted by `@foamfactory` on github packages:
```
registry=https://registry.npmjs.org
@foamfactory:registry=https://npm.pkg.github.com
```
Alternatively, if using `yarn`, you need to add the following `.yarnrc`:
```
"@foamfactory:registry" "https://npm.pkg.github.com/"
registry "https://registry.npmjs.org/"
```

2. Inside of your project, run:
```
npm install --save-dev @foamfactory/shipout
```
Alternatively, if using `yarn`, run:
```
yarn add -D @foamfactory/shipout
```

3. Add your configuration to your `package.json` or environment variables (see
  [Configuration](#configuration)), below.
4. Add a `shipout` script to your `package.json` (or, alternatively, use
  `publish` if you so desire):
  ```
  "scripts": {
    ...
    "shipout": "shipout"
    ...
  },
  ```

## Configuration
There are four main configuration variables that are required for `shipout` to
work: app environment, server hostname/ip address, server username, and remote
base directory. You can specify them as either an environment variable or as an
configuration in `package.json`. Each of these is described below.

To specify configuration values in `package.json`, create a `shipout` section in
your `package.json` file with the values you wish to specify:
```
  ...
  "shipout": {
    # Key/value pairs go here
  },
  ...
```

| Name                 | Package.json Key Name  | Environment Variable Name | Description |
| -------------------- | ---------------------- | ------------------------- | ----------- |
| App Environment      | `app_environment`      | `APP_ENVIRONMENT`         | The environment which is being deployed. This is used if you want, for example, a `staging` and `production` version of the app on the same server. It should be a string. If in doubt, use `"production"`. |
| Deploy Username      | `deploy_user`          | `DEPLOY_USER`             | The username of the user to login with to the remote host. Defaults to the username of the current user logged in to the local system. |
| Deploy Host          | `deploy_server`        | `DEPLOY_SERVER`           | The hostname (or IP address) of the remote host to deploy to. No default. |
| Base Directory       | `deploy_base_dir`      | `DEPLOY_BASE_DIR`         | The base directory, as an absolute path, that contains the releases on the remote host. No default. |
| Old Releases to Keep | `keep_releases`        | N/A                       | The number of old releases to keep on the remote host. Defaults to `5` if not specified. Set to `-1` to disable cleanup of old releases. |

## Running Tests
In order to run tests, you will need to install [Docker](http://www.docker.com) on your system. We don't use Docker to run tests, other than for testing SSH capabilities, so if you don't have Docker installed, you should still be able to run most of the tests.
