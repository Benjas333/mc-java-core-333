> [!WARNING] Deprecation warning
> 
> The purpose of this library was to fix a lot of spaghetti code from the original library and add new features.
> But around `Apr, 2025` the original repo got its code rewritten.
> Most of the fixes this library has were applied to the original too, so the amount of benefits from this library reduced.
> 
> As an allegory, think of this library as Optifine and the original repo as Minecraft. In the beginning, this library actually worked as a more performant alternative, but the original repo fixed most of its problems.
> 
> Finally, I still think the original repository has design problems and I will probably revive this repo in the future (think of Sodium as an allegory). But, until then, I heavily recommend using the original repo as this one will not have more updates.

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
- [MinecraftLoader](src/Minecraft/Minecraft-Loader.ts)
    - GetArguments()
        1. Fixed not handling errors properly.
        2. Fixed loaderArguments returning duplicated arguments.
        3. Added versionJson optional param in order to make the previous fix work.
- [MinecraftArguments](src/Minecraft/Minecraft-Arguments.ts)
    - GetArguments()
        1. Fixed not handling errors properly.
- [Launch](src/Launch.ts)
    - start()
        1. Fixed not handling errors properly.
        2. Fixed some types.

### From here on it is the same as in the original README.md lol
<br>

**minecraft‑java‑core** is a **NodeJS/TypeScript** solution for launching both vanilla *and* modded Minecraft Java Edition without juggling JSON manifests, assets, libraries or Java runtimes yourself. Think of it as the *core* of an Electron/NW.js/CLI launcher.

---

### Installing

```bash
npm i mc-java-core-333
# or
yarn add mc-java-core-333
```

*Requirements:* Node ≥ 18, TypeScript (only if you import *.ts*), 7‑Zip embedded binary.

---

### Standard Example (ESM)
```ts
import { Launch, Microsoft } from 'mc-java-core-333';

// ⚠️  In production, perform auth **before** initialising the launcher
//     so you can handle refresh / error flows cleanly.
const auth = await Microsoft.auth({
  client_id: '00000000-0000-0000-0000-000000000000',
  type: 'terminal' // 'electron' | 'nwjs'
});

const launcher = new Launch();

launcher.on('progress', p => console.log(`[DL] ${p}%`))
        .on('data', line => process.stdout.write(line))
        .on('close', () => console.log('Game exited.'));

await launcher.launch({
  root: './minecraft',
  authenticator: auth,
  version: '1.20.4',
  loader: { type: 'fabric', build: '0.15.9' },
  memory: { min: '2G', max: '4G' }
});
```

---

## Documentation

### Launch class

| Function | Type    | Description                                                           |
|----------|---------|------------------------------------------------------------------------|
| `launch` | Promise | Launches Minecraft with the given **`LaunchOptions`** (see below).     |

#### LaunchOptions

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `path` | String | Working directory where game files are stored (usually `.minecraft`). | ✔︎ |
| `url` | String \| null | Custom version manifest base URL (only for mirror setups). | — |
| `authenticator` | Object | Microsoft / Mojang / AZauth profile returned by the authenticator. | ✔︎ |
| `timeout` | Integer | Network timeout in **milliseconds** for downloads. | — |
| `version` | String  | `'latest_release'`, `'latest_snapshot'`, `'1.21.1'`. | — |
| `instance` | String \| null | Name of the instance if you manage multiple profiles. | — |
| `detached` | Boolean | Detach the Java process from the launcher. | — |
| `intelEnabledMac` | Boolean | Force Rosetta when running on Apple Silicon. | — |
| `downloadFileMultiple` | Integer | Max parallel downloads. | — |
| `loader.enable` | Boolean | Whether to install a mod‑loader (Forge/Fabric/…). | — |
| `loader.type` | String \| null | `forge`, `neoforge`, `fabric`, `legacyfabric`, `quilt`. | — |
| `loader.build` | String | Loader build tag (e.g. `latest`, `0.15.9`). | — |
| `loader.path` | String | Destination folder for loader files. Defaults to `./loader`. | — |
| `mcp` | String \| null | Path to MCP configuration for legacy mods. | — |
| `verify` | Boolean | Verify SHA‑1 of downloaded files. | — |
| `ignored` | Array | List of files to skip during verification. | — |
| `JVM_ARGS` | Array | Extra JVM arguments. | — |
| `GAME_ARGS` | Array | Extra Minecraft arguments. | — |
| `java.path` | String \| null | Absolute path to Java runtime. | — |
| `java.version` | String \| null | Force a specific Java version (e.g. `17`). | — |
| `java.type` | String | `jre` or `jdk`. | — |
| `screen.width` | Number \| null | Width of game window. | — |
| `screen.height` | Number \| null | Height of game window. | — |
| `screen.fullscreen` | Boolean | Start the game in fullscreen mode. | — |
| `memory.min` | String | Minimum RAM (e.g. `1G`). | ✔︎ |
| `memory.max` | String | Maximum RAM (e.g. `2G`). | ✔︎ |

