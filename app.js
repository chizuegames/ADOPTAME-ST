const coverScene = document.querySelector("#scene-cover");
const introScene = document.querySelector("#scene-intro");
const gameScene = document.querySelector("#scene-game");
const startButton = document.querySelector("#start-button");
const musicButton = document.querySelector("#music-button");
const musicIcon = document.querySelector("#music-icon");
const audioMessage = document.querySelector("#audio-message");
const backgroundMusic = document.querySelector("#background-music");
const story = document.querySelector(".story");
const storyMenu = document.querySelector("#story-menu");
const closeMenuButton = document.querySelector("#close-menu");
const menuPartButtons = [...document.querySelectorAll("[data-part]")];

const MUSIC_VOLUME = 0.34;
const TRANSITION_TIME = 450;
const DOUBLE_TAP_DELAY = 300;
const HOLD_DURATION = 650;
const MOVE_TOLERANCE = 14;
const storyParts = [introScene, gameScene];
let musicStarted = false;
let adventureStarted = false;
let currentPart = -1;
let furthestPart = -1;
let tapTimer = null;
let lastTapAt = 0;
let holdTimer = null;
let activePointer = null;
let longPressTriggered = false;

function fadeMusic(targetVolume, duration = 1100) {
  const initialVolume = backgroundMusic.volume;
  const startedAt = performance.now();

  function updateVolume(now) {
    const progress = Math.min((now - startedAt) / duration, 1);
    backgroundMusic.volume = initialVolume + (targetVolume - initialVolume) * progress;

    if (progress < 1) {
      requestAnimationFrame(updateVolume);
    }
  }

  requestAnimationFrame(updateVolume);
}

async function startMusic() {
  backgroundMusic.volume = 0;

  try {
    await backgroundMusic.play();
    musicStarted = true;
    fadeMusic(MUSIC_VOLUME);
  } catch (error) {
    musicStarted = false;
    audioMessage.textContent = "No fue posible iniciar la música. Puedes activarla con el botón ♫.";
  }
}

function showIntroScene() {
  coverScene.classList.add("is-leaving");
  introScene.hidden = false;
  introScene.classList.add("is-active", "is-entering");
  currentPart = 0;
  furthestPart = Math.max(furthestPart, currentPart);
  adventureStarted = true;

  window.setTimeout(() => {
    coverScene.hidden = true;
    coverScene.classList.remove("is-active", "is-leaving");
    introScene.classList.remove("is-entering");
  }, TRANSITION_TIME);
}

function showPart(nextPart) {
  const targetPart = Math.max(0, Math.min(nextPart, storyParts.length - 1));

  if (!adventureStarted || targetPart === currentPart) {
    return;
  }

  const previousScene = storyParts[currentPart];
  const nextScene = storyParts[targetPart];

  previousScene.classList.remove("is-active", "is-entering");
  previousScene.hidden = true;
  nextScene.hidden = false;
  nextScene.classList.add("is-active", "is-entering");

  window.setTimeout(() => nextScene.classList.remove("is-entering"), TRANSITION_TIME);

  currentPart = targetPart;
  furthestPart = Math.max(furthestPart, currentPart);
}

function nextPart() {
  if (currentPart < storyParts.length - 1) {
    showPart(currentPart + 1);
  }
}

function previousPart() {
  if (currentPart > 0) {
    showPart(currentPart - 1);
  }
}

function updateMenu() {
  menuPartButtons.forEach((button) => {
    const part = Number(button.dataset.part);
    button.disabled = part > furthestPart;
    button.setAttribute("aria-current", part === currentPart ? "step" : "false");
  });
}

function openMenu() {
  if (!adventureStarted) {
    return;
  }

  window.clearTimeout(tapTimer);
  tapTimer = null;
  updateMenu();
  storyMenu.hidden = false;
  closeMenuButton.focus();
}

function closeMenu() {
  storyMenu.hidden = true;
}

function isInteractiveTarget(target) {
  return Boolean(target.closest("button, a, input, textarea, select, [role='dialog']"));
}

function cancelHold() {
  window.clearTimeout(holdTimer);
  holdTimer = null;
}

startButton.addEventListener("click", () => {
  startButton.disabled = true;
  void startMusic();
  showIntroScene();
});

story.addEventListener("pointerdown", (event) => {
  if (!adventureStarted || !storyMenu.hidden || isInteractiveTarget(event.target)) {
    return;
  }

  activePointer = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
  };
  longPressTriggered = false;
  cancelHold();
  holdTimer = window.setTimeout(() => {
    longPressTriggered = true;
    openMenu();
  }, HOLD_DURATION);
});

story.addEventListener("pointermove", (event) => {
  if (!activePointer || event.pointerId !== activePointer.id) {
    return;
  }

  const distance = Math.hypot(event.clientX - activePointer.x, event.clientY - activePointer.y);
  if (distance > MOVE_TOLERANCE) {
    cancelHold();
  }
});

story.addEventListener("pointerup", (event) => {
  if (!activePointer || event.pointerId !== activePointer.id) {
    return;
  }

  cancelHold();
  activePointer = null;

  if (longPressTriggered || !storyMenu.hidden || isInteractiveTarget(event.target)) {
    return;
  }

  const now = Date.now();
  const isDoubleTap = now - lastTapAt <= DOUBLE_TAP_DELAY;
  lastTapAt = now;

  if (isDoubleTap) {
    window.clearTimeout(tapTimer);
    tapTimer = null;
    lastTapAt = 0;
    previousPart();
    return;
  }

  window.clearTimeout(tapTimer);
  tapTimer = window.setTimeout(() => {
    nextPart();
    tapTimer = null;
  }, DOUBLE_TAP_DELAY);
});

story.addEventListener("pointercancel", () => {
  cancelHold();
  activePointer = null;
});

story.addEventListener("contextmenu", (event) => {
  if (adventureStarted) {
    event.preventDefault();
  }
});

closeMenuButton.addEventListener("click", closeMenu);

menuPartButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const part = Number(button.dataset.part);
    if (part <= furthestPart) {
      showPart(part);
      closeMenu();
    }
  });
});

musicButton.addEventListener("click", async () => {
  if (!musicStarted || backgroundMusic.paused) {
    try {
      backgroundMusic.volume = MUSIC_VOLUME;
      await backgroundMusic.play();
      musicStarted = true;
      musicIcon.textContent = "♫";
      musicButton.setAttribute("aria-label", "Silenciar música");
    } catch (error) {
      musicButton.setAttribute("aria-label", "No fue posible activar la música");
    }
    return;
  }

  backgroundMusic.pause();
  musicIcon.textContent = "♪̸";
  musicButton.setAttribute("aria-label", "Activar música");
});
