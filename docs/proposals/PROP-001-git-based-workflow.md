# Project Outline: Using Git as an Option for Deployment Source
This is a proposal for using git as a source of truth from which to build the
project (#6).

## Open Questions
  - [ ] How are we going to build? If we use `npm`/`yarn` on the remote machine,
        then we have to assume that the remote machine _has_ `npm`/`yarn`, or
        we have to check for it.

## Current Workflow
```mermaid
flowchart TD
  initConfig(Initialize Configuration)
  initFilePacker(Initialize File Packer)
  initRemoteWorker(Initialize Remote Worker)
  packageRemote(Package Locally and Prepare for Transmat)
  makeDirectory(Make Directories on Remote Machine)
  createCurrent(Create Current Link on Remote Machine)
  copyPackage(Copy Package to Remote Machine)
  unpack(Unpack Package on Remote Machine)
  cleanupRemote(Cleanup Temporary Files on Remote Machine)
  cleanupLocal(Cleanup Temporary Files Locally)

  initConfig --> initFilePacker
  initFilePacker --> initRemoteWorker
  initRemoteWorker --> packageRemote
  packageRemote --> makeDirectory
  makeDirectory --> createCurrent
  createCurrent --> copyPackage
  copyPackage --> unpack
  unpack --> cleanupRemote
  cleanupRemote --> cleanupLocal
```

## Proposed New Workflow

```mermaid
flowchart TD
  initConfig(Initialize Configuration)
  initFilePacker(Initialize File Packer)
  initRemoteWorker(Initialize Remote Worker)
  makeDirectory(Make Directories on Remote Machine)
  packageRemote(Package Locally and Prepare for Transmat)
  createCurrent(Create Current Link on Remote Machine)
  copyPackage(Copy Package to Remote Machine)
  unpack(Unpack Package on Remote Machine)
  cleanupRemote(Cleanup Temporary Files on Remote Machine)
  cleanupLocal(Cleanup Temporary Files Locally)
  usingGit{Using Git Repository}
  cloneGitBranch(Clone Git Branch on Remote Machine)
  checkBuildRequirements(Check for Necessary Build Requirements on the Remote Machine)
  buildRemote(Perform Any Necessary Build Steps on Remote Machine)

  initConfig --> initRemoteWorker
  initRemoteWorker --> makeDirectory
  makeDirectory --> usingGit
  usingGit --> |No| initFilePacker
  usingGit --> |Yes| cloneGitBranch
  cloneGitBranch --> checkBuildRequirements
  checkBuildRequirements --> buildRemote
  buildRemote --> createCurrent
  initFilePacker --> packageRemote
  packageRemote --> copyPackage
  copyPackage --> unpack
  unpack --> createCurrent
  createCurrent --> cleanupRemote
  cleanupRemote --> cleanupLocal


  subgraph legend [Legend]
    direction LR
    proposed[Proposed New Stages]
    reordered[Existing Stages Reordered]
  end

  classDef newStage fill:#87e07d,color:#000;
  classDef reorderedStage fill:#ddb8fc,color:#000;
  class proposed,usingGit,cloneGitBranch,buildRemote,checkBuildRequirements newStage;
  class reordered,createCurrent,unpack,copyPackage reorderedStage;
```

### Proposed New Workflow Requirements

  - If `files` is defined within the `package.json`, it should behave just as it
    did in prior releases.
    - If a `branch` is defined in the `shipout` configuration, then a warning
      will be issued in debug/verbose mode and the config value will be ignored.
  - If `repository` is defined in the configuration, then the new workflow will
    be used.
    - If a `branch` is not defined in the `shipout` configuration for the given
      environment, then `main` will be used.
    - If a `branch` _is_ defined in the `shipout` configuration for the given
      environment, then that branch will be used instead.
