// 3D Stars Effect with Mouse Cursor Following
// This script creates an interactive 3D stars effect that follows the mouse cursor
// with clickable stars that can trigger animations

class StarsEffect {
  constructor() {
    this.container = null;
    this.camera = null;
    this.scene = null;
    this.renderer = null;
    this.stars = [];
    this.mouse = { x: 0, y: 0 };
    this.windowHalfX = window.innerWidth / 2;
    this.windowHalfY = window.innerHeight / 2;
    this.touchEnabled = false;
    this.statsEnabled = false; // Set to true to enable stats monitor (development only)
    
    // Detect if device is mobile or desktop
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Adapt parameters based on device capabilities
    const isLowPerformanceDevice = this.isMobile || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
    
    // Set parameters based on device type and performance capabilities
    this.parameters = {
      count: isLowPerformanceDevice ? 400 : (this.isMobile ? 500 : 1000),
      size: this.isMobile ? 2 : 3,
      color: 0xffffff,
      minDistance: 150,
      maxDistance: 400
    };
    
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.init();
    this.animate();
  }
  init() {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'stars-container';
    this.container.style.position = 'fixed';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.zIndex = '-1';
    this.container.style.pointerEvents = 'none';
    document.body.appendChild(this.container);
    
    // Add performance monitoring in development mode
    if (this.statsEnabled) {
      this.setupPerformanceMonitoring();
    }// Set up camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 2000);
    this.camera.position.z = 1000;
    
    // Track scroll position for parallax effect
    this.scrollY = 0;
    this.previousScrollY = 0;
    this.scrollSpeed = 0;
    window.addEventListener('scroll', () => {
      this.previousScrollY = this.scrollY;
      this.scrollY = window.scrollY;
      this.scrollSpeed = this.scrollY - this.previousScrollY;
    });

    // Set up scene
    this.scene = new THREE.Scene();    // Create stars with different colors and patterns
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];
    const sizes = [];

    // Define color palette for stars (subtle blue-white theme)
    const colorPalette = [
      new THREE.Color(0xffffff), // White
      new THREE.Color(0xccf2ff), // Light blue
      new THREE.Color(0xe6f9ff), // Very light blue
      new THREE.Color(0xebf5f7), // Nearly white blue
      new THREE.Color(0xdaeaf2)  // Pale blue
    ];
    
    // Create a few special colored stars (accent colors)
    const accentColors = [
      new THREE.Color(0xfffce6), // Warm white (yellow tint)
      new THREE.Color(0xffe6e6), // Warm white (red tint)
      new THREE.Color(0xe6fff2)  // Warm white (green tint)
    ];
    
    // Create main star field
    for (let i = 0; i < this.parameters.count * 0.7; i++) {
      // Position stars randomly in 3D space
      const x = Math.random() * 2000 - 1000;
      const y = Math.random() * 2000 - 1000;
      const z = Math.random() * 2000 - 1000;

      vertices.push(x, y, z);
      
      // Random size with more small stars than large ones
      sizes.push(Math.random() * Math.random() * 4 + 1);
      
      // Pick a random color from the palette
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors.push(color.r, color.g, color.b);
    }
    
    // Create star clusters (denser regions)
    const clusterCount = 5;
    for (let c = 0; c < clusterCount; c++) {
      // Define cluster center
      const clusterX = Math.random() * 1600 - 800;
      const clusterY = Math.random() * 1600 - 800;
      const clusterZ = Math.random() * 1600 - 800;
      const clusterSize = Math.random() * 200 + 50;
      
      // Add stars to cluster
      for (let i = 0; i < this.parameters.count * 0.06; i++) {
        // Position stars in gaussian distribution around cluster center
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const r = Math.random() * clusterSize;
        
        const x = clusterX + r * Math.sin(phi) * Math.cos(theta);
        const y = clusterY + r * Math.sin(phi) * Math.sin(theta);
        const z = clusterZ + r * Math.cos(phi);
        
        vertices.push(x, y, z);
        
        // Cluster stars are slightly larger
        sizes.push(Math.random() * 5 + 1.5);
        
        // Cluster stars can have accent colors occasionally
        if (Math.random() > 0.85) {
          const color = accentColors[Math.floor(Math.random() * accentColors.length)];
          colors.push(color.r, color.g, color.b);
        } else {
          const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
          colors.push(color.r, color.g, color.b);
        }
      }
    }
    
    // Add a few distant stars (background stars)
    for (let i = 0; i < this.parameters.count * 0.2; i++) {
      // Position distant stars (further away)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = Math.random() * 500 + 1200; // Farther from center
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      vertices.push(x, y, z);
      
      // Distant stars are smaller
      sizes.push(Math.random() * 2 + 0.5);
      
      // Distant stars are always white/blue
      const color = colorPalette[Math.floor(Math.random() * 3)]; // Limit to first 3 colors (whiter)
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // Create material with vertex colors
    const material = new THREE.PointsMaterial({
      size: this.parameters.size,
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    });

    // Create points (stars)
    const points = new THREE.Points(geometry, material);
    this.scene.add(points);
    this.stars.push(points);

    // Set up renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);

    // Enable pointer events on the renderer's canvas for star interaction
    this.renderer.domElement.style.pointerEvents = 'auto';    // Event listeners for both mouse and touch interactions
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('click', this.onClick.bind(this));
    document.addEventListener('touchstart', this.onTouchStart.bind(this));
    document.addEventListener('touchmove', this.onTouchMove.bind(this));
    document.addEventListener('touchend', this.onTouchEnd.bind(this));
    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    // Add a subtle automatic movement for mobile devices
    if (this.isMobile) {
      this.autoMove = true;
      this.autoMoveX = 0.3;
      this.autoMoveY = 0.2;
    }
  }

  onMouseMove(event) {
    // Update mouse position
    this.mouse.x = (event.clientX - this.windowHalfX) * 0.05;
    this.mouse.y = (event.clientY - this.windowHalfY) * 0.05;

    // Update pointer for raycasting
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }
  
  onTouchStart(event) {
    this.touchEnabled = true;
    
    if (event.touches.length > 0) {
      // Update position based on touch
      this.onTouchMove(event);
    }
  }
  
  onTouchMove(event) {
    if (event.touches.length > 0) {
      // Prevent page scrolling when interacting with stars
      event.preventDefault();
      
      // Update position based on touch
      this.mouse.x = (event.touches[0].clientX - this.windowHalfX) * 0.05;
      this.mouse.y = (event.touches[0].clientY - this.windowHalfY) * 0.05;
      
      // Update pointer for raycasting
      this.pointer.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
    }
  }
  
  onTouchEnd(event) {
    // Handle touch end similar to click
    this.onClick(event);
    
    // Return to auto movement on mobile
    if (this.isMobile) {
      this.autoMove = true;
    }
  }
  onClick(event) {
    // Update the picking ray with the camera and pointer position
    this.raycaster.setFromCamera(this.pointer, this.camera);
    
    // Calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObjects(this.stars);
    
    if (intersects.length > 0) {
      // Get the first intersected object
      const intersect = intersects[0];
      
      // Create an animation for the clicked star
      this.animateClickedStar(intersect.index, intersect.object);
      
      // Create ripple effect at cursor position for visual feedback
      this.createCursorRipple(event.clientX, event.clientY);
    }
  }
  
  createCursorRipple(x, y) {
    // Don't add effect on mobile devices
    if (this.isMobile) return;
    
    // Create ripple element
    const ripple = document.createElement('div');
    ripple.className = 'cursor-ripple';
    
    // Style the ripple
    ripple.style.position = 'fixed';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.width = '10px';
    ripple.style.height = '10px';
    ripple.style.borderRadius = '50%';
    ripple.style.backgroundColor = 'rgba(255, 255, 255, 0)';
    ripple.style.border = '2px solid rgba(255, 255, 255, 0.8)';
    ripple.style.transform = 'translate(-50%, -50%)';
    ripple.style.zIndex = '9998';
    ripple.style.pointerEvents = 'none';
    
    // Add to DOM
    document.body.appendChild(ripple);
    
    // Animate the ripple
    gsap.to(ripple, {
      width: '100px',
      height: '100px',
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
      onComplete: () => {
        document.body.removeChild(ripple);
      }
    });
  }
  animateClickedStar(index, starObject) {
    // Create a burst effect when clicking a star
    const positions = starObject.geometry.attributes.position.array;
    const x = positions[index * 3];
    const y = positions[index * 3 + 1];
    const z = positions[index * 3 + 2];
    
    // Create a more impressive burst of particles at the clicked position
    const burstGeometry = new THREE.BufferGeometry();
    const burstVertices = [];
    const burstColors = [];
    const burstSizes = [];
    
    // Generate more particles for a more impressive effect
    const particleCount = 20;
    
    // Colors array for vibrant particle effects
    const colors = [
      0x00ffff, // Cyan
      0xff00ff, // Magenta
      0xffffff, // White
      0x00ff00, // Green
      0xffff00  // Yellow
    ];
    
    for (let i = 0; i < particleCount; i++) {
      // Create particles in a sphere around the clicked star
      const angle1 = Math.random() * Math.PI * 2;
      const angle2 = Math.random() * Math.PI;
      const radius = Math.random() * 30;
      
      const bx = x + radius * Math.sin(angle2) * Math.cos(angle1);
      const by = y + radius * Math.sin(angle2) * Math.sin(angle1);
      const bz = z + radius * Math.cos(angle2);
      
      burstVertices.push(bx, by, bz);
      
      // Assign random colors to each particle
      const color = new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);
      burstColors.push(color.r, color.g, color.b);
      
      burstSizes.push(Math.random() * 5 + 3);
    }
    
    burstGeometry.setAttribute('position', new THREE.Float32BufferAttribute(burstVertices, 3));
    burstGeometry.setAttribute('color', new THREE.Float32BufferAttribute(burstColors, 3));
    burstGeometry.setAttribute('size', new THREE.Float32BufferAttribute(burstSizes, 1));
    
    const burstMaterial = new THREE.PointsMaterial({
      size: 6,
      transparent: true,
      opacity: 1,
      vertexColors: true,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    });
    
    const burst = new THREE.Points(burstGeometry, burstMaterial);
    this.scene.add(burst);
    
    // Create expanding ring effect
    const ringGeometry = new THREE.RingGeometry(1, 2, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(x, y, z);
    ring.lookAt(this.camera.position);
    this.scene.add(ring);
    
    // Add pulse effect to the clicked star
    const clickedStarGlow = new THREE.PointLight(0x00ffff, 1, 50);
    clickedStarGlow.position.set(x, y, z);
    this.scene.add(clickedStarGlow);
    
    // Animate the burst particles
    gsap.to(burst.position, {
      x: '+=random(-10, 10)',
      y: '+=random(-10, 10)',
      z: '+=random(-10, 10)',
      duration: 1,
      ease: 'power2.out'
    });
    
    gsap.to(burst.material, {
      opacity: 0,
      duration: 1.5,
      ease: 'power3.out',
      onComplete: () => {
        this.scene.remove(burst);
        burstGeometry.dispose();
        burstMaterial.dispose();
      }
    });
    
    // Animate the expanding ring
    gsap.to(ring.scale, {
      x: 20,
      y: 20,
      z: 20,
      duration: 1.5,
      ease: 'power2.out'
    });
    
    gsap.to(ring.material, {
      opacity: 0,
      duration: 1.5,
      ease: 'power2.out',
      onComplete: () => {
        this.scene.remove(ring);
        ringGeometry.dispose();
        ringMaterial.dispose();
      }
    });
    
    // Animate the glow
    gsap.to(clickedStarGlow, {
      intensity: 0,
      distance: 150,
      duration: 1,
      ease: 'power2.out',
      onComplete: () => {
        this.scene.remove(clickedStarGlow);
      }
    });
  }

