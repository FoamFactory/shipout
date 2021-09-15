# Changelog

<a name="0.1.6"></a>
## 0.1.6 (2021-09-15)

### Bug Fixes

- 🐛 Fix issue with absolute paths in deployments. [[6f12a38](https://github.com/foamfactory/shipout/commit/6f12a3842b329eac0b691aa78fc9658018085c25)]
- 🐛 Fix issue where files were being deployed using absolute paths. [[9d4ece9](https://github.com/foamfactory/shipout/commit/9d4ece91e8ce8df0bde52e3c305d406ffc03d145)]

### Dependency Changes

- ⬆️ Upgrade packages. [[ac80c5c](https://github.com/foamfactory/shipout/commit/ac80c5c5c39288f4f73882a92b9dab787ddf56e4)]


<a name="0.1.5"></a>
## 0.1.5 (2021-08-29)

### Dependency Changes

- ➖ Remove gitmoji-changelog from dev dependencies. [[f2d464b](https://github.com/foamfactory/shipout/commit/f2d464b1ff1ab0460ea7b9b91c3cc8a1a6d8e787)]

### Testing and Deployments

- 🚀 Redeploy under organization name &#x27;foamfactoryio&#x27;. [[6fd880e](https://github.com/foamfactory/shipout/commit/6fd880e5ae4bc60c23c2604dde1213e747a45128)]


<a name="0.1.4"></a>
## 0.1.4 (2021-08-27)

### Documentation and Copy Changes

- 📖 Add CHANGELOG.md. [[57307ae](https://github.com/foamfactory/shipout/commit/57307ae1b8f77e57eba2e77f0aaebae51af61202)]

### Dependency Changes

- ➖ Remove dependency tar-pack. [[b483645](https://github.com/foamfactory/shipout/commit/b48364526b1a67a8b5322f2273e51369929288f5)]


<a name="0.1.3"></a>
## 0.1.3 (2021-08-26)

### Features

- ✅ Update tests to work on Ubuntu 21.04. [[d140256](https://github.com/foamfactory/shipout/commit/d140256c8bbdeb06f5aef1ce7d18b2cd8a21025f)]
- ✨ Add the ability to configure shipout per-environment. [[34c1a03](https://github.com/foamfactory/shipout/commit/34c1a036d47dcd4d67314399081b52ba97da291a)]
- ✨ Add the ability to clean up X old releases. [[e2fb2fc](https://github.com/foamfactory/shipout/commit/e2fb2fc8a8bc262e2a0e12c03fa97e122954e407)]
- ✨ Make shipout work with namespaced projects. [[76744a9](https://github.com/foamfactory/shipout/commit/76744a9676264fc8a128c5de2a5629d35869451d)]
- ✨ Add a RemoteWorker class to handle remote operations. [[327a43d](https://github.com/foamfactory/shipout/commit/327a43d5ff7a9c0d149774b56e6e6cb67c05f61e)]
- ✅ Add a helper for running tests against an SSH server. [[9276d7d](https://github.com/foamfactory/shipout/commit/9276d7d164ef505606bf0dfe6e9da6c8190b3b79)]
- ✨ Add the ability to specify a port in the configuration. [[d920465](https://github.com/foamfactory/shipout/commit/d920465587b538893008a9a98f550b2eecb7aa47)]
- 🎉 Initial commit with all basic features. [[9dfbc98](https://github.com/foamfactory/shipout/commit/9dfbc98f2f1b59e88745ba4e9ffee2b4b986b1b4)]

### Bug Fixes

- 🐛 Derive private key from id_rsa in .ssh directory in panic mode. [[3f900a4](https://github.com/foamfactory/shipout/commit/3f900a4515218425d9df2014f6eca6dcc4437daa)]
- 🐛 Fix issue where some packages were in dev mode only. [[e28583f](https://github.com/foamfactory/shipout/commit/e28583fd7acf262ffa57f7012bae0061546a6566)]

### Documentation and Copy Changes

- 📖 Add documentation for &#x60;deploy_user&#x60; configuration variable. [[1857fe3](https://github.com/foamfactory/shipout/commit/1857fe34d3ae8091c5cc8138f2dc62a992ea8e03)]
- 📖 Add documentation on how to use the package. [[6659c5f](https://github.com/foamfactory/shipout/commit/6659c5fa293b1ee806112cd4fd8b4f7fb489c57e)]

### Data Structure and Configuration Changes

- 🔧 Add bin directory to items shipped. [[ba63ef1](https://github.com/foamfactory/shipout/commit/ba63ef125c7750239d2b05a12fcc7abd84000b9d)]

### Dependency Changes

- ⬆️ Upgrade pretty-logger to update underscore. [[ca59061](https://github.com/foamfactory/shipout/commit/ca59061fe4d6aa9a4b9cd05b67015620b392e466)]
- ⬆️ Upgrade dependencies to fix issues with copying via ssh. [[8c7f100](https://github.com/foamfactory/shipout/commit/8c7f10098bc384491625bcc77dfab9ff0cc65bc1)]
- ⬆️ Migrate away from test-sshd to test-sshdng. [[f184c9c](https://github.com/foamfactory/shipout/commit/f184c9cea0163476d808a7a41005b9285ad7483a)]
- ⬆️ Bump path-parse from 1.0.6 to 1.0.7 [[ba184e2](https://github.com/foamfactory/shipout/commit/ba184e2750f72014cc074362ce3a3b5c7b65034f)]
- ⬆️ Prepare 0.1.0 release. [[736b781](https://github.com/foamfactory/shipout/commit/736b781ac93273d3c801a7c5e2ca272369c6beb7)]
- ⬆️ Bump ws from 5.2.2 to 5.2.3 [[0c855a7](https://github.com/foamfactory/shipout/commit/0c855a7ddb7add2c45c1c7834129fc03e2ec3d2b)]
- ⬆️ Bump browserslist from 4.12.0 to 4.16.6 [[256002e](https://github.com/foamfactory/shipout/commit/256002e741735e0bf8930e602571657b9bfb64d0)]
- ⬆️ Bump hosted-git-info from 2.8.8 to 2.8.9 [[9421b3f](https://github.com/foamfactory/shipout/commit/9421b3f6b342cd610cd675de6a10ec9456093ac4)]
- ⬆️ Bump lodash from 4.17.15 to 4.17.21 [[015a1d8](https://github.com/foamfactory/shipout/commit/015a1d8349c145e6d8aca89ccdaec639a9879eeb)]
- ⬆️ Bump y18n from 4.0.0 to 4.0.1 [[18f9fee](https://github.com/foamfactory/shipout/commit/18f9fee23fbe1c68dd641409ff844a06b8cf23a5)]
- ⬆️ Bump version number to next patch number. [[f6e6fab](https://github.com/foamfactory/shipout/commit/f6e6fabc413c05c883de91247f93f6f56fc47db5)]
- ➕ Add dependencies required for testing. [[155fe3b](https://github.com/foamfactory/shipout/commit/155fe3bee998c3fd8fd6186ca8439e050783fdc0)]
- ⬆️ Bump version to 0.0.5 [[e8dab76](https://github.com/foamfactory/shipout/commit/e8dab768434e919bef26ea38f6c5417c45237c7b)]
- ⬆️ Bump version to 0.0.4 [[35733e7](https://github.com/foamfactory/shipout/commit/35733e73382c72e4b914199cd2cd153e3b7789a0)]
- ⬆️ Bump version to 0.0.3 [[32f7a5f](https://github.com/foamfactory/shipout/commit/32f7a5f9af0f1ff50e15c9f3ae513034e0ddc7f9)]

### Refactorings

- ♻️ Make FilePacker clean up its temporary files on termination. [[966545c](https://github.com/foamfactory/shipout/commit/966545c3794159dda38601c28d6ffdc033e5f020)]
- 🔥 Remove packaged directory for test fixture. [[f6d1be1](https://github.com/foamfactory/shipout/commit/f6d1be1e72dded3c576eadf0b06d87317f0977ee)]
- ♻️ Migrate remote work into stages that can be reused. [[47dbe80](https://github.com/foamfactory/shipout/commit/47dbe80370c4ed568d0dd7858369b596ed049ce2)]
- ♻️ Add a cleanup command to the command line interface. [[92364fe](https://github.com/foamfactory/shipout/commit/92364fec94e49f83f84d635ef436c42a426f38b0)]
- ♻️ Refactor index to make it more test-friendly. [[7f823d4](https://github.com/foamfactory/shipout/commit/7f823d48ca418cceba0d41049a23a0e706c5f777)]
- 🔥 Remove commit logic from prepublish script since yarn does it. [[0316c44](https://github.com/foamfactory/shipout/commit/0316c4449cba2af0ef8ed7b2ec161207aa8715bd)]
- 🔥 Remove old &#x27;env&#x27; script. [[931bf57](https://github.com/foamfactory/shipout/commit/931bf57edcf7b5a6370c086e0fa1d476b0e51148)]
- 🔥 Remove unused import. [[d35c5c1](https://github.com/foamfactory/shipout/commit/d35c5c1e6644d0122bbb1871d7485e77e4a679e2)]
- ♻️ Break out packaging of files into a separate class. [[f62d297](https://github.com/foamfactory/shipout/commit/f62d297d8bb0b4df524bbf62b5ff1050710bcb34)]

### Testing and Deployments

- 🚀 Migrate from using ghp to deploy packages to npm. [[6bbd09f](https://github.com/foamfactory/shipout/commit/6bbd09f8c9ffeab856904938f809e53f7ebef8ef)]

### Miscellaneous

-  Merge pull request [#8](https://github.com/foamfactory/shipout/issues/8) from FoamFactory/dependabot/npm_and_yarn/browserslist-4.16.6 [[05187e5](https://github.com/foamfactory/shipout/commit/05187e52e77bfd616f81c9da3851c8cd32553740)]
-  Merge pull request [#9](https://github.com/foamfactory/shipout/issues/9) from FoamFactory/dependabot/npm_and_yarn/ws-5.2.3 [[130c3f7](https://github.com/foamfactory/shipout/commit/130c3f7a851a4e14175f0fb86c3d4580c33586aa)]
-  Merge pull request [#10](https://github.com/foamfactory/shipout/issues/10) from FoamFactory/dependabot/npm_and_yarn/path-parse-1.0.7 [[6462690](https://github.com/foamfactory/shipout/commit/6462690940e990fd380d608b2f42a42f2967e23a)]
-  Merge branch &#x27;jwir3/[#5](https://github.com/foamfactory/shipout/issues/5)-multiple-environments&#x27; into main [[921e8bc](https://github.com/foamfactory/shipout/commit/921e8bc63155144000f508071ac2bb35884176b4)]
-  Merge branch &#x27;jwir3/run-arbitrary-command&#x27; [[89cfeb3](https://github.com/foamfactory/shipout/commit/89cfeb32d6af3a7d2d53938e8b898517947f4504)]
-  Merge branch &#x27;master&#x27; into jwir3/run-arbitrary-command [[1c0537a](https://github.com/foamfactory/shipout/commit/1c0537ab8e0f5a0af883efd6c7c6449e2a3def3d)]
-  Merge pull request [#3](https://github.com/foamfactory/shipout/issues/3) from FoamFactory/dependabot/npm_and_yarn/lodash-4.17.21 [[ad3226f](https://github.com/foamfactory/shipout/commit/ad3226fe2865d450a9f591e31955035dec9c4bfb)]
-  Merge pull request [#4](https://github.com/foamfactory/shipout/issues/4) from FoamFactory/dependabot/npm_and_yarn/hosted-git-info-2.8.9 [[165d782](https://github.com/foamfactory/shipout/commit/165d782392ced1d90a93ada04b06be81d5e1a593)]
-  Merge pull request [#2](https://github.com/foamfactory/shipout/issues/2) from FoamFactory/dependabot/npm_and_yarn/y18n-4.0.1 [[834b64c](https://github.com/foamfactory/shipout/commit/834b64c5651782bd7f19c38c85ecc501a90f0d04)]
-  v0.0.8 [[b012046](https://github.com/foamfactory/shipout/commit/b012046221ceb0f657b8a049dc10011b50c405be)]
-  Merge branch &#x27;jwir3/folder-package-names&#x27; [[6a05634](https://github.com/foamfactory/shipout/commit/6a0563422cc29d2da08f632d6a81375af506059b)]
-  Merge branch &#x27;jwir3/refactor-index&#x27; [[4cc1fe7](https://github.com/foamfactory/shipout/commit/4cc1fe76ffede515998ebc79d090f2bc993b1545)]
-  v0.0.6 [[36aaecd](https://github.com/foamfactory/shipout/commit/36aaecd2c87909e3ffd53ec7a0d5a8256d5cc014)]
- 📦 Make configurations individual per-variable. [[b1a6f43](https://github.com/foamfactory/shipout/commit/b1a6f43d76802645f620616b2060a70f78181906)]
- 📦 Make sure correct files are being distributed. [[7e327c4](https://github.com/foamfactory/shipout/commit/7e327c4161b12b2a2a1933eddb600e73552bd9b4)]
-  v0.0.2 [[83fec4a](https://github.com/foamfactory/shipout/commit/83fec4a2569e4b4d5d8580b823946a53959930b7)]
- 📦 Add prepublish script. [[ef5781b](https://github.com/foamfactory/shipout/commit/ef5781b6633a92d9e05ebccffa9d60a2b7a3cb3f)]
- 📦 Add packaging configuration for github. [[661e498](https://github.com/foamfactory/shipout/commit/661e498e75a6af86fc66f7602b0a23ff19689441)]
-  Initial commit [[1baef8d](https://github.com/foamfactory/shipout/commit/1baef8dc503600c281b2c917425990e674f8eea2)]


