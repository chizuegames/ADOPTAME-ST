const coverScene = document.querySelector("#scene-cover");
const introScene = document.querySelector("#scene-intro");
const startButton = document.querySelector("#start-button");
const musicButton = document.querySelector("#music-button");
const musicIcon = document.querySelector("#music-icon");
const audioMessage = document.querySelector("#audio-message");
const backgroundMusic = document.querySelector("#background-music");

const MUSIC_VOLUME = 0.34;
const TRANSITION_TIME = 450;
let musicStarted = false;

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

  window.setTimeout(() => {
    coverScene.hidden = true;
    coverScene.classList.remove("is-active", "is-leaving");
    introScene.classList.remove("is-entering");
  }, TRANSITION_TIME);
}

startButton.addEventListener("click", () => {
  startButton.disabled = true;
  void startMusic();
  showIntroScene();
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