> **Recommendation:** Start with the minimal set (`authenticator`, `path`, `version`, `memory`) and gradually add overrides only when you need them.

#### Default configuration

Below is the complete **default** `LaunchOptions` object returned by
`minecraft‑java‑core` when you don’t override any field. Use it as a quick
reference for every available parameter and its default value.  
(Parameters marked *nullable* can be left `null`/`undefined` and the library
will figure out sane values.)

```ts
const defaultOptions = {
  url: null,                        // Optional custom manifest URL
  authenticator: null,              // Microsoft/Mojang/AZauth profile
  timeout: 10000,                   // Network timeout in ms
  path: '.Minecraft',               // Root directory (alias: root)
  version: 'latest_release',        // Minecraft version (string or 'latest_…')
  instance: null,                   // Multi‑instance name (optional)
  detached: false,                  // Detach Java process from parent
  intelEnabledMac: false,           // Rosetta toggle for Apple Silicon
  downloadFileMultiple: 5,          // Parallel downloads

  loader: {
    path: './loader',               // Where to install loaders
    type: null,                     // forge | neoforge | fabric | …
    build: 'latest',                // Build number / tag
    enable: false,                  // Whether to install the loader
  },

  mcp: null,                        // Path to MCP config (legacy mods)

  verify: false,                    // SHA‑1 check after download
  ignored: [],                      // Files to skip verification
  JVM_ARGS: [],                     // Extra JVM arguments
  GAME_ARGS: [],                    // Extra game arguments

  java: {
    path: null,                     // Custom JVM path
    version: null,                  // Explicit Java version
    type: 'jre',                    // jre | jdk
  },

  screen: {
    width: null,
    height: null,
    fullscreen: false,
  },

  memory: {
    min: '1G',
    max: '2G',
  },
} as const;
```

> **Note** : Any field you provide when calling `Launch.launch()` will be
> merged on top of these defaults; you rarely need to specify more than
> `authenticator`, `path`, `version` and `memory`.

---

#### Events

| Event Name  | Payload | Description                                                  |
|-------------|---------|--------------------------------------------------------------|
| `data`      | String  | Raw output from the Java process.                            |
| `progress`  | Number  | Global download progress percentage.                         |
| `speed`     | Number  | Current download speed (kB/s).                               |
| `estimated` | Number  | Estimated time remaining (s).                                |
| `extract`   | String  | Name of the file currently being extracted.                  |
| `patch`     | String  | Loader patch currently applied.                              |
| `close`     | void    | Emitted when the Java process exits.                         |
| `error`     | Error   | Something went wrong.                                        |

---

### Authentication *(built‑in)*

* **Microsoft** — OAuth 2 Device Code flow via Xbox Live → XSTS → Minecraft.
* **Mojang** *(legacy)* — classic Yggdrasil endpoint.
* **AZauth** — community Yggdrasil‑compatible server.

> The authenticator returns a profile object that you pass directly to `Launch.launch()`.

---

### Utilities

* **Downloader** — resilient downloader with resume, integrity check & `progress`/`speed` events.
* **Status** — simple TCP ping that returns MOTD, player count & latency.

---

### File structure (simplified)
```
src/
  Authenticator/       Microsoft, Mojang, AZauth flows
  Minecraft/           Version JSON, assets, libraries, args builder
  Minecraft-Loader/    Forge, NeoForge, Fabric, Quilt, … installers
  StatusServer/        Server ping implementation
  utils/               Downloader & helpers
  Launch.ts            Main entry point
assets/                LWJGL native indexes
```

---

### Contributors
See the commit history for a full list. Special thanks to:

* **Luuxis** — original author.
* Community testers & issue reporters.

---

### License
Released under **Creative Commons Attribution‑NonCommercial 4.0 International**.