// --- Global Constants ---
const MOBILE_BREAKPOINT = 768

// --- Scroll Event Handler ---
// A single, optimized function to handle all scroll-related effects.
let isTicking = false

function handleScrollEffects() {
  const scrollPosition = window.scrollY
  const navbar = document.querySelector('.navbar')
  const hero = document.querySelector('.hero-header')
  const countdown = document.querySelector('#countdown')

  // 1. Navbar background transition
  if (scrollPosition > 50) {
    navbar.classList.add('scrolled')
  } else {
    navbar.classList.remove('scrolled')
  }

  // 2. Hero section parallax effect
  if (hero) {
    hero.style.backgroundPosition = `center calc(50% + ${
      scrollPosition * 0.5
    }px)`
  }

  // 3. Countdown section parallax effect
  if (countdown) {
    if (window.innerWidth > MOBILE_BREAKPOINT) {
      // Apply parallax effect only on larger screens
      countdown.style.backgroundPosition = `center calc(50% + ${
        scrollPosition * 0.3
      }px)`
    } else {
      // On mobile, reset to default position
      countdown.style.backgroundPosition = 'center center'
    }
  }

  // 4. Horizontal scroll gallery
  updateHorizontalScroll()
}

/**
 * Populates the gallery with a random, interleaved selection of photos.
 * @returns {Promise<void>} A promise that resolves when all images are loaded.
 */
function populateRandomGallery() {
  // --- Photo filenames ---
  const horizontalPhotos = [...Array(9)].map((_, i) => `${i + 1}.jpg`)
  const verticalPhotos = [...Array(20)].map((_, i) => `${i + 1}.jpg`)

  // Fisher-Yates shuffle function to randomize array order
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }

  const shuffledHorizontal = shuffle(horizontalPhotos).slice(0, 5)
  const shuffledVertical = shuffle(verticalPhotos).slice(0, 5)

  const finalPhotos = []
  for (let i = 0; i < 5; i++) {
    if (shuffledHorizontal[i])
      finalPhotos.push(`photos/horizontal/${shuffledHorizontal[i]}`)
    if (shuffledVertical[i])
      finalPhotos.push(`photos/vertical/${shuffledVertical[i]}`)
  }

  const galleryContainer = document.querySelector('.photo-scroll-inner')
  if (!galleryContainer) return Promise.resolve()

  galleryContainer.innerHTML = finalPhotos
    .map((src) => `<img src="${src}" alt="Gallery Image" class="scroll-photo">`)
    .join('')

  // Create a promise that resolves when all images inside the container have loaded
  const images = galleryContainer.querySelectorAll('img')
  const promises = Array.from(images).map((img) => {
    return new Promise((resolve) => {
      if (img.complete) {
        resolve()
      } else {
        // Also resolve on error to not block the page from initializing
        img.addEventListener('load', resolve, { once: true })
        img.addEventListener('error', resolve, { once: true })
      }
    })
  })
  return Promise.all(promises)
}

// --- Main Event Listener ---
document.addEventListener('DOMContentLoaded', async () => {
  // Attach the single scroll listener
  // Use requestAnimationFrame to optimize scroll performance
  window.addEventListener('scroll', () => {
    if (!isTicking) {
      window.requestAnimationFrame(() => {
        handleScrollEffects()
        isTicking = false
      })
      isTicking = true
    }
  })

  // --- Dynamic Content and Dependent Setups ---
  try {
    // 1. Wait for gallery images to be created and loaded
    await populateRandomGallery()
    // 2. Attach listeners to the new images
    setupLightbox()
    // 3. Calculate layout based on the new images
    setupHorizontalScroll()
  } catch (error) {
    console.error('Error setting up dynamic content:', error)
  }
})

// --- Lightbox Implementation ---
function setupLightbox() {
  // Lightbox Gallery Logic
  const lightbox = document.getElementById('lightbox')
  if (lightbox) {
    const lightboxImg = document.getElementById('lightbox-img')
    const galleryImages = document.querySelectorAll('.scroll-photo')
    const closeBtn = document.querySelector('.lightbox-close')
    const prevBtn = document.querySelector('.lightbox-prev')
    const nextBtn = document.querySelector('.lightbox-next')

    let currentIndex = 0
    const imageSources = Array.from(galleryImages).map((img) => img.src)

    function showImage(index) {
      if (index < 0 || index >= imageSources.length) {
        console.error('Invalid image index')
        return
      }
      lightboxImg.src = imageSources[index]
      currentIndex = index
    }

    function openLightbox(index) {
      lightbox.classList.add('active')
      showImage(index)
    }

    function closeLightbox() {
      lightbox.classList.remove('active')
    }

    function showNextImage() {
      const nextIndex = (currentIndex + 1) % imageSources.length
      showImage(nextIndex)
    }

    function showPrevImage() {
      const prevIndex =
        (currentIndex - 1 + imageSources.length) % imageSources.length
      showImage(prevIndex)
    }

    galleryImages.forEach((image, index) => {
      // We check for touch support to apply the correct event listeners.
      const isTouchDevice = 'ontouchstart' in window

      if (isTouchDevice) {
        // --- Robust Logic for Touch Devices ---
        let isDragging = false
        let startX, startY

        const cleanupTouchListeners = () => {
          window.removeEventListener('touchmove', handleTouchMove)
          window.removeEventListener('touchend', handleTouchEnd)
          window.removeEventListener('touchcancel', handleTouchCancel)
        }

        const handleTouchStart = (e) => {
          const touch = e.touches[0]
          isDragging = false
          startX = touch.clientX
          startY = touch.clientY
          window.addEventListener('touchmove', handleTouchMove)
          window.addEventListener('touchend', handleTouchEnd)
          window.addEventListener('touchcancel', handleTouchCancel)
        }

        const handleTouchMove = (e) => {
          if (isDragging) return
          const touch = e.touches[0]
          if (
            Math.abs(touch.clientX - startX) > 10 ||
            Math.abs(touch.clientY - startY) > 10
          ) {
            isDragging = true
          }
        }

        const handleTouchEnd = (e) => {
          if (!isDragging) {
            // It's a tap! Prevent the browser from firing a "ghost click" 300ms later.
            e.preventDefault()
            openLightbox(index)
          }
          cleanupTouchListeners()
        }

        const handleTouchCancel = () => {
          cleanupTouchListeners()
        }

        image.addEventListener('touchstart', handleTouchStart)
      } else {
        // --- Simple Logic for Non-Touch Devices (Mouse) ---
        image.addEventListener('click', () => openLightbox(index))
      }

      // Prevent the context menu (e.g., from a long press) on all devices.
      image.addEventListener('contextmenu', (e) => e.preventDefault())
    })

    closeBtn.addEventListener('click', closeLightbox)
    prevBtn.addEventListener('click', showPrevImage)
    nextBtn.addEventListener('click', showNextImage)

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeLightbox()
      }
    })

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return
      if (e.key === 'ArrowRight') showNextImage()
      if (e.key === 'ArrowLeft') showPrevImage()
      if (e.key === 'Escape') closeLightbox()
    })
  }
}

// --- Horizontal Scroll Implementation ---

let horizontalScrollDistance = 0
let gallerySection, photoScrollContainer, photoScrollInner

function setupHorizontalScroll() {
  gallerySection = document.getElementById('gallery')
  photoScrollContainer = document.querySelector('.photo-scroll-container')
  photoScrollInner = document.querySelector('.photo-scroll-inner')

  if (!gallerySection || !photoScrollContainer || !photoScrollInner) {
    console.warn('Horizontal scroll elements not found. Aborting setup.')
    return
  }

  const updateDimensions = () => {
    // On mobile, disable the JS-driven effect and reset styles.
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      if (gallerySection.style.height) gallerySection.style.height = 'auto'
      if (photoScrollContainer.style.position)
        photoScrollContainer.style.position = 'relative'
      if (photoScrollInner.style.transform)
        photoScrollInner.style.transform = 'translateX(0px)'
      horizontalScrollDistance = 0 // This disables the scroll translation
      return
    }

    // Calculate the total horizontal distance that needs to be scrolled
    const scrollWidth = photoScrollInner.scrollWidth
    const containerWidth = photoScrollContainer.clientWidth
    horizontalScrollDistance = scrollWidth - containerWidth

    if (horizontalScrollDistance > 0) {
      // Set the height of the parent section to create a "track" for the sticky element.
      // We add 100vh so the section is fully visible before and after the scroll.
      gallerySection.style.height = `calc(100vh + ${horizontalScrollDistance}px)`
      photoScrollContainer.style.position = 'sticky'
      photoScrollContainer.style.top = '0'
    } else {
      // If there's no overflow, reset the styles.
      gallerySection.style.height = 'auto'
      photoScrollContainer.style.position = 'relative'
    }
  }

  // Use ResizeObserver to automatically recalculate on window resize for responsiveness.
  const resizeObserver = new ResizeObserver(updateDimensions)
  resizeObserver.observe(photoScrollContainer)

  // Initial calculation
  updateDimensions()
}

function updateHorizontalScroll() {
  if (
    horizontalScrollDistance <= 0 ||
    !gallerySection ||
    window.innerWidth <= MOBILE_BREAKPOINT
  )
    return

  const galleryTop = gallerySection.offsetTop
  const scrollAmount = window.scrollY - galleryTop

  if (scrollAmount >= 0 && scrollAmount <= horizontalScrollDistance) {
    // While scrolling within the "track", translate the inner container.
    photoScrollInner.style.transform = `translateX(-${scrollAmount}px)`
  } else if (scrollAmount < 0) {
    // Before reaching the track, pin it to the start.
    photoScrollInner.style.transform = 'translateX(0px)'
  } else {
    // After passing the track, pin it to the end.
    photoScrollInner.style.transform = `translateX(-${horizontalScrollDistance}px)`
  }
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault()

    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth',
    })
  })
})

// Scroll-triggered fade-in animation
const faders = document.querySelectorAll('section')

const appearOptions = {
  threshold: 0.1, // 觸發動畫的門檻，當區塊可見 10% 時觸發
  rootMargin: '0px 0px 0px 0px',
}

const appearOnScroll = new IntersectionObserver(function (
  entries,
  appearOnScroll
) {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) {
      return
    }
    entry.target.classList.add('fade-in')
    appearOnScroll.unobserve(entry.target)
  })
},
appearOptions)

faders.forEach((fader) => {
  appearOnScroll.observe(fader)
})

// Countdown Timer
const weddingDate = new Date('2025-10-25T12:00:00+0800').getTime()

const x = setInterval(function () {
  const now = new Date().getTime()
  const distance = weddingDate - now

  const days = Math.floor(distance / (1000 * 60 * 60 * 24))
  const hours = Math.floor(
    (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  )
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((distance % (1000 * 60)) / 1000)

  document.getElementById('days').textContent = days
  document.getElementById('hours').textContent = hours
  document.getElementById('minutes').textContent = minutes
  document.getElementById('seconds').textContent = seconds

  if (distance < 0) {
    clearInterval(x)
    const timerContainer = document.getElementById('timer')
    timerContainer.innerHTML = `<div class="timer-expired-message">婚禮已經開始！</div>`
  }
}, 1000)
