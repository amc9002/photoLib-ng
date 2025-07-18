import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoggerService } from '../logger.service';

export enum AppMode {
    Real = 'real',       // ✅ Нармальны рэжым — працуем з серверам
    Offline = 'offline', // 📴 Сервер недаступны — працуем з IndexedDB
    Demo = 'demo'        // 🧪 Дэма-рэжым — фэйкавыя даныя, няма IndexedDB
}

interface IAppModeService {
    setMode(mode: AppMode): void;
    getMode(): AppMode;
    isDemo(): boolean;
    isReal(): boolean;
    isOffline(): boolean;
}

@Injectable({ providedIn: 'root' })
export class AppModeService implements IAppModeService {

    private readonly STORAGE_KEY = 'app-mode';
    
    /** 🔄 Унутраны BehaviorSubject для рэжыму */
    private modeSubject = new BehaviorSubject<AppMode>(AppMode.Real);   // ✅ Default = Real
    
    /** 📡 Observable для падпісчыкаў */
    mode$: Observable<AppMode> = this.modeSubject.asObservable();

    constructor( private logger: LoggerService ) {
        const saved = localStorage.getItem(this.STORAGE_KEY) as AppMode;
        if (saved && Object.values(AppMode).includes(saved)) {
            this.modeSubject.next(saved);
        }
    }

    /** ⚙️ Усталяваць рэжым */
    setMode(mode: AppMode): void {
        this.logger.log('--s', `⚙️ AppModeService: Рэжым усталяваны: ${mode}`);
        this.modeSubject.next(mode);
        localStorage.setItem(this.STORAGE_KEY, mode);
    }

    /** 🔍 Атрымліваць рэжым непасрэдна */
    getMode(): AppMode {
        return this.modeSubject.getValue();
    }

    /** 🧪 Ці гэта дэма-рэжым */
    isDemo(): boolean {
        return this.getMode() === AppMode.Demo;
    }

    /** 📶 Ці працуем з сапраўдным серверам */
    isReal(): boolean {
        return this.getMode() === AppMode.Real;
    }

    /** 📴 Ці гэта аўтаномны рэжым */
    isOffline(): boolean {
        return this.getMode() === AppMode.Offline;
    }
}

