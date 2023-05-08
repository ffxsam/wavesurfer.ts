/**
 * Regions are visual overlays on the waveform that can be used to mark segments of audio.
 * Regions can be clicked on, dragged and resized.
 * You can set the color and content of each region, as well as their HTML content.
 */

import BasePlugin from '../base-plugin.js'
import EventEmitter from '../event-emitter.js'

export type RegionsPluginOptions = undefined

export type RegionsPluginEvents = {
  'region-created': [region: Region]
  'region-updated': [region: Region]
  'region-clicked': [region: Region, e: MouseEvent]
}

export type RegionEvents = {
  // Before the region is removed
  remove: []
  // When the region's parameters are being updated
  update: []
  // When dragging or resizing is finished
  'update-end': []
  // On play
  play: []
  // On mouse click
  click: [event: MouseEvent]
  // Double click
  dblclick: [event: MouseEvent]
  // Mouse over
  over: [event: MouseEvent]
  // Mouse leave
  leave: [event: MouseEvent]
}

export type RegionParams = {
  // The id of the region
  id?: string
  // The start position of the region (in seconds)
  start: number
  // The end position of the region (in seconds)
  end?: number
  // Allow/dissallow dragging the region
  drag?: boolean
  // Allow/dissallow resizing the region
  resize?: boolean
  // The color of the region (CSS color)
  color?: string
  // Content string
  content?: string | HTMLElement
}

