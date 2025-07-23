// hcap.js - Microsoft HCAP hologram component for 8th Wall

export function hcapComponent() {
  return {
    schema: {
      src: {type: 'string'},
      size: {type: 'number', default: 1},
      autoplay: {type: 'boolean', default: true},
      loop: {type: 'boolean', default: true},
      muted: {type: 'boolean', default: false}
    },

    init() {
      this.hologram = null
      this.isLoaded = false
      this.isPlaying = false
      this.isMuted = this.data.muted

      // Bind methods
      this.onHologramLoaded = this.onHologramLoaded.bind(this)
      this.onHologramError = this.onHologramError.bind(this)
      
      // Load hologram when component initializes
      if (this.data.src) {
        this.loadHologram()
      }
    },

    update(oldData) {
      // Reload hologram if src changes
      if (this.data.src !== oldData.src && this.data.src) {
        this.loadHologram()
      }
      
      // Update size if changed
      if (this.data.size !== oldData.size) {
        this.updateScale()
      }
    },

    loadHologram() {
      try {
        // Check if HoloVideoObject is available (from Microsoft HCAP package)
        if (typeof HoloVideoObject === 'undefined') {
          console.error('HoloVideoObject not found. Make sure Microsoft HCAP package is loaded.')
          return
        }

        // Create hologram instance
        this.hologram = new HoloVideoObject({
          src: this.data.src,
          autoplay: this.data.autoplay,
          loop: this.data.loop,
          muted: this.data.muted
        })

        // Add event listeners
        this.hologram.addEventListener('loaded', this.onHologramLoaded)
        this.hologram.addEventListener('error', this.onHologramError)
        
        // Attach to entity
        this.el.appendChild(this.hologram)
        
      } catch (error) {
        console.error('Error loading hologram:', error)
        this.showFallback()
      }
    },

    onHologramLoaded() {
      console.log('Hologram loaded successfully')
      this.isLoaded = true
      this.updateScale()
      
      if (this.data.autoplay) {
        this.play()
      }

      // Emit loaded event for other components
      this.el.emit('hologram-loaded')
    },

    onHologramError(event) {
      console.error('Hologram loading error:', event)
      this.showFallback()
    },

    showFallback() {
      // Show a simple box as fallback if hologram fails to load
      const geometry = document.createElement('a-box')
      geometry.setAttribute('width', this.data.size)
      geometry.setAttribute('height', this.data.size)
      geometry.setAttribute('depth', this.data.size)
      geometry.setAttribute('color', '#4CC3D9')
      geometry.setAttribute('material', 'opacity: 0.7; transparent: true')
      this.el.appendChild(geometry)
    },

    updateScale() {
      if (this.hologram && this.isLoaded) {
        const scale = this.data.size
        this.hologram.scale.set(scale, scale, scale)
      }
    },

    play() {
      if (this.hologram && this.isLoaded && !this.isPlaying) {
        this.hologram.play()
        this.isPlaying = true
        console.log('Hologram playing')
      }
    },

    pause() {
      if (this.hologram && this.isPlaying) {
        this.hologram.pause()
        this.isPlaying = false
        console.log('Hologram paused')
      }
    },

    togglePlay() {
      if (this.isPlaying) {
        this.pause()
      } else {
        this.play()
      }
    },

    mute() {
      if (this.hologram) {
        this.hologram.muted = true
        this.isMuted = true
      }
    },

    unmute() {
      if (this.hologram) {
        this.hologram.muted = false
        this.isMuted = false
      }
    },

    toggleMute() {
      if (this.isMuted) {
        this.unmute()
      } else {
        this.mute()
      }
    },

    remove() {
      if (this.hologram) {
        this.hologram.removeEventListener('loaded', this.onHologramLoaded)
        this.hologram.removeEventListener('error', this.onHologramError)
        this.hologram.destroy?.()
      }
    }
  }
}

export function hcapPrimitive() {
  return {
    defaultComponents: {
      'hcap': {}
    },
    mappings: {
      src: 'hcap.src',
      size: 'hcap.size',
      autoplay: 'hcap.autoplay',
      loop: 'hcap.loop',
      muted: 'hcap.muted'
    }
  }
}