import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';
import { app, dialog, BrowserWindow, Notification, MessageBoxReturnValue } from 'electron';

export class AutoUpdater {
  private mainWindow: BrowserWindow | null = null;
  private updateAvailable = false;

  constructor() {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    this.setupEventListeners();
  }

  setMainWindow(window: BrowserWindow | null): void {
    this.mainWindow = window;
  }

  private setupEventListeners(): void {
    autoUpdater.on('checking-for-update', () => {
      console.log('[SPK] Checking for updates...');
    });

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      console.log('[SPK] Update available:', info.version);
      this.updateAvailable = true;
      
      if (Notification.isSupported()) {
        new Notification({
          title: 'SPK Desktop Agent Update',
          body: `Version ${info.version} is available and downloading...`,
        }).show();
      }
    });

    autoUpdater.on('update-not-available', () => {
      console.log('[SPK] App is up to date');
    });

    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
      console.log(`[SPK] Download progress: ${Math.round(progress.percent)}%`);
    });

    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      console.log('[SPK] Update downloaded:', info.version);
      
      dialog.showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: `Version ${info.version} has been downloaded.`,
        detail: 'The update will be installed when you restart the app.',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
      }).then((result: MessageBoxReturnValue) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall(false, true);
        }
      });
    });

    autoUpdater.on('error', (error: Error) => {
      console.error('[SPK] Auto-updater error:', error.message);
    });
  }

  async checkForUpdates(): Promise<void> {
    if (app.isPackaged) {
      try {
        await autoUpdater.checkForUpdates();
      } catch (error: any) {
        console.error('[SPK] Failed to check for updates:', error.message);
      }
    } else {
      console.log('[SPK] Skipping update check in development mode');
    }
  }

  isUpdateAvailable(): boolean {
    return this.updateAvailable;
  }
}
