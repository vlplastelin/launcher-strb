const { app, BrowserWindow, Menu } = require('electron')
const { ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

const { Client, Authenticator } = require('minecraft-launcher-core');

const { updateFiles } = require('./updater');

const launcher = new Client();

function getResourcePath(...subPath) {
  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    // Portable build → реальная папка рядом с exe
    return path.join(process.env.PORTABLE_EXECUTABLE_DIR, ...subPath);
  } else if (app.isPackaged) {
    // Обычная сборка (nsis, zip и т.п.)
    return path.join(path.dirname(process.execPath), ...subPath);
  } else {
    // Dev-режим
    return path.join(__dirname,"..",...subPath);
  }
}

let opts = {
    // For production launchers, I recommend not passing 
    // the getAuth function through the authorization field and instead
    // handling authentication outside before you initialize
    // MCLC so you can handle auth based errors and validation!
    authorization: {
    access_token: 'null',
    client_token: 'null',
    uuid: '1234567890abcdef1234567890abcdef', // можно сгенерировать случайный
    name: 'OfflinePlayer', // имя игрока
    user_properties: '{}',
    meta: {
      type: 'mojang'
    }
  },
    //javaPath: path.join(__dirname,"../jdk-17.0.16/bin/java.exe"),
    javaPath: getResourcePath("minecraft","jdk-17.0.16","bin","java.exe"),
    root: getResourcePath("minecraft"),
    version: {
        number: "1.20.1",
        type: "release"
    },
    forge: getResourcePath("minecraft","forge-1.20.1-47.4.9-installer.jar"),
    memory: {
        max: "6G",
        min: "4G"
    }
}
launcher.on('debug', (e) => console.log(e));
launcher.on('data', (e) => console.log(e));
launcher.on('progress', (e) => {
  console.log(e);
});

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.loadFile('index.html')
}

ipcMain.on('start-minecraft', (event) => {
    console.log('Starting Minecraft...');
  // Здесь вызывается нужная функция
  launcher.launch(opts);
});

app.whenReady().then(() => {
  createWindow();
  // Remove the default application menu (File/Edit/View/Help)
  // This hides the menu bar on Windows and other platforms
  try {
    Menu.setApplicationMenu(null);
  } catch (err) {
    console.error('Failed to remove application menu:', err);
  }
  // run updater but protect against errors so UI still opens
  try {
    updateFiles(getResourcePath("/"));
  } catch (err) {
    console.error('Updater failed:', err);
  }
  // auto-updater: check and install automatically
  try {
    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update downloaded, installing...');
      try {
        // install immediately and restart
        autoUpdater.quitAndInstall();
      } catch (e) {
        console.error('Failed to quit and install update:', e);
      }
    });
  } catch (err) {
    console.error('autoUpdater failed:', err);
  }
})