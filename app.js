// app.js - Main entry point for QR Code AR Experience
// This executes after head.html is loaded, and before body.html is loaded.

import './index.css'
import {hcapComponent, hcapPrimitive} from './hcap'

// Register HCAP components
AFRAME.registerComponent('hcap', hcapComponent())
AFRAME.registerPrimitive('hcap-hologram', hcapPrimitive())

// Enhanced AR experience components
AFRAME.registerComponent('qr-ar-controller', {
  init() {
    this.onSceneLoaded = this.onSceneLoaded.bind(this);
    this.onSurfaceFound = this.onSurfaceFound.bind(this);
    
    // Wait for scene to be ready
    if (this.el.hasLoaded) {
      this.onSceneLoaded();
    } else {
      this.el.addEventListener('loaded', this.onSceneLoaded);
    }
  },

  onSceneLoaded() {
    console.log('QR AR Controller initialized');
    
    // Listen for surface detection
    this.el.addEventListener('realityready', this.onSurfaceFound);
    
    // Update UI when AR is ready
    this.updateInstructions('Point your camera to find surfaces');
  },

  onSurfaceFound() {
    console.log('AR surface found');
    this.updateInstructions('Tap on a surface to place your AR content');
  },

  updateInstructions(text) {
    const instructionElement = document.querySelector('#instructionText');
    if (instructionElement) {
      instructionElement.textContent = text;
    }
  }
});

// Component for handling tap-to-place functionality
AFRAME.registerComponent('tap-to-place', {
  schema: {
    target: {type: 'selector'}
  },

  init() {
    this.placed = false;
    this.onTap = this.onTap.bind(this);
    
    this.el.addEventListener('click', this.onTap);
  },

  onTap(event) {
    if (this.placed || !event.detail.intersection) return;

    const position = event.detail.intersection.point;
    const target = this.data.target;
    
    if (target) {
      // Place the target object at the tap position
      target.setAttribute('position', `${position.x} ${position.y + 0.1} ${position.z}`);
      target.setAttribute('visible', 'true');
      
      this.placed = true;
      this.el.emit('object-placed', {position: position});
      
      console.log('Object placed at:', position);
    }
  }
});

// Component for smooth animations and interactions
AFRAME.registerComponent('ar-interactions', {
  init() {
    this.setupGestures();
  },

  setupGestures() {
    // Add smooth scaling and rotation animations
    this.el.addEventListener('gesture-start', () => {
      this.el.setAttribute('animation__scale', 'property: scale; to: 1.1 1.1 1.1; dur: 200;');
    });

    this.el.addEventListener('gesture-end', () => {
      this.el.setAttribute('animation__scale', 'property: scale; to: 1 1 1; dur: 200;');
    });
  }
});

// Analytics and performance monitoring
AFRAME.registerComponent('ar-analytics', {
  init() {
    this.startTime = Date.now();
    
    // Track key events
    this.el.addEventListener('realityready', () => {
      this.trackEvent('ar_ready', Date.now() - this.startTime);
    });
    
    this.el.addEventListener('object-placed', () => {
      this.trackEvent('object_placed', Date.now() - this.startTime);
    });
  },

  trackEvent(eventName, timing) {
    console.log(`Event: ${eventName}, Timing: ${timing}ms`);
    
    // You can integrate with your analytics service here
    // Example: Google Analytics, Mixpanel, etc.
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, {
        'custom_parameter': timing
      });
    }
  }
});

// Error handling and fallbacks
AFRAME.registerComponent('ar-error-handler', {
  init() {
    this.setupErrorHandling();
  },

  setupErrorHandling() {
    // Handle camera permission errors
    navigator.mediaDevices.getUserMedia({video: true})
      .then(() => {
        console.log('Camera access granted');
      })
      .catch((error) => {
        console.error('Camera access denied:', error);
        this.showError('Camera access is required for AR experience');
      });

    // Handle WebXR support
    if (!navigator.xr) {
      console.warn('WebXR not supported');
    }
  },

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                  background: rgba(255,0,0,0.9); color: white; padding: 20px; 
                  border-radius: 10px; z-index: 1000; text-align: center;">
        <h3>AR Error</h3>
        <p>${message}</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
    document.body.appendChild(errorDiv);
  }
});

// Initialize components on scene
document.addEventListener('DOMContentLoaded', () => {
  const scene = document.querySelector('a-scene');
  
  if (scene) {
    scene.setAttribute('qr-ar-controller', '');
    scene.setAttribute('ar-analytics', '');
    scene.setAttribute('ar-error-handler', '');
  }

  // Setup tap-to-place for ground plane
  const ground = document.querySelector('#ground');
  const hologram = document.querySelector('#holo');
  
  if (ground && hologram) {
    ground.setAttribute('tap-to-place', `target: #holo`);
  }

  // Add interaction components to hologram
  if (hologram) {
    hologram.setAttribute('ar-interactions', '');
  }
});

// QR code specific enhancements
const QRARExperience = {
  init() {
    this.detectQRParams();
    this.setupDeepLinking();
  },

  detectQRParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const qrId = urlParams.get('qr');
    const contentId = urlParams.get('content');
    
    if (qrId) {
      console.log('Launched from QR code:', qrId);
      this.trackQRUsage(qrId);
    }
    
    if (contentId) {
      console.log('Loading specific content:', contentId);
      this.loadSpecificContent(contentId);
    }
  },

  setupDeepLinking() {
    // Handle different QR codes for different content
    const urlParams = new URLSearchParams(window.location.search);
    const experience = urlParams.get('experience');
    
    switch(experience) {
      case 'demo1':
        this.loadContent('./assets/FemalePresenter.hcap');
        break;
      case 'demo2':
        this.loadContent('./assets/Soccer.hcap');
        break;
      default:
        this.loadContent('./assets/FemalePresenter.hcap');
    }
  },

  loadSpecificContent(contentId) {
    const hologram = document.querySelector('#holo');
    if (hologram) {
      hologram.setAttribute('src', `./assets/${contentId}.hcap`);
    }
  },

  loadContent(src) {
    const hologram = document.querySelector('#holo');
    if (hologram) {
      hologram.setAttribute('src', src);
    }
  },

  trackQRUsage(qrId) {
    // Track QR code usage for analytics
    console.log('QR Code used:', qrId);
    // You can send this to your analytics service
  }
};

// Initialize QR AR experience
QRARExperience.init();