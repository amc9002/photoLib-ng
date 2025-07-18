import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, of, firstValueFrom } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { GalleryApiService } from './apiServices/gallery-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoggerService } from './logger.service';


export interface IConnectionService {
    isOnlineSnapshot(): boolean;
    checkConnection(): Promise<void>;
    isOnlineSnapshot(): boolean;
    checkConnection(): Promise<void>;
}


@Injectable({ providedIn: 'root' })
export class ConnectionService implements IConnectionService {
    private readonly checkIntervalMs = 10000;
    private lastKnownStatus = true;

    private onlineSubject = new BehaviorSubject<boolean>(true);
    public online$ = this.onlineSubject.asObservable();

    constructor(
        private logger: LoggerService,
        private galleryApi: GalleryApiService,
        private snackBar: MatSnackBar
    ) {
        this.startPeriodicCheck();
    }

    /** Актуальная вартасьць без падпіскі */
    public isOnlineSnapshot(): boolean {
        return this.onlineSubject.getValue();
    }

    /** Запусьціць ручную праверку сувязі */
    public async checkConnection(): Promise<void> {
        const isOnline = await firstValueFrom(
            this.galleryApi.pingServer().pipe(
                map(response => {
                    this.logger.log('--s', '📥 ConnectionService: pingServer response:', response);
                    return true;
                }),
                catchError(err => {
                    this.logger.warn('--s', '❌ ConnectionService: pingServer catchError', err);
                    return of(false);
                })
            )
        );

        this.logger.log('--s', '🔍 ConnectionService: checkConnection(): isOnline =', isOnline);
        this.handleStatusChange(isOnline);
    }

    /** Унутраны запуск пэрыядычнай праверкі */
    private startPeriodicCheck(): void {
        interval(this.checkIntervalMs)
            .pipe(switchMap(() => this.galleryApi.pingServer().pipe(
                map(() => true),
                catchError(() => of(false))
            )))
            .subscribe(isOnline => this.handleStatusChange(isOnline));
    }

    /** Апрацоўка зьмены статусу */
    private handleStatusChange(isOnline: boolean): void {
        if (isOnline !== this.lastKnownStatus) {
            this.lastKnownStatus = isOnline;
            this.onlineSubject.next(isOnline);

            if (isOnline) {
                this.snackBar.open('✅ Сувязь з серверам адноўлена.', 'ОК', { duration: 3000 });
            } else {
                this.snackBar.open('❌ Няма сувязі з серверам. Аўтаномны рэжым уключаны.', 'ОК', { duration: 5000 });
            }
        } else {
            // Абнаўляем стан, каб UI быў у курсе, нават калі нічога не зьмянілася (напрыклад, пры першым запуску)
            this.onlineSubject.next(isOnline);
        }
    }

}