  onWindowResize() {
    this.windowHalfX = window.innerWidth / 2;
    this.windowHalfY = window.innerHeight / 2;
    
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.render();
    
    // Update performance stats if enabled
    if (this.statsEnabled) {
      this.updatePerformanceStats();
    }
  }render() {
    // For mobile devices, apply automatic movement if no touch is happening
    if (this.isMobile && this.autoMove) {
      // Create a gentle floating movement for mobile
      this.mouse.x = Math.sin(Date.now() * 0.001) * 10;
      this.mouse.y = Math.cos(Date.now() * 0.001) * 5;
    }
    
    // Apply scroll parallax effect
    // Constrain scroll speed to prevent extreme movements
    const cappedScrollSpeed = Math.max(-15, Math.min(15, this.scrollSpeed * 0.05));
    
    // Rotate the camera based on mouse position with smooth easing
    this.camera.position.x += (this.mouse.x - this.camera.position.x) * 0.05;
    this.camera.position.y += (-this.mouse.y - this.camera.position.y) * 0.05;
    
    // Add subtle rotation based on scroll speed
    this.scene.rotation.x += cappedScrollSpeed * 0.0005;
    
    this.camera.lookAt(this.scene.position);
    
    // Rotate the stars slightly for a more dynamic feel
    this.stars.forEach((star) => {
      star.rotation.y += 0.0005;
      star.rotation.x += 0.0002;
      
      // Add additional rotation based on scroll
      if (Math.abs(cappedScrollSpeed) > 0.1) {
        star.rotation.z += cappedScrollSpeed * 0.0001;
      }
    });
    
    // Apply a subtle depth effect based on scroll position
    const normalizedScroll = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    const depthEffect = normalizedScroll * 50; // Max movement of 50 units
    this.camera.position.z = 1000 - depthEffect;
    
    this.renderer.render(this.scene, this.camera);
  }

  // Method to check device type and adjust settings
  adjustForDevice() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Reduce number of stars and effects for mobile
      this.parameters.count = 300;
      this.parameters.size = 2;
      
      // Re-initialize for mobile
      this.reinitialize();
    }
  }
    reinitialize() {
    // Clear existing stars
    this.stars.forEach(star => {
      this.scene.remove(star);
      star.geometry.dispose();
      star.material.dispose();
    });
    this.stars = [];
    
    // Create new stars with adjusted parameters
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const sizes = [];
    const colors = [];

    for (let i = 0; i < this.parameters.count; i++) {
      const x = Math.random() * 2000 - 1000;
      const y = Math.random() * 2000 - 1000;
      const z = Math.random() * 2000 - 1000;

      vertices.push(x, y, z);
      sizes.push(Math.random() * 3 + 1);
      
      // Add white color
      colors.push(1, 1, 1);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: this.parameters.size,
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);
    this.stars.push(points);
  }
  
  // Performance monitoring setup
  setupPerformanceMonitoring() {
    // Create a simple FPS counter
    const stats = document.createElement('div');
    stats.id = 'stars-stats';
    stats.style.position = 'fixed';
    stats.style.top = '0';
    stats.style.left = '0';
    stats.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    stats.style.color = '#fff';
    stats.style.padding = '10px';
    stats.style.fontSize = '12px';
    stats.style.zIndex = '10000';
    stats.style.fontFamily = 'monospace';
    stats.textContent = 'FPS: --';
    document.body.appendChild(stats);
    
    this.stats = stats;
    this.lastTime = performance.now();
    this.frames = 0;
    
    // Add memory usage tracking
    const memoryStats = document.createElement('div');
    memoryStats.id = 'stars-memory';
    memoryStats.style.position = 'fixed';
    memoryStats.style.top = '25px';
    memoryStats.style.left = '0';
    memoryStats.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    memoryStats.style.color = '#fff';
    memoryStats.style.padding = '10px';
    memoryStats.style.fontSize = '12px';
    memoryStats.style.zIndex = '10000';
    memoryStats.style.fontFamily = 'monospace';
    memoryStats.textContent = 'Memory: --';
    document.body.appendChild(memoryStats);
    
    this.memoryStats = memoryStats;
    
    // Setup performance observer
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask') {
            console.warn('Long task detected in stars effect:', entry.duration.toFixed(2) + 'ms');
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
      this.performanceObserver = observer;
    }
  }
  
  // Update performance stats
  updatePerformanceStats() {
    if (!this.statsEnabled) return;
    
    this.frames++;
    const time = performance.now();
    
    if (time >= this.lastTime + 1000) {
      const fps = Math.round((this.frames * 1000) / (time - this.lastTime));
      this.stats.textContent = `FPS: ${fps}`;
      
      // Add color coding for performance
      if (fps < 30) {
        this.stats.style.color = '#ff5555';
      } else if (fps < 50) {
        this.stats.style.color = '#ffff55';
      } else {
        this.stats.style.color = '#55ff55';
      }
      
      this.frames = 0;
      this.lastTime = time;
      
      // Update memory usage if available
      if (performance.memory) {
        const memoryUsed = (performance.memory.usedJSHeapSize / 1048576).toFixed(2);
        const memoryTotal = (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2);
        this.memoryStats.textContent = `Memory: ${memoryUsed}MB / ${memoryTotal}MB`;
        
        // Add color coding for memory usage
        const memoryPercentage = (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100;
        if (memoryPercentage > 80) {
          this.memoryStats.style.color = '#ff5555';
        } else if (memoryPercentage > 60) {
          this.memoryStats.style.color = '#ffff55';
        } else {
          this.memoryStats.style.color = '#55ff55';
        }
      }
    }
  }
}

