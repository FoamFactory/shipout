#!/bin/bash
##
# Bump package.json version string for github actions release process.
#
# Inputs:
#  - EXTENDED_TAG: An optional env variable containing a string indicating the
#    build type.
#
# Outputs:
# - package.json: A package.json file with the new version number, but ONLY if
#   the version conforms to the semver specification.

WORKDIR=`pwd`

cat $WORKDIR/.npmrc

# Get the current version, discarding any quotes and any additional tags
CURRENT_VERSION=`jq '.version' $WORKDIR/package.json | awk -F"\"" '{print $2}' | awk -F"-" '{print $1}'`

IN_ARRAY=1
VERSION_ITERATOR=0
VERSIONS=`npm --registry=https://npm.pkg.github.com/ view @foamfactory/aegir versions --json`

while [ $IN_ARRAY -eq 1 ]
do
  NEW_VERSION="$CURRENT_VERSION-$EXTENDED_TAG$VERSION_ITERATOR"

  # Verify that it's semver-certified
  VALID_VERSION=`npx semver $NEW_VERSION`

  if [ -z $VALID_VERSION ]
  then
    echo "Version not valid"
    exit 1
  fi

  # Verify that there isn't already a release with this name
  IN_ARRAY=`node contrib/check-in-array.js "{\"versions\":$VERSIONS}" $NEW_VERSION`
  VERSION_ITERATOR=$((VERSION_ITERATOR+1))
done

if [ $IN_ARRAY -eq 2 ]
then
  echo "There were no versions in the version array"
  exit 1
fi

cp $WORKDIR/package.json $WORKDIR/package.json.old
jq --arg v "$NEW_VERSION" '.version=$v' $WORKDIR/package.json > $WORKDIR/package.json.new
rm $WORKDIR/package.json
mv $WORKDIR/package.json.new $WORKDIR/package.json
cat $WORKDIR/package.json
