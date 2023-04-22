import BasePlugin, { type WaveSurferPluginParams } from '../base-plugin.js'
import WaveSurfer, { type WaveSurferOptions } from '../wavesurfer.js'

export type MinimapPluginOptions = {
  overlayColor?: string
  insertPosition?: InsertPosition
} & WaveSurferOptions

const defaultOptions = {
  height: 50,
  overlayColor: 'rgba(100, 100, 100, 0.1)',
  insertPosition: 'afterend',
}

export type MinimapPluginEvents = {
  ready: void
  interaction: void
}

class MinimapPlugin extends BasePlugin<MinimapPluginEvents, MinimapPluginOptions> {
  protected options: MinimapPluginOptions & typeof defaultOptions
  private minimapWrapper: HTMLElement
  private miniWavesurfer: WaveSurfer | null = null
  private overlay: HTMLElement

  constructor(options: MinimapPluginOptions) {
    super(options)
    this.options = Object.assign({}, defaultOptions, options)

    this.minimapWrapper = this.initMinimapWrapper()
    this.overlay = this.initOverlay()
  }

  public static create(options: MinimapPluginOptions) {
    return new MinimapPlugin(options)
  }

  init(params: WaveSurferPluginParams) {
    super.init(params)

    if (!this.wavesurfer) {
      throw Error('WaveSurfer is not initialized')
    }

    if (this.options.container) {
      let container: HTMLElement | null = null
      if (typeof this.options.container === 'string') {
        container = document.querySelector(this.options.container) as HTMLElement
      } else if (this.options.container instanceof HTMLElement) {
        container = this.options.container
      }
      container?.appendChild(this.minimapWrapper)
    } else {
      this.container?.insertAdjacentElement(this.options.insertPosition, this.minimapWrapper)
    }

    this.subscriptions.push(
      this.wavesurfer.on('decode', () => {
        this.initMinimap()
      }),
    )
  }

  private initMinimapWrapper(): HTMLElement {
    const div = document.createElement('div')
    div.style.position = 'relative'
    return div
  }

  private initOverlay(): HTMLElement {
    const div = document.createElement('div')
    div.setAttribute('style', 'position: absolute; z-index: 2; left: 0; top: 0; bottom: 0;')
    div.style.backgroundColor = this.options.overlayColor
    this.minimapWrapper.appendChild(div)
    return div
  }

  private initMinimap() {
    if (!this.wavesurfer || !this.wrapper) return

    const data = this.wavesurfer.getDecodedData()
    const media = this.wavesurfer.getMediaElement()
    if (!data || !media) return

    this.miniWavesurfer = WaveSurfer.create({
      ...this.options,
      container: this.minimapWrapper,
      minPxPerSec: 1,
      fillParent: true,
      media,
      peaks: [data.getChannelData(0)],
      duration: data.duration,
    })

    const overlayWidth = Math.round((this.minimapWrapper.clientWidth / this.wrapper.clientWidth) * 100)
    this.overlay.style.width = `${overlayWidth}%`

    this.subscriptions.push(
      this.wavesurfer.on('timeupdate', ({ currentTime }) => {
        const offset = Math.max(
          0,
          Math.min((currentTime / data.duration) * 100 - overlayWidth / 2, 100 - overlayWidth),
        ).toFixed(2)
        this.overlay.style.left = `${offset}%`
      }),
    )

    this.subscriptions.push(
      this.miniWavesurfer.on('interaction', () => {
        if (this.wavesurfer && this.miniWavesurfer) {
          this.wavesurfer.setTime(this.miniWavesurfer.getCurrentTime())
        }
        if (this.container) {
          this.container.scrollLeft =
            (this.minimapWrapper.scrollLeft / this.minimapWrapper.scrollWidth) * this.container.scrollWidth
        }
        this.emit('interaction')
      }),

      this.miniWavesurfer.on('ready', () => {
        this.emit('ready')
      }),
    )
  }

  /** Unmount */
  public destroy() {
    this.miniWavesurfer?.destroy()
    this.minimapWrapper.remove()
    super.destroy()
  }
}

export default MinimapPlugin
