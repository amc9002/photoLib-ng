import { Injectable } from '@angular/core';
import { ManagerService } from '../manager.service';
import { AppMode, AppModeService } from '../utilServices/app-mode.service';
import { ConnectionService } from '../connection.service';
import { IndexedDbService } from '../indexedDbServices/indexedDb.service';
import { LoggerService } from '../logger.service';


export interface IAppInitializerService {
  /**
 * Ініцыялізуе прыкладанне:
 * - вызначае рэжым працы (Demo / Real / Offline)
 * - правярае падключэнне да сервера
 * - адкрывае IndexedDB і робіць яе даступнай праз IndexedDbService
 * - выклікае агульную ініцыялізацыю прыкладання (ManagerService.initApp)
 */
  initializeApp(): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class AppInitializerService implements IAppInitializerService {
  constructor(
    private connectionService: ConnectionService,
    private appModeService: AppModeService,
    private managerService: ManagerService,
    private indexedDbService: IndexedDbService,
    private logger: LoggerService
  ) { }

  async initializeApp(): Promise<void> {
    if (!this.appModeService.isDemo()) {
      try {
        await this.connectionService.checkConnection();

        if (this.connectionService.isOnlineSnapshot()) {
          this.appModeService.setMode(AppMode.Real);
          console.log('🟢 Сервер даступны: пераход у Real');
        } else {
          this.appModeService.setMode(AppMode.Offline);
          console.warn('🟠 Сервер недаступны: пераход у Offline');
        }
      } catch (e) {
        this.appModeService.setMode(AppMode.Offline);
        console.warn('🔴 Памылка пры падключэнні да сервера:', e);
      }
    }

    const DB_NAME = 'PhotoLibDB';
    const DB_VERSION = 1;

    const db = await this.indexedDbService.initDB(DB_NAME, DB_VERSION, (db) => {
      if (!db.objectStoreNames.contains('galleries')) {
        db.createObjectStore('galleries', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('photos')) {
        db.createObjectStore('photos', { keyPath: 'id' });
      }
    });

    this.logger.log('--s', '✅ AppInitializerService: IndexedDB ініцыялізаваная');

    await this.managerService.initApp();
  }
}
