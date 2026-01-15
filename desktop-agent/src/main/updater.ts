import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';
import { app, dialog, BrowserWindow, Notification } from 'electron';

export class AutoUpdater {
  private mainWindow: BrowserWindow | null = null;
  private updateAvailable = false;
  private downloadProgress = 0;

  constructor() {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowDowngrade = false;
    autoUpdater.allowPrerelease = false;

    this.setupEventListeners();
    this.logConfig();
  }

  private logConfig(): void {
    console.log('[SPK] Auto-updater initialized');
    console.log('[SPK] App version:', app.getVersion());
    console.log('[SPK] Is packaged:', app.isPackaged);
    console.log('[SPK] Auto download:', autoUpdater.autoDownload);
    console.log('[SPK] Auto install on quit:', autoUpdater.autoInstallOnAppQuit);
  }

  setMainWindow(window: BrowserWindow | null): void {
    this.mainWindow = window;
  }

  private setupEventListeners(): void {
    autoUpdater.on('checking-for-update', () => {
      console.log('[SPK] Checking for updates...');
      this.sendStatusToWindow('Checking for updates...');
    });

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      console.log('[SPK] Update available:', info.version);
      console.log('[SPK] Release date:', info.releaseDate);
      this.updateAvailable = true;
      
      this.sendStatusToWindow(`Update ${info.version} available, downloading...`);
      
      if (Notification.isSupported()) {
        new Notification({
          title: 'SPK Desktop Agent Update',
          body: `Version ${info.version} is available and downloading...`,
          icon: undefined,
        }).show();
      }
    });

    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
      console.log('[SPK] App is up to date:', info.version);
      this.sendStatusToWindow('App is up to date');
    });

    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
      this.downloadProgress = progress.percent;
      const msg = `Download progress: ${Math.round(progress.percent)}% (${this.formatBytes(progress.transferred)}/${this.formatBytes(progress.total)})`;
      console.log(`[SPK] ${msg}`);
      this.sendStatusToWindow(msg);
    });

    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      console.log('[SPK] Update downloaded:', info.version);
      this.sendStatusToWindow(`Update ${info.version} ready to install`);
      
      dialog.showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: `Version ${info.version} has been downloaded.`,
        detail: 'The update will be installed when you restart the app. Would you like to restart now?',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
        cancelId: 1,
      }).then((result) => {
        if (result.response === 0) {
          console.log('[SPK] User chose to restart and install update');
          autoUpdater.quitAndInstall(false, true);
        } else {
          console.log('[SPK] User chose to install update later');
        }
      });
    });

    autoUpdater.on('error', (error: Error) => {
      console.error('[SPK] Auto-updater error:', error.message);
      console.error('[SPK] Error stack:', error.stack);
      this.sendStatusToWindow(`Update error: ${error.message}`);
    });
  }

  private sendStatusToWindow(message: string): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('update-status', message);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async checkForUpdates(): Promise<void> {
    if (!app.isPackaged) {
      console.log('[SPK] Skipping update check in development mode');
      return;
    }

    try {
      console.log('[SPK] Initiating update check...');
      const result = await autoUpdater.checkForUpdates();
      if (result) {
        console.log('[SPK] Update check result:', {
          version: result.updateInfo.version,
          releaseDate: result.updateInfo.releaseDate,
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[SPK] Failed to check for updates:', errorMessage);
    }
  }

  async checkForUpdatesAndNotify(): Promise<void> {
    if (!app.isPackaged) {
      console.log('[SPK] Skipping update check in development mode');
      return;
    }

    try {
      await autoUpdater.checkForUpdatesAndNotify();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[SPK] Failed to check for updates:', errorMessage);
    }
  }

  isUpdateAvailable(): boolean {
    return this.updateAvailable;
  }

  getDownloadProgress(): number {
    return this.downloadProgress;
  }

  getCurrentVersion(): string {
    return app.getVersion();
  }

  quitAndInstall(): void {
    autoUpdater.quitAndInstall(false, true);
  }
}
