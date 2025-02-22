describe('WaveSurfer', () => {
  const mockUrl = '/examples/audio.wav'

  beforeEach((done) => {
    cy.visit('cypress/e2e/index.html')

    cy.window().its('wavesurfer').should('exist')

    cy.window().then((win) => {
      const waitForReady = new Promise((resolve) => {
        win.wavesurfer.once('ready', () => resolve())
      })

      cy.wrap(waitForReady).then(done)
    })
  })

  it('should instantiate WaveSurfer without errors', () => {
    cy.window().its('wavesurfer').should('be.an', 'object')
  })

  it('should load an audio file without errors', () => {
    cy.window().then((win) => {
      cy.spy(win.wavesurfer, 'load').as('load')
      win.wavesurfer.load(mockUrl)
      cy.get('@load').should('have.been.calledWith', mockUrl)
    })
  })

  it('should play and pause audio', () => {
    cy.window().then((win) => {
      expect(win.wavesurfer.getCurrentTime()).to.equal(0)

      win.wavesurfer.play()

      cy.wait(1000).then(() => {
        expect(win.wavesurfer.isPlaying()).to.be.true

        win.wavesurfer.pause()

        expect(win.wavesurfer.getCurrentTime()).to.be.greaterThan(0)
      })
    })
  })

  it('should set and get volume without errors', () => {
    cy.window().then((win) => {
      win.wavesurfer.setVolume(0.5)
      expect(win.wavesurfer.getVolume()).to.equal(0.5)
    })
  })

  it('should set and get muted state without errors', () => {
    cy.window().then((win) => {
      win.wavesurfer.setMuted(true)
      expect(win.wavesurfer.getMuted()).to.be.true
    })
  })

  it('should set and get playback rate without errors', () => {
    cy.window().then((win) => {
      win.wavesurfer.setPlaybackRate(1.5)
      expect(win.wavesurfer.getPlaybackRate()).to.equal(1.5)
    })
  })

  it('should seek to a time in seconds', () => {
    cy.window().then((win) => {
      win.wavesurfer.setTime(10.1)
      expect(win.wavesurfer.getCurrentTime()).to.equal(10.1)
      expect(win.wavesurfer.getScroll()).to.equal(0) // no scroll
    })
  })

  it('should set the zoom level', () => {
    cy.window().then((win) => {
      const initialWidth = win.wavesurfer.getWrapper().clientWidth

      win.wavesurfer.zoom(200)
      const zoomedWidth = win.wavesurfer.renderer.getWrapper().clientWidth
      expect(zoomedWidth).to.be.greaterThan(initialWidth)
      win.wavesurfer.zoom(600)
      const newWidth = win.wavesurfer.getWrapper().clientWidth

      expect(Math.round(newWidth / zoomedWidth)).to.equal(3)
    })
  })

  it('should scroll on seek if zoomed in', () => {
    cy.window().then((win) => {
      const initialWidth = win.wavesurfer.getWrapper().clientWidth
      win.wavesurfer.zoom(300)
      const zoomedWidth = win.wavesurfer.getWrapper().clientWidth
      win.wavesurfer.zoom(600)
      const newWidth = win.wavesurfer.getWrapper().clientWidth

      expect(Math.round(newWidth / zoomedWidth)).to.equal(2)

      win.wavesurfer.setTime(20)

      cy.wait(1000).then(() => {
        expect(win.wavesurfer.getScroll()).to.be.greaterThan(100)
      })
    })
  })

  it('should export decoded audio data', () => {
    cy.window().then((win) => {
      const data = win.wavesurfer.getDecodedData()

      expect(data.getChannelData).to.be.a('function')
      expect(data.length).to.equal(174191)
      expect(data.sampleRate).to.equal(8000)
      expect(data.duration.toFixed(2)).to.equal('21.77')
    })
  })

  it('should not fill the container if fillParent is false', () => {
    cy.window().then((win) => {
      win.wavesurfer.setOptions({
        fillParent: false,
        minPxPerSec: 10,
      })
      expect(win.document.querySelector('#waveform').clientWidth).to.greaterThan(
        win.wavesurfer.getWrapper().clientWidth,
      )
    })
  })

  it('should destroy wavesurfer', () => {
    cy.window().then((win) => {
      win.wavesurfer.destroy()
    })
  })
})
