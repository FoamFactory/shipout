# shipout
A lightweight tool for deploying node applications from within a source repository

## Usage
1. Inside of your project, run:
```
npm install --save-dev @foamfactoryio/shipout
```
Alternatively, if using `yarn`, run:
```
yarn add -D @foamfactoryio/shipout
```

2. Add your configuration to your `package.json` or environment variables (see
  [Configuration](#configuration)), below.
3. Add a `shipout` script to your `package.json` (or, alternatively, use
  `publish` if you so desire):
  ```
  "scripts": {
    ...
    "shipout": "shipout"
    ...
  },
  ```

## Configuration
Configuration for `shipout` is performed within the `package.json` file. The
basic configuration within `package.json` is the `shipout` object:
```
"shipout": {
  "environment_name": {
    # key-value pairs go here
  }
},
... rest of package.json ...
```

Within the top-level `shipout` configuration, several configuration variables
are expected to be defined: server username, server hostname/ip address, an
optional port), remote base directory, and (optionally) the number of old
releases to keep. Each of these must be configured per-environment.

### Example Configuration
```
"shipout": {
  "production": {
    "host": "anywhere.example.com",
    "port": 9006,
    "username": "deployer_bot",
    "base_directory": "/var/www/",
    "keep_releases": 5
  }
}
```

### `host`
The hostname (or IP address) of the remote host to deploy to. Does not have a
default and must be specified.

### `port`
The port to connect to on the remote host. If not specified, will default to
`22`.

### `username`
The username of the user to login with on the remote host. Defaults to the
username of the current user logged in to the local system.

### `base_directory`
The base directory, as an absolute path, that contains the releases on the
remote host. Does not have a default and must be specified.

### `keep_releases`
The number of old releases to keep on the remote host. If set to `-1`, all
cleanup of old releases will be disabled and all releases will be kept
indefinitely. Defaults to `5` if not specified.

### `verbose`
Whether or not to output debugging information. Defaults to `null`, which is
equivalent to `false`. If you want debugging information specified, use `true`.

## Running Tests
### Prerequisites
You will need the following installed prior to running tests:
  - openssh-server

To install the prerequisites with `apt`, use the following command:
```
sudo apt install openssh-server
```
