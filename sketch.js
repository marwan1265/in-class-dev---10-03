let dogeImg;
let canvasSize;
let burstParticles = [];
let burstActive = false;
let burstStartedAt = 0;
const BURST_DURATION = 600; // milliseconds
const PARTICLE_COUNT = 24;
let permissionBtn;

function preload() {
  dogeImg = loadImage(DOGE_DATA_URI);
}

function setup() {
  canvasSize = computeCanvasSize();
  const canvas = createCanvas(canvasSize, canvasSize);
  canvas.parent('sketch-holder');
  imageMode(CENTER);
  angleMode(RADIANS);
  noStroke();
  setupPermissionButton();
  setShakeThreshold(15);
}

function draw() {
  background(255, 247, 216);
  translate(width / 2, height / 2);

  const tiltAngle = radians(getTiltAngle());
  rotate(tiltAngle);
  const scaleFactor = 0.8;
  image(dogeImg, 0, 0, dogeImg.width * scaleFactor, dogeImg.height * scaleFactor);

  updateBurst();
}

function getTiltAngle() {
  if (typeof rotationZ === 'number') {
    return rotationZ;
  }
  const offset = map(mouseX || width / 2, 0, width, -45, 45);
  return offset;
}

function updateBurst() {
  if (!burstActive) {
    return;
  }

  const elapsed = millis() - burstStartedAt;
  if (elapsed > BURST_DURATION) {
    burstActive = false;
    burstParticles = [];
    return;
  }

  const progress = elapsed / BURST_DURATION;
  const alpha = map(progress, 0, 1, 255, 0);

  for (const particle of burstParticles) {
    particle.position.add(particle.velocity);
    particle.velocity.mult(0.95);
    particle.size *= 0.98;
    fill(particle.color[0], particle.color[1], particle.color[2], alpha);
    circle(particle.position.x, particle.position.y, Math.max(2, particle.size));
  }
}

function deviceShaken() {
  triggerBurst();
}

function mousePressed() {
  // Handy fallback while testing on desktop.
  triggerBurst();
}

function triggerBurst() {
  burstActive = true;
  burstStartedAt = millis();
  burstParticles = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const direction = p5.Vector.random2D();
    const speed = random(4, 9);
    burstParticles.push({
      position: createVector(0, 0),
      velocity: direction.mult(speed),
      size: random(12, 26),
      color: randomBurstColor()
    });
  }
}

function randomBurstColor() {
  const palette = [
    [255, 196, 12],
    [255, 111, 0],
    [204, 51, 255],
    [51, 153, 255]
  ];
  return random(palette);
}

function windowResized() {
  canvasSize = computeCanvasSize();
  resizeCanvas(canvasSize, canvasSize);
}

function computeCanvasSize() {
  const wrapper = document.querySelector('.canvas-wrapper');
  if (wrapper) {
    const rect = wrapper.getBoundingClientRect();
    return Math.min(rect.width, rect.height);
  }
  return Math.min(windowWidth, windowHeight) * 0.8;
}

function setupPermissionButton() {
  permissionBtn = select('#permission-btn');
  if (!permissionBtn) {
    return;
  }

  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    permissionBtn.removeAttribute('hidden');
    permissionBtn.mousePressed(async () => {
      const state = await DeviceMotionEvent.requestPermission();
      if (state === 'granted') {
        permissionBtn.attribute('hidden', true);
      }
    });
  }
}

function touchStarted() {
  if (permissionBtn && !permissionBtn.elt.hidden) {
    permissionBtn.elt.click();
  }
  return false;
}
