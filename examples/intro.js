// Hi there!
// This is a set of live examples of how to use wavesufer.js.
// You can edit the code and see the result live.

// We'll start with the very basics.

// First, import the library.
import WaveSurfer from '../dist/wavesurfer.js'

// You can also load it from a CDN as a global variable:
// <script src="https://unpkg.com/wavesurfer.js"></script>

// Create a wavesurfer instance and pass different parameters
const wavesurfer = WaveSurfer.create({
  // The container is where the waveform will be drawn.
  // This is the only required parameter.
  // We're passing `document.body` here, but you can pass any DOM element or CSS selector.
  container: document.body,

  // The main waveform.
  // It can be any CSS color, e.g. hex colors or rgba, or even a Canvas gradient.
  waveColor: 'rgb(200, 0, 200)',

  // This is color of the progress mask
  progressColor: 'rgb(100, 0, 100)',

  // Finally, pass the URL of an audio file
  // Note: this URL has to support CORS
  url: '/examples/audio.wav',
})

// Now, let's add some interaction. We'll add a play/pause button.

// First, create a button element
const button = document.createElement('button')
button.textContent = 'Play'
button.style.margin = '1em 0'
document.body.appendChild(button)

// Next, let's change the text on the button when the audio is playing
wavesurfer.on('play', () => {
  button.textContent = 'Pause'
})
// And when it's paused
wavesurfer.on('pause', () => {
  button.textContent = 'Play'
})

// Subscribe to wavesurfer's `canplay` event to know when we can interact with the player
wavesurfer.on('decode', () => {
  // Finally, inside the callback, we'll add a click listener to the button.
  button.addEventListener('click', () => {
    if (wavesurfer.isPlaying()) {
      wavesurfer.pause()
    } else {
      wavesurfer.play()
    }
  })
})
