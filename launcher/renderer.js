console.log('Renderer process loaded');

// Ждем загрузки DOM
document.addEventListener('DOMContentLoaded',async  () => {
  
  
  // Проверяем наличие electronAPI
  if (!window.electronAPI) {
    console.error('electronAPI not found!');
    return;
  }

  
  showProgress();
  await updateLauncher();
  startMinecraft();

});

async function updateLauncher() {
  console.log('Requesting update check...');
  await customElements.whenDefined('sl-dialog');
  const updateDialog = document.querySelector('#launcher-update');
  updateDialog.show();
  await window.electronAPI.requestUpdate();
  window.electronAPI.noUpdate(async() => {
    updateDialog.hide();
  });
}

async function startMinecraft() {
  //добавляем type="submit" к кнопке
  const playButton = document.querySelector('#play-button');
  playButton.setAttribute('type', 'submit');
  const loginForm = document.querySelector('#login-form');
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Предотвращаем стандартное поведение формы
    let form = document.querySelector('#login-form');
    let username = form.querySelector('sl-input[type="text"]').value;
    if (!username || username.trim() === '') {
      return;
    }
    await window.electronAPI.startMinecraft({username});
  });
}

async function showProgress() {
window.electronAPI.updateProgress(async (progress) => {
    await customElements.whenDefined('sl-dialog');

    const loadingProgressDialog = document.querySelector('#loading-progress');
    if (!loadingProgressDialog.open) {
      loadingProgressDialog.show();
    }
    const progressBar = document.querySelector('#loading-progress sl-progress-bar');
    progressBar.value = progress;
    if (progress >= 100) {
      setTimeout(() => {
        loadingProgressDialog.hide();
      }, 2000);
    }
  });
}