let versions = JSON.parse(process.argv[2]).versions;
if (!versions) {
  console.log(2);
}

let checking_version = process.argv[3];
if (versions.includes(checking_version)) {
  console.log(1);
} else {
  console.log(0);
}
