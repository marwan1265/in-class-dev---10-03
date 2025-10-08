let spiderImg;
let canvasSize;
let spiders = [];
let shakeCount = 0;
let lastShakeTime = 0;
const SHAKE_COOLDOWN = 300; // milliseconds between shake detections
const SPIDERS_PER_SHAKE = 3;
const MAX_SPIDERS = 30;
let motionPermissionGranted = false;
let requestingMotionPermission = false;
let needsMotionPermission = false;
let permissionOverlay;
let permissionButton;

function preload() {
  spiderImg = loadImage('spider_gif.gif');
}

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('sketch-holder');
  imageMode(CENTER);
  angleMode(RADIANS);
  noStroke();
  setupMotionPrompt();
  setShakeThreshold(15);
  
  // Start with one spider in the center
  spawnSpider(width / 2, height / 2);
}

function draw() {
  // Dark spooky background
  background(0);
  
  // Update and draw all spiders
  for (let i = spiders.length - 1; i >= 0; i--) {
    const spider = spiders[i];
    updateSpider(spider);
    drawSpider(spider);
    
    // Remove spiders that are off screen
    if (isOffScreen(spider)) {
      spiders.splice(i, 1);
    }
  }
}

function spawnSpider(x, y) {
  if (spiders.length >= MAX_SPIDERS) {
    return;
  }
  
  const spider = {
    x: x || random(width),
    y: y || random(height),
    vx: random(-0.5, 0.5),
    vy: random(-0.5, 0.5),
    size: random(40, 80),
    rotation: random(TWO_PI),
    rotationSpeed: random(-0.01, 0.01),
    wiggleOffset: random(TWO_PI),
    wiggleSpeed: random(0.02, 0.05),
    alpha: 255,
    lifespan: random(5000, 10000), // milliseconds
    birthday: millis()
  };
  
  spiders.push(spider);
}

function updateSpider(spider) {
  // Move spider
  spider.x += spider.vx;
  spider.y += spider.vy;
  
  // Rotate spider
  spider.rotation += spider.rotationSpeed;
  
  // Wiggle effect
  spider.wiggleOffset += spider.wiggleSpeed;
  const wiggle = sin(spider.wiggleOffset) * 0.5;
  spider.vx += wiggle * 0.02;
  spider.vy += wiggle * 0.02;
  
  // Bounce off edges with some randomness
  if (spider.x < 0 || spider.x > width) {
    spider.vx *= -1;
    spider.vx += random(-0.1, 0.1);
  }
  if (spider.y < 0 || spider.y > height) {
    spider.vy *= -1;
    spider.vy += random(-0.1, 0.1);
  }
  
  // Fade out near end of lifespan
  const age = millis() - spider.birthday;
  if (age > spider.lifespan * 0.8) {
    const fadeProgress = (age - spider.lifespan * 0.8) / (spider.lifespan * 0.2);
    spider.alpha = 255 * (1 - fadeProgress);
  }
}

function drawSpider(spider) {
  push();
  translate(spider.x, spider.y);
  rotate(spider.rotation);
  tint(255, spider.alpha);
  image(spiderImg, 0, 0, spider.size, spider.size);
  pop();
}

function isOffScreen(spider) {
  const margin = 100;
  const age = millis() - spider.birthday;
  
  // Remove if too old
  if (age > spider.lifespan) {
    return true;
  }
  
  // Remove if way off screen
  return (
    spider.x < -margin ||
    spider.x > width + margin ||
    spider.y < -margin ||
    spider.y > height + margin
  );
}

function deviceShaken() {
  const now = millis();
  
  // Prevent shake spam
  if (now - lastShakeTime < SHAKE_COOLDOWN) {
    return;
  }
  
  lastShakeTime = now;
  shakeCount++;
  
  // Spawn multiple spiders on shake
  for (let i = 0; i < SPIDERS_PER_SHAKE; i++) {
    spawnSpider(random(width), random(height));
  }
  
  // Add some chaos - make existing spiders scatter
  for (const spider of spiders) {
    spider.vx += random(-1, 1);
    spider.vy += random(-1, 1);
    spider.rotationSpeed = random(-0.03, 0.03);
  }
}

function mousePressed() {
  if (!motionPermissionGranted) {
    requestMotionAccess();
  }
  // Desktop fallback - spawn spiders on click
  for (let i = 0; i < SPIDERS_PER_SHAKE; i++) {
    spawnSpider(mouseX + random(-30, 30), mouseY + random(-30, 30));
  }
}

function touchStarted() {
  if (!motionPermissionGranted) {
    requestMotionAccess();
    return false;
  }
  
  // Spawn spiders on tap
  for (let i = 0; i < SPIDERS_PER_SHAKE; i++) {
    if (touches.length > 0) {
      spawnSpider(touches[0].x + random(-30, 30), touches[0].y + random(-30, 30));
    }
  }
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function setupMotionPrompt() {
  permissionOverlay = document.getElementById('motion-overlay');
  permissionButton = document.getElementById('motion-btn');

  needsMotionPermission =
    typeof DeviceMotionEvent !== 'undefined' &&
    typeof DeviceMotionEvent.requestPermission === 'function';

  if (!needsMotionPermission) {
    motionPermissionGranted = true;
    hideMotionOverlay();
    return;
  }

  showMotionOverlay();

  const requestHandler = () => {
    requestMotionAccess();
  };

  if (permissionButton) {
    permissionButton.addEventListener('click', (event) => {
      event.preventDefault();
      requestHandler();
    });
  }

  window.addEventListener('touchend', requestHandler, { once: true });
  window.addEventListener('mousedown', requestHandler, { once: true });
}

async function requestMotionAccess() {
  if (!needsMotionPermission) {
    motionPermissionGranted = true;
    return true;
  }

  if (motionPermissionGranted || requestingMotionPermission) {
    return motionPermissionGranted;
  }

  requestingMotionPermission = true;

  try {
    const state = await DeviceMotionEvent.requestPermission();
    motionPermissionGranted = state === 'granted';

    if (motionPermissionGranted) {
      hideMotionOverlay();
    } else {
      showMotionOverlay('Tap to Enable Motion');
    }

    return motionPermissionGranted;
  } catch (err) {
    console.error('Motion permission request failed', err);
    showMotionOverlay('Try Again');
    return false;
  } finally {
    requestingMotionPermission = false;
  }
}

function showMotionOverlay(label) {
  if (permissionOverlay) {
    permissionOverlay.classList.remove('hidden');
  }
  if (permissionButton && label) {
    permissionButton.textContent = label;
  } else if (permissionButton && !label) {
    permissionButton.textContent = 'Enable Motion';
  }
}

function hideMotionOverlay() {
  if (permissionOverlay) {
    permissionOverlay.classList.add('hidden');
  }
}
