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
const menuStepButtons = [...document.querySelectorAll("[data-step]")];
const gameDialogue = document.querySelector("#game-dialogue");

const MUSIC_VOLUME = 0.34;
const TRANSITION_TIME = 450;
const DOUBLE_TAP_DELAY = 300;
const HOLD_DURATION = 650;
const MOVE_TOLERANCE = 14;
const storySteps = [
  {
    scene: introScene,
    dialogue: "",
  },
  {
    scene: gameScene,
    dialogue:
      "Hola de nuevo, amigos de los animales. Soy Alexandra, fundadora de la Fundación Corazón Peludito, y quiero invitarlos a conocer cómo comenzó todo.",
  },
  {
    scene: gameScene,
    dialogue:
      "Antes de comenzar, un pequeño recordatorio: con un toque avanzamos y con dos retrocedemos. Si quieren abrir el menú, solo tienen que mantener pulsada la pantalla.",
  },
];
let musicStarted = false;
let adventureStarted = false;
let currentStep = -1;
let furthestStep = -1;
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
  currentStep = 0;
  furthestStep = Math.max(furthestStep, currentStep);
  adventureStarted = true;

  window.setTimeout(() => {
    coverScene.hidden = true;
    coverScene.classList.remove("is-active", "is-leaving");
    introScene.classList.remove("is-entering");
  }, TRANSITION_TIME);
}

function showStep(nextStep) {
  const targetStep = Math.max(0, Math.min(nextStep, storySteps.length - 1));

  if (!adventureStarted || targetStep === currentStep) {
    return;
  }

  const previousScene = storySteps[currentStep].scene;
  const nextScene = storySteps[targetStep].scene;

  if (previousScene !== nextScene) {
    previousScene.classList.remove("is-active", "is-entering");
    previousScene.hidden = true;
    nextScene.hidden = false;
    nextScene.classList.add("is-active", "is-entering");

    window.setTimeout(() => nextScene.classList.remove("is-entering"), TRANSITION_TIME);
  }

  gameDialogue.textContent = storySteps[targetStep].dialogue;
  currentStep = targetStep;
  furthestStep = Math.max(furthestStep, currentStep);
}

function nextStep() {
  if (currentStep < storySteps.length - 1) {
    showStep(currentStep + 1);
  }
}

function previousStep() {
  if (currentStep > 0) {
    showStep(currentStep - 1);
  }
}

function updateMenu() {
  menuStepButtons.forEach((button) => {
    const step = Number(button.dataset.step);
    button.disabled = step > furthestStep;
    button.setAttribute("aria-current", step === currentStep ? "step" : "false");
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
    previousStep();
    return;
  }

  window.clearTimeout(tapTimer);
  tapTimer = window.setTimeout(() => {
    nextStep();
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

menuStepButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const step = Number(button.dataset.step);
    if (step <= furthestStep) {
      showStep(step);
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
