const fetch = require("node-fetch");
const os = require('os');
const fs = require('fs');
const zip = require('adm-zip');
let minecraftVersionsJson = "https://launchermeta.mojang.com/mc/game/version_manifest_v2.json";
let platform = { linux: "linux", win32: "windows", darwin: "osx" }


module.exports.extractNatives = async function (minecraftVersion, path) {
  if (!fs.existsSync(`${path}/versions/${minecraftVersion}/natives/`)){
    fs.mkdirSync(`${path}/versions/${minecraftVersion}/natives/`, { recursive: true })
  }
  
  let minecraftVersionJson = await fetch(minecraftVersionsJson).then(res => res.json());
  let minecraftVersionUrl;
  minecraftVersionJson.versions.forEach(element => {
    if (element.id == minecraftVersion) {
      minecraftVersionUrl = element.url;
    }
  });
  
  let minecraftNatives = await fetch(minecraftVersionUrl).then(res => res.json());
  minecraftNatives.libraries.forEach(element => {
    if (element.downloads.classifiers) {
      let native = element.downloads.classifiers[`natives-${platform[os.platform()]}`];
      if (os.platform() == "win32" || os.platform() == "linux" || os.platform() == "darwin") {
        if (element.downloads.classifiers[`natives-${platform[os.platform()]}`]) {
          try {
            new zip(`${path}/libraries/${native.path}`).extractAllTo(`${path}/versions/${minecraftVersion}/natives/`, true)
          } catch (err) {}
        }
      } else {
        console.warn(`[!] Unsupported OS: ${os.platform()}`);
      }
    }
  })
}