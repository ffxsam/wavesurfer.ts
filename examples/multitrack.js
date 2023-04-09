// Multi-track mixer

// Import wavesurfer and plugins
import Multitrack from 'wavesurfer.js/dist/plugins/multitrack.js'

// If you prefer a CDN, use this instead:
/*
  <script>
    window.WaveSurfer = {}
  </script>
  <script src="https://unpkg.com/wavesurfer.js@alpha/dist/wavesurfer.Multitrack.min.js"></script>
  <script>
    const Multitrack = window.WaveSurfer.Multitrack
  </script>
*/

// Call Multitrack.create to initialize the multitrack mixer
// Pass the tracks array and WaveSurfer options with a container element
const multitrack = Multitrack.create(
  [
    {
      id: 0,
    },
    {
      id: 1,
      draggable: false,
      startPosition: 10, // start time relative to the entire multitrack
      url: '/examples/nasa.mp4',
      fadeInEnd: 5,
      fadeOutStart: 75,
      options: {
        waveColor: 'hsl(46, 87%, 49%)',
        progressColor: 'hsl(46, 87%, 20%)',
      },
      regions: [
        {
          startTime: 0, // intro start
          endTime: 16, // end of intro
          label: 'Intro',
          color: 'rgba(200, 0, 0, 0.25)',
        },
      ],
      markers: [
        {
          time: 21,
          label: 'M1',
          color: 'hsla(600, 100%, 30%, 0.5)',
        },
        {
          time: 22.7,
          label: 'M2',
          color: 'hsla(400, 100%, 30%, 0.5)',
        },
        {
          time: 24,
          label: 'M3',
          color: 'hsla(200, 50%, 70%, 0.5)',
        },
        {
          time: 27,
          label: 'M4',
          color: 'hsla(200, 50%, 70%, 0.5)',
        },
      ],
      // peaks: [ [ 0, 0, 2.567, -2.454, 10.5645 ] ], // optional pre-generated peaks
    },
    {
      id: 2,
      draggable: true,
      startPosition: 1,
      startCue: 2.1,
      endCue: 20,
      fadeInEnd: 8,
      fadeOutStart: 11,
      options: {
        waveColor: 'hsl(161, 87%, 49%)',
        progressColor: 'hsl(161, 87%, 20%)',
      },
      url: '/examples/audio.wav',
    },
  ],
  {
    container: document.body, // required!
    minPxPerSec: 10, // zoom level
    rightButtonDrag: true, // drag tracks with the right mouse button
    cursorWidth: 2,
    cursorColor: '#D72F21',
    trackBackground: '#2D2D2D',
    trackBorderColor: '#7C7C7C',
  },
)

// Events
multitrack.on('start-position-change', ({ id, startPosition }) => {
  console.log(`Track ${id} start position updated to ${startPosition}`)
})
multitrack.on('start-cue-change', ({ id, startCue }) => {
  console.log(`Track ${id} start cue updated to ${startCue}`)
})
multitrack.on('end-cue-change', ({ id, endCue }) => {
  console.log(`Track ${id} end cue updated to ${endCue}`)
})
multitrack.on('volume-change', ({ id, volume }) => {
  console.log(`Track ${id} volume updated to ${volume}`)
})
multitrack.on('fade-in-change', ({ id, fadeInEnd }) => {
  console.log(`Track ${id} fade-in updated to ${fadeInEnd}`)
})
multitrack.on('fade-out-change', ({ id, fadeOutStart }) => {
  console.log(`Track ${id} fade-out updated to ${fadeOutStart}`)
})

// Page styles
document.body.style.background = '#161313'
document.body.style.color = '#fff'

/*
<html>
  <label>
    Zoom: <input type="range" min="10" max="100" value="10" />
  </label>

  <div style="margin: 1em 0 2em;">
    <button id="play">Play</button>
    <button id="forward">Forward 30s</button>
    <button id="backward">Back 30s</button>
  </div>
</html>
*/

// Play/pause button
const button = document.querySelector('#play')
button.onclick = () => {
  multitrack.isPlaying() ? multitrack.pause() : multitrack.play()
  button.textContent = multitrack.isPlaying() ? 'Pause' : 'Play'
}

// Forward/back buttons
const forward = document.querySelector('#forward')
forward.onclick = () => {
  multitrack.seekTo(multitrack.getCurrentTime() + 30)
}
const backward = document.querySelector('#backward')
backward.onclick = () => {
  multitrack.seekTo(multitrack.getCurrentTime() - 30)
}

// Zoom
const slider = document.querySelector('input[type="range"]')
slider.oninput = () => {
  multitrack.zoom(slider.valueAsNumber)
}

// Destroy all wavesurfer instances on unmount
// This should be called before calling initMultiTrack again to properly clean up
window.onbeforeunload = () => {
  multitrack.destroy()
}
