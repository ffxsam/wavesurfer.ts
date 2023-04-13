# <img src="https://user-images.githubusercontent.com/381895/226091100-f5567a28-7736-4d37-8f84-e08f297b7e1a.png" alt="logo" height="60" valign="middle" /> wavesurfer.ts

A rewrite of [wavesufer.js](https://github.com/wavesurfer-js/wavesurfer.js) in TypeScript with better performance.

<img alt="screenshot" src="https://user-images.githubusercontent.com/381895/225539680-fc724acd-8657-458e-a558-ff1c6758ba30.png" width="800" />

Try it out:
```
npm install --save wavesurfer.js@alpha
```

Import like this:

```
import WaveSurfer from 'wavesurfer.js'
```

TypeScript types are included in the package, so there's no need to install `@types/wavesurfer.js`.

## Why upgrade to wavesurfer.ts?

wavesurfer.js v7 (aka wavesurfer.ts) brings several improvements:

 * Typed API for better development experience
 * Enhanced decoding and rendering performance
 * New and improved plugins

## Plugins
The "official" plugins have been completely rewritten and enhanced:

 * [Regions](https://wavesurfer-ts.pages.dev/tutorial/#/examples/regions.js) – now also replaces the old Markers plugin
 * [Timeline](https://wavesurfer-ts.pages.dev/tutorial/#/examples/timeline.js) – displays notches and time labels below the waveform
 * [Minimap](https://wavesurfer-ts.pages.dev/tutorial/#/examples/minimap.js) – a small waveform that serves as a scrollbar for the main waveform
 * [Envelope](https://wavesurfer-ts.pages.dev/tutorial/#/examples/envelope.js) – a graphical interface to add fade-in and -out effects and control volume
 * [Record](https://wavesurfer-ts.pages.dev/tutorial/#/examples/record.js) – records audio from the microphone and renders a waveform

## Migrating from v6 and lower

Most options, events, and methods are similar to those in previous versions.

### Notable differences
 * The `backend` option is removed – HTML5 audio (or video) is the only playback mechanism. However, you can still connect wavesurfer to Web Audio via `MediaElementSourceNode`. See this [example](https://wavesurfer-ts.pages.dev/tutorial/#/examples/webaudio.js).
 * The Markers plugin is removed – use the Regions plugin with `startTime` equal to `endTime`
 * Plugins now have different APIs

### Removed methods
 * `getFilters`, `setFilter` – as there's no Web Audio "backend"
 * `cancelAjax` – ajax is replaced by `fetch`
 * `loadBlob` – use `URL.createObjectURL()` to convert a blob to a URL and call `load(url)` instead
 * `un`, `unAll` – the `on` method now returns an unsubscribe function. E.g., `const unsubscribe = wavesurfer.on('ready', () => ...)`
 * `skipForward`, `skipBackward`, `setPlayEnd` – can be implemented using `setTime(time)`
 * `exportPCM` is renamed to `getDecodedData` and doesn't take any params
 * `toggleMute` is now called `setMute(true | false)`
 * `setHeight`, `setWaveColor`, `setCursorColor`, etc. – use `setOptions` with the corresponding params instead. E.g., `wavesurfer.setOptions({ height: 300, waveColor: '#abc' })`

See the complete [documentation of the new API](https://wavesurfer-ts.pages.dev/docs/classes/wavesurfer.WaveSurfer).

## Development

To get started with development, follow these steps:

 1. Install dev dependencies:

```
yarn
```

 2. Start the TypeScript compiler in watch mode and launch an HTTP server:

```
yarn start
```

This command will open http://localhost:9090/tutorial in your browser with live reload, allowing you to see the changes as you develop.

## Feedback

We appreciate your feedback and contributions! Join the conversation and share your thoughts here: https://github.com/wavesurfer-js/wavesurfer.js/discussions/2684

If you encounter any issues or have suggestions for improvements, please don't hesitate to open an issue or submit a pull request on the GitHub repository.

We hope you enjoy using wavesurfer.ts and look forward to hearing about your experiences with the library!