// Initialize the effect after the page is loaded with performance optimizations
document.addEventListener('DOMContentLoaded', () => {
  // Check if THREE.js is loaded
  if (typeof THREE !== 'undefined') {
    // We'll initialize the effect only when the page is fully loaded
    // This ensures the main content loads first
    window.addEventListener('load', () => {
      // Use requestIdleCallback if available for better performance
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          // Initialize the stars effect
          const starsEffect = new StarsEffect();
          
          // Adjust for device type
          starsEffect.adjustForDevice();
          
          // Add to window for debugging purposes
          window.starsEffect = starsEffect;
          
          // Add a toggle option for accessibility
          addAccessibilityToggle(starsEffect);
        });
      } else {
        // Fallback for browsers that don't support requestIdleCallback
        setTimeout(() => {
          const starsEffect = new StarsEffect();
          starsEffect.adjustForDevice();
          window.starsEffect = starsEffect;
          addAccessibilityToggle(starsEffect);
        }, 100);
      }
    });
  } else {
    console.error('THREE.js is not loaded. Please include it before stars-effect.js');
  }
});

// Function to add accessibility toggle
function addAccessibilityToggle(starsEffect) {
  // Create a toggle button for users who might want to disable the effect
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'stars-toggle';
  toggleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z"></path></svg>';
  toggleBtn.setAttribute('aria-label', 'Toggle stars effect');
  toggleBtn.setAttribute('title', 'Toggle stars effect');
  toggleBtn.className = 'stars-toggle-btn';
  
  // Style the button
  toggleBtn.style.position = 'fixed';
  toggleBtn.style.bottom = '20px';
  toggleBtn.style.right = '20px';
  toggleBtn.style.zIndex = '999';
  toggleBtn.style.background = 'rgba(0, 0, 0, 0.5)';
  toggleBtn.style.border = 'none';
  toggleBtn.style.borderRadius = '50%';
  toggleBtn.style.width = '40px';
  toggleBtn.style.height = '40px';
  toggleBtn.style.cursor = 'pointer';
  toggleBtn.style.color = '#fff';
  toggleBtn.style.display = 'flex';
  toggleBtn.style.alignItems = 'center';
  toggleBtn.style.justifyContent = 'center';
  toggleBtn.style.opacity = '0.7';
  toggleBtn.style.transition = 'opacity 0.3s ease';
  
  // Hover effect
  toggleBtn.addEventListener('mouseenter', () => {
    toggleBtn.style.opacity = '1';
  });
  
  toggleBtn.addEventListener('mouseleave', () => {
    toggleBtn.style.opacity = '0.7';
  });
  
  // Toggle functionality
  let effectEnabled = true;
  toggleBtn.addEventListener('click', () => {
    if (effectEnabled) {
      // Disable effect
      starsEffect.container.style.display = 'none';
      toggleBtn.style.background = 'rgba(255, 255, 255, 0.3)';
      toggleBtn.style.color = '#000';
      effectEnabled = false;
    } else {
      // Enable effect
      starsEffect.container.style.display = 'block';
      toggleBtn.style.background = 'rgba(0, 0, 0, 0.5)';
      toggleBtn.style.color = '#fff';
      effectEnabled = true;
    }
  });
  
  // Add to body
  document.body.appendChild(toggleBtn);
  
  // Store user preference in local storage if they toggle the effect
  toggleBtn.addEventListener('click', () => {
    localStorage.setItem('starsEffectEnabled', effectEnabled.toString());
  });
    // Check if user has a preference
  const savedPreference = localStorage.getItem('starsEffectEnabled');
  if (savedPreference === 'false') {
    // Trigger a click to disable the effect
    toggleBtn.click();
  }
  
  // Initialize the custom cursor
  new CustomCursor();
}

