# mc-java-core-333
An autistic fork because I didn't liked the og code.
(For now, just redoing the Microsoft module, maybe I will redo the whole code later).

---
## Advantages :dizzy:
> [!NOTE]
> Most extra parameters use the original minecraft-java-core defaults, so migrating to mc-java-core-333 is seamless and compatible. To get the highest possible optimization offered by this fork check the full list of improvements.

### Improved classes until now:
- [Microsoft](src/Authenticator/Microsoft.ts)
    1. Implemented switch statement.
    2. Removed unnecessary logic.
    3. Added more intuitive errorTypes.
    4. XboxAccount value is now optional (a whole auth request just for 3 vars (?)).
        1. **Added doIncludeXboxAccount param (default: true).**
    5. xsts login now includes better error messages in case of XErr code.
    6. xsts login now returns error properly in case of XErr code.
    - getAuth()
        1. **Added doRemoveCookies param (default: true).**
    7. Added fetchJSON function with improved logic (place-holder until I update the whole fork [11 commits behind at the moment of writing]).
        1. Added HTTP 429 error handler.

### Improved functions until now:
- [ForgeMC](src/Minecraft-Loader/loader/forge/forge.ts)
    - downloadLibraries()
        1. Removed unnecessary logic.
        2. Added better check event emitter feedback.
        3. Priority is given to downloading from the official links first, if provided, and then from the mirrors (instead of the other way around).
        4. Fixed not reaching on error event.
        5. Re-downloading for corrupted/incomplete libraries.
    - patchForge()
        1. General improvements.
        2. Fixed not reaching on error event.
- [FabricMC](src/Minecraft-Loader/loader/fabric/fabric.ts)
    - downloadJson()
        1. ~~Forced fabric metadata request to use IPv4 (to prevent ETIMEDOUT in some clients).~~ **Discarded**
        2. Added retry metadata request with mirrors.
- [Loader](src/Minecraft-Loader/index.ts)
    - install()
        1. Improved if conditionals with just an object.
    - forge()
        1. General improvements.
- [download](src/utils/Downloader.ts)
    1. ~~Added IPv4Agent constant here so it is reusable in other loaders.~~ **Discarded**
    - checkMirror()
        1. Minor changes.
        2. Added check if response.size is an actual number.
- [forgePatcher](src/Minecraft-Loader/patcher.ts)
    - patcher()
        1. General improvements.
        2. Fixed not emitting error event when failing to read jar manifest.
    - check()
        1. Minor changes.
    - setArgument()
        1. Minor changes.
    - computePath()
        1. Minor changes.
    - readJarManifest()
        1. Minor changes.
- [src\utils\Index.ts](src/utils/Index.ts)
    - getFileFromArchive()
        1. Improved info in case of error.
    - skipLibrary()
        1. Minor changes.
    - loader()
        1. Implemented switch statement.

### From here on it is the same as in the original README.md lol
<br>

# Install Client

## Installation :package:
```npm
npm i mc-java-core-333
```

## Usage :triangular_flag_on_post:
Require library
```javascript
const { Launch, Mojang } = require('mc-java-core-333');
```

## Launch :rocket:
### Options
```javascript
const { Mojang, Launch } = require('mc-java-core-333');
const launch = new Launch();

async function main() {
    let opt = {
        url: 'https://launcher.luuxis.fr/files/?instance=PokeMoonX',
        authenticator: await Mojang.login('Benjas333'),
        timeout: 10000,
        path: './Minecraft',
        instance: 'PokeMoonX',
        version: '1.20.4',
        detached: false,
        intelEnabledMac: true,
        downloadFileMultiple: 30,

        loader: {
            path: '',
            type: 'forge',
            build: 'latest',
            enable: true
        },

        verify: true,
        ignored: [
            'config',
            'essential',
            'logs',
            'resourcepacks',
            'saves',
            'screenshots',
            'shaderpacks',
            'W-OVERFLOW',
            'options.txt',
            'optionsof.txt'
        ],

        JVM_ARGS: [],
        GAME_ARGS: [],

        java: {
            path: null,
            version: null,
            type: 'jre',
        },

        screen: {
            width: 1500,
            height: 900
        },

        memory: {
            min: '4G',
            max: '6G'
        }
    }

    await launch.Launch(opt);

    launch.on('extract', extract => {
        console.log(extract);
    });

    launch.on('progress', (progress, size, element) => {
        console.log(`Downloading ${element} ${Math.round((progress / size) * 100)}%`);
    });

    launch.on('check', (progress, size, element) => {
        console.log(`Checking ${element} ${Math.round((progress / size) * 100)}%`);
    });

    launch.on('estimated', (time) => {
        let hours = Math.floor(time / 3600);
        let minutes = Math.floor((time - hours * 3600) / 60);
        let seconds = Math.floor(time - hours * 3600 - minutes * 60);
        console.log(`${hours}h ${minutes}m ${seconds}s`);
    })

    launch.on('speed', (speed) => {
        console.log(`${(speed / 1067008).toFixed(2)} Mb/s`)
    })

    launch.on('patch', patch => {
        console.log(patch);
    });

    launch.on('data', (e) => {
        console.log(e);
    })

    launch.on('close', code => {
        console.log(code);
    });

    launch.on('error', err => {
        console.log(err);
    });
}

main()
```
