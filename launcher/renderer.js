console.log('Renderer process loaded');

// Ждем загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded');
  
  // Проверяем наличие electronAPI
  if (!window.electronAPI) {
    console.error('electronAPI not found!');
    return;
  }
  
  const button = document.getElementById('start-minecraft');
  if (!button) {
    console.error('Button start-minecraft not found!');
    return;
  }
  
  console.log('Adding click listener to button');
  button.addEventListener('click', () => {
    console.log('Start button clicked');
    window.electronAPI.startMinecraft();
  });
});