// Custom Cursor Class for interactive mouse effects
class CustomCursor {
  constructor() {
    // Check if we're on a mobile device
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Don't initialize on mobile devices
    if (this.isMobile) return;
    
    // Check user's motion preferences
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    this.init();
  }
  
  init() {
    // Create cursor elements
    this.cursorDot = document.createElement('div');
    this.cursorDot.className = 'cursor-dot';
    
    this.cursorOutline = document.createElement('div');
    this.cursorOutline.className = 'cursor-outline';
    
    // Add to DOM
    document.body.appendChild(this.cursorDot);
    document.body.appendChild(this.cursorOutline);
    
    // Initialize position off-screen
    this.cursorPosition = { x: -100, y: -100 };
    this.dotPosition = { x: -100, y: -100 };
    this.outlinePosition = { x: -100, y: -100 };
    
    // Track mouse movement
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mousedown', this.onMouseDown.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
    
    // Handle cursor visibility when mouse leaves/enters the window
    document.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    document.addEventListener('mouseenter', this.onMouseEnter.bind(this));
    
    // Find all clickable elements
    this.addClickableListeners();
    
    // Start animation loop
    this.render();
    
    // Check if the browser supports the pointer API
    if (window.matchMedia('(pointer: fine)').matches) {
      // Mark all interactive elements
      this.markInteractiveElements();
    } else {
      // If not using a mouse, use default cursor
      document.body.style.cursor = 'auto';
      this.cursorDot.style.display = 'none';
      this.cursorOutline.style.display = 'none';
    }
  }
  
  markInteractiveElements() {
    // Add the 'clickable' class to all interactive elements
    const interactiveElements = document.querySelectorAll('a, button, [role="button"], input[type="submit"], .btn');
    interactiveElements.forEach(element => {
      element.classList.add('clickable');
    });
  }
  
  addClickableListeners() {
    // Add mouseover/mouseout listeners to all interactive elements
    const clickableElements = document.querySelectorAll('a, button, [role="button"], input[type="submit"], .btn');
    
    clickableElements.forEach(element => {
      element.addEventListener('mouseover', () => {
        // Expand the cursor on hover
        if (!this.reducedMotion) {
          this.cursorDot.style.transform = 'translate(-50%, -50%) scale(1.5)';
          this.cursorDot.style.backgroundColor = 'rgba(255, 255, 255, 1)';
          this.cursorDot.style.boxShadow = '0 0 15px rgba(100, 180, 255, 0.8), 0 0 30px rgba(100, 180, 255, 0.5)';
        }
      });
      
      element.addEventListener('mouseout', () => {
        // Reset cursor on mouseout
        if (!this.reducedMotion) {
          this.cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
          this.cursorDot.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
          this.cursorDot.style.boxShadow = '0 0 10px rgba(100, 180, 255, 0.8), 0 0 20px rgba(100, 180, 255, 0.5)';
        }
      });
    });
  }
  
  onMouseMove(e) {
    // Update cursor position
    this.cursorPosition.x = e.clientX;
    this.cursorPosition.y = e.clientY;
  }
  
  onMouseDown() {
    // Add "pressed" effect to cursor
    if (!this.reducedMotion) {
      this.cursorDot.style.transform = 'translate(-50%, -50%) scale(0.7)';
      this.cursorOutline.style.transform = 'translate(-50%, -50%) scale(0.7)';
      this.cursorOutline.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
    }
  }
  
  onMouseUp() {
    // Reset cursor after click
    if (!this.reducedMotion) {
      this.cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
      this.cursorOutline.style.transform = 'translate(-50%, -50%) scale(1)';
      this.cursorOutline.style.backgroundColor = '';
    }
  }
  
  onMouseLeave() {
    // Hide cursor when mouse leaves the window
    this.cursorDot.style.opacity = '0';
    this.cursorOutline.style.opacity = '0';
  }
  
  onMouseEnter() {
    // Show cursor when mouse enters the window
    this.cursorDot.style.opacity = '1';
    this.cursorOutline.style.opacity = '1';
  }
    render() {
    // Smooth cursor following effect with easing
    if (!this.reducedMotion) {
      // Smooth dot movement (faster following)
      this.dotPosition.x += (this.cursorPosition.x - this.dotPosition.x) * 0.2;
      this.dotPosition.y += (this.cursorPosition.y - this.dotPosition.y) * 0.2;
      
      // Smoother outline movement (slower following)
      this.outlinePosition.x += (this.cursorPosition.x - this.outlinePosition.x) * 0.1;
      this.outlinePosition.y += (this.cursorPosition.y - this.outlinePosition.y) * 0.1;
      
      // Apply positions
      this.cursorDot.style.transform = `translate(${this.dotPosition.x}px, ${this.dotPosition.y}px)`;
      this.cursorOutline.style.transform = `translate(${this.outlinePosition.x}px, ${this.outlinePosition.y}px)`;
      
      // Generate particle trail at certain intervals
      this.generateTrail();
    } else {
      // Direct positioning without animations for reduced motion
      this.cursorDot.style.left = `${this.cursorPosition.x}px`;
      this.cursorDot.style.top = `${this.cursorPosition.y}px`;
      this.cursorOutline.style.left = `${this.cursorPosition.x}px`;
      this.cursorOutline.style.top = `${this.cursorPosition.y}px`;
    }
    
    // Continue animation loop
    requestAnimationFrame(this.render.bind(this));
  }
  
  // Trail effect properties
  lastTrailTime = 0;
  trailInterval = 100; // ms between trail particles
  
  generateTrail() {
    const now = Date.now();
    
    // Check if we should create a trail particle based on time elapsed
    if (now - this.lastTrailTime > this.trailInterval) {
      this.lastTrailTime = now;
      
      // Only create trail when cursor is moving at sufficient speed
      const distance = Math.hypot(
        this.dotPosition.x - this.outlinePosition.x,
        this.dotPosition.y - this.outlinePosition.y
      );
      
      if (distance > 5) {
        // Create a trail particle
        const trail = document.createElement('div');
        trail.className = 'cursor-trail';
        
        // Style the particle
        trail.style.position = 'fixed';
        trail.style.width = '5px';
        trail.style.height = '5px';
        trail.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        trail.style.borderRadius = '50%';
        trail.style.zIndex = '9997';
        trail.style.pointerEvents = 'none';
        trail.style.boxShadow = '0 0 5px rgba(100, 180, 255, 0.5)';
        
        // Position the particle
        trail.style.left = `${this.dotPosition.x}px`;
        trail.style.top = `${this.dotPosition.y}px`;
        trail.style.transform = 'translate(-50%, -50%)';
        
        // Add to DOM
        document.body.appendChild(trail);
        
        // Animate and remove the particle
        gsap.to(trail, {
          opacity: 0,
          width: '3px',
          height: '3px',
          duration: 0.8,
          y: '+=' + (Math.random() * 20 - 10),
          x: '+=' + (Math.random() * 20 - 10),
          ease: 'power2.out',
          onComplete: () => {
            if (trail.parentNode) {
              document.body.removeChild(trail);
            }
          }
        });
      }
    }
  }
}
