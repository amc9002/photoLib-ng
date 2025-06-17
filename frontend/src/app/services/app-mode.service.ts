import { Injectable } from "@angular/core";
import { BehaviorSubject } from 'rxjs';
import { AppMode } from '../shared/app-mode.enum';

@Injectable({ providedIn: 'root' })
export class AppModeService {
    private modeSubject = new BehaviorSubject<AppMode>(AppMode.Work); // default: Work
    mode$ = this.modeSubject.asObservable();

    setMode(mode: AppMode) {
        this.modeSubject.next(mode);
    }

    getMode(): AppMode {
        return this.modeSubject.getValue();
    }

    isDemo(): boolean {
        return this.getMode() === AppMode.Demo;
    }
}