function makeDraggable(
  element: HTMLElement | null | undefined,
  onStart: (x: number) => void,
  onMove: (dx: number) => void,
  onEnd: () => void,
): () => void {
  if (!element) return () => undefined

  const minDx = 5
  let sumDx = 0
  let preventClickPropagation = false

  const onClick = (e: MouseEvent) => {
    preventClickPropagation && e.stopPropagation()
  }

  const onMouseDown = (e: MouseEvent) => {
    e.stopPropagation()
    let x = e.clientX

    onStart(x)

    const onMouseMove = (e: MouseEvent) => {
      const newX = e.clientX
      const dx = newX - x
      sumDx += dx
      x = newX

      if (Math.abs(sumDx) >= minDx) {
        if (!preventClickPropagation) {
          preventClickPropagation = true
          onMove(sumDx)
        } else {
          onMove(dx)
        }
      }
    }

    const onMouseUp = () => {
      sumDx = 0
      onEnd()
      setTimeout(() => (preventClickPropagation = false), 10)

      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  element.addEventListener('click', onClick)
  element.addEventListener('mousedown', onMouseDown)

  return () => {
    element.removeEventListener('click', onClick)
    element.removeEventListener('mousedown', onMouseDown)
  }
}

export class Region extends EventEmitter<RegionEvents> {
  public element: HTMLElement
  public id: string
  public start: number
  public end: number
  public drag: boolean
  public resize: boolean
  public color: string
  public content?: HTMLElement

  constructor(params: RegionParams, private totalDuration: number) {
    super()

    this.id = params.id || Math.random().toString(32).slice(2)
    this.start = params.start
    this.end = params.end ?? params.start
    this.drag = params.drag ?? true
    this.resize = params.resize ?? true
    this.color = params.color ?? 'rgba(0, 0, 0, 0.1)'
    this.element = this.initElement(params.content)
    this.renderPosition()
    this.initMouseEvents()
  }

  private initElement(content?: string | HTMLElement) {
    const element = document.createElement('div')
    const isMarker = this.start === this.end

    element.id = this.id

    element.setAttribute(
      'style',
      `
      position: absolute;
      height: 100%;
      background-color: ${isMarker ? 'none' : this.color};
      border-left: ${isMarker ? '2px solid ' + this.color : 'none'};
      border-radius: 2px;
      box-sizing: border-box;
      transition: background-color 0.2s ease;
      cursor: ${this.drag ? 'grab' : 'default'};
      pointer-events: all;
      padding: 0.2em ${isMarker ? 0.2 : 0.4}em;
      pointer-events: all;
    `,
    )

    // Init content
    if (content) {
      if (typeof content === 'string') {
        this.content = document.createElement('div')
        this.content.textContent = content
      } else {
        this.content = content
      }
      element.appendChild(this.content)
    }

    // Add resize handles
    if (!isMarker) {
      const leftHandle = document.createElement('div')
      leftHandle.setAttribute('data-resize', 'left')
      leftHandle.setAttribute(
        'style',
        `
        position: absolute;
        z-index: 2;
        width: 6px;
        height: 100%;
        top: 0;
        left: 0;
        border-left: 2px solid rgba(0, 0, 0, 0.5);
        border-radius: 2px 0 0 2px;
        cursor: ${this.resize ? 'ew-resize' : 'default'};
        word-break: keep-all;
      `,
      )
      const rightHandle = leftHandle.cloneNode() as HTMLElement
      rightHandle.setAttribute('data-resize', 'right')
      rightHandle.style.left = ''
      rightHandle.style.right = '0'
      rightHandle.style.borderRight = rightHandle.style.borderLeft
      rightHandle.style.borderLeft = ''
      rightHandle.style.borderRadius = '0 2px 2px 0'

      element.appendChild(leftHandle)
      element.appendChild(rightHandle)
    }

    return element
  }

  private renderPosition() {
    const start = this.start / this.totalDuration
    const end = this.end / this.totalDuration
    this.element.style.left = `${start * 100}%`
    this.element.style.width = `${(end - start) * 100}%`
  }

  private initMouseEvents() {
    const { element } = this

    element.addEventListener('click', (e) => this.emit('click', e))
    element.addEventListener('mouseenter', (e) => this.emit('over', e))
    element.addEventListener('mouseleave', (e) => this.emit('leave', e))
    element.addEventListener('dblclick', (e) => this.emit('dblclick', e))

    // Drag
    makeDraggable(
      element,
      () => this.onStartMoving(),
      (dx) => this.onMove(dx),
      () => this.onEndMoving(),
    )

    // Resize
    makeDraggable(
      element.querySelector('[data-resize="left"]') as HTMLElement,
      () => null,
      (dx) => this.onResize(dx, 'start'),
      () => this.onEndResizing(),
    )
    makeDraggable(
      element.querySelector('[data-resize="right"]') as HTMLElement,
      () => null,
      (dx) => this.onResize(dx, 'end'),
      () => this.onEndResizing(),
    )
  }

  private onStartMoving() {
    if (!this.drag) return
    this.element.style.cursor = 'grabbing'
  }

  private onEndMoving() {
    if (!this.drag) return
    this.element.style.cursor = 'grab'
    this.emit('update-end')
  }

  private onUpdate(dx: number, sides: Array<'start' | 'end'>) {
    if (!this.element.parentElement) return
    const deltaSeconds = (dx / this.element.parentElement.clientWidth) * this.totalDuration
    sides.forEach((side) => {
      this[side] += deltaSeconds
      if (side === 'start') {
        this.start = Math.max(0, Math.min(this.start, this.end))
      } else {
        this.end = Math.max(this.start, Math.min(this.end, this.totalDuration))
      }
    })

    this.renderPosition()
    this.emit('update')
  }

  private onMove(dx: number) {
    if (!this.drag) return
    this.onUpdate(dx, ['start', 'end'])
  }

  private onResize(dx: number, side: 'start' | 'end') {
    if (!this.resize) return
    this.onUpdate(dx, [side])
  }

  private onEndResizing() {
    if (!this.resize) return
    this.emit('update-end')
  }

  public _setTotalDuration(totalDuration: number) {
    this.totalDuration = totalDuration
    this.renderPosition()
  }

  /** Play the region from start to end */
  public play() {
    this.emit('play')
  }

  /** Update the region's options */
  public setOptions(options: { color?: string; drag?: boolean; resize?: boolean; start?: number; end?: number }) {
    if (options.color) {
      this.color = options.color
      this.element.style.backgroundColor = this.color
    }
    if (options.drag !== undefined) {
      this.drag = options.drag
      this.element.style.cursor = this.drag ? 'grab' : 'default'
    }
    if (options.resize !== undefined) {
      this.resize = options.resize
      this.element.querySelectorAll('[data-resize]').forEach((handle) => {
        ;(handle as HTMLElement).style.cursor = this.resize ? 'ew-resize' : 'default'
      })
    }
    if (options.start !== undefined || options.end !== undefined) {
      this.start = options.start ?? this.start
      this.end = options.end ?? this.end
      this.renderPosition()
    }
  }

  /** Remove the region */
  public remove() {
    this.emit('remove')
    this.element.remove()
    // This violates the type but we want to clean up the DOM reference
    // w/o having to have a nullable type of the element
    this.element = null as unknown as HTMLElement
  }
}

class RegionsPlugin extends BasePlugin<RegionsPluginEvents, RegionsPluginOptions> {
  private regions: Region[] = []
  private regionsContainer: HTMLElement

  /** Create an instance of RegionsPlugin */
  constructor(options?: RegionsPluginOptions) {
    super(options)
    this.regionsContainer = this.initRegionsContainer()
  }

  /** Create an instance of RegionsPlugin */
  public static create(options?: RegionsPluginOptions) {
    return new RegionsPlugin(options)
  }

  /** Called by wavesurfer, don't call manually */
  onInit() {
    if (!this.wavesurfer) {
      throw Error('WaveSurfer is not initialized')
    }
    this.wavesurfer.getWrapper().appendChild(this.regionsContainer)
  }

  private initRegionsContainer(): HTMLElement {
    const div = document.createElement('div')
    div.setAttribute(
      'style',
      `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 3;
      pointer-events: none;
    `,
    )
    return div
  }

  /** Get all created regions */
  public getRegions(): Region[] {
    return this.regions
  }

  private avoidOverlapping(region: Region) {
    if (!region.content) return

    // Check that the label doesn't overlap with other labels
    // If it does, push it down until it doesn't
    const div = region.content as HTMLElement
    const labelLeft = div.getBoundingClientRect().left
    const labelWidth = region.element.scrollWidth

    const overlap = this.regions
      .filter((reg) => {
        if (reg === region || !reg.content) return false
        const left = reg.content.getBoundingClientRect().left
        const width = reg.element.scrollWidth
        return labelLeft < left + width && left < labelLeft + labelWidth
      })
      .map((reg) => reg.content?.getBoundingClientRect().height || 0)
      .reduce((sum, val) => sum + val, 0)

    div.style.marginTop = `${overlap}px`
  }

  private saveRegion(region: Region) {
    this.regionsContainer.appendChild(region.element)
    this.avoidOverlapping(region)
    this.regions.push(region)
    this.emit('region-created', region)

    const regionSubscriptions = [
      region.on('update-end', () => {
        this.avoidOverlapping(region)
        this.emit('region-updated', region)
      }),

      region.on('play', () => {
        this.wavesurfer?.play()
        this.wavesurfer?.setTime(region.start)
      }),

      region.on('click', (e) => {
        this.emit('region-clicked', region, e)
      }),

      // Remove the region from the list when it's removed
      region.once('remove', () => {
        regionSubscriptions.forEach((unsubscribe) => unsubscribe())
        this.regions = this.regions.filter((reg) => reg !== region)
      }),
    ]

    this.subscriptions.push(...regionSubscriptions)
  }

  /** Create a region with given parameters */
  public addRegion(options: RegionParams): Region {
    if (!this.wavesurfer) {
      throw Error('WaveSurfer is not initialized')
    }

    const duration = this.wavesurfer.getDuration()
    const region = new Region(options, duration)

    if (!duration) {
      this.subscriptions.push(
        this.wavesurfer.once('canplay', (duration) => {
          region._setTotalDuration(duration)
          this.saveRegion(region)
        }),
      )
    } else {
      this.saveRegion(region)
    }

    return region
  }

  /**
   * Enable creation of regions by dragging on an empty space on the waveform.
   * Returns a function to disable the drag selection.
   */
  public enableDragSelection(options: RegionParams): () => void {
    const wrapper = this.wavesurfer?.getWrapper()
    if (!wrapper) return () => undefined

    let region: Region | null = null
    let startX = 0
    let sumDx = 0

    return makeDraggable(
      wrapper,

      // On mousedown
      (x) => (startX = x),

      // On mousemove
      (dx) => {
        if (!this.wavesurfer) return

        if (!region) {
          const duration = this.wavesurfer.getDuration()
          const box = wrapper.getBoundingClientRect()
          let start = ((startX - box.left) / box.width) * duration
          let end = ((startX + dx - box.left) / box.width) * duration
          if (start > end) [start, end] = [end, start]

          region = new Region(
            {
              ...options,
              start,
              end,
            },
            duration,
          )

          this.regionsContainer.appendChild(region.element)
        }

        sumDx += dx
        if (region) {
          const privateRegion = region as unknown as { onUpdate: (dx: number, sides: Array<'start' | 'end'>) => void }
          privateRegion.onUpdate(dx, [sumDx > 0 ? 'end' : 'start'])
        }
      },

      // On mouseup
      () => {
        if (region) {
          this.saveRegion(region)
          region = null
          sumDx = 0

          // Prevent a click event on the waveform
          if (this.wavesurfer) {
            const { interact } = this.wavesurfer.options
            if (interact) {
              this.wavesurfer.toggleInteraction(false)
              setTimeout(() => this.wavesurfer?.toggleInteraction(interact), 10)
            }
          }
        }
      },
    )
  }

  /** Remove all regions */
  public clearRegions() {
    this.regions.forEach((region) => region.remove())
  }

  /** Destroy the plugin and clean up */
  public destroy() {
    this.clearRegions()
    super.destroy()
  }
}

export default RegionsPlugin
