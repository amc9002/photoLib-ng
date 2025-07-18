import { Injectable } from '@angular/core';
import { LoggerService } from '../logger.service';

export type UpgradeCallback = (db: IDBDatabase) => void;

    /** 🧩 Агульны інтэрфейс для працы з IndexedDB */
export interface IIndexedDbService {
    performTransaction<T>(
        dbName: string,
        storeName: string,
        mode: IDBTransactionMode,
        operation: (store: IDBObjectStore, tx: IDBTransaction) => Promise<T> | T
    ): Promise<T>;
    initDB(dbName: string, version: number, onUpgradeNeeded?: UpgradeCallback): Promise<IDBDatabase>;
    waitForDbReady(dbName: string): Promise<IDBDatabase>;
    getDbOrThrow(dbName: string): Promise<IDBDatabase>;
    getAll(storeName: string, dbName: string): Promise<any[]>;
}

@Injectable({
    providedIn: 'root'
})
export class IndexedDbService implements IIndexedDbService {
    private dbs = new Map<string, IDBDatabase>();
    private dbReadyPromises = new Map<string, Promise<IDBDatabase>>();

    constructor(private logger: LoggerService) {
        this.logger.log('--s', '🗄️ IndexedDbService: базавы сэрвіс створаны');
    }

    /**
     * Выконвае транзакцыю над указанай IndexedDB базай і сховішчам.
     * @param dbName Назва базы (звычайна `PHOTO_DB_NAME`)
     * @param storeName Назва сховішча
     * @param mode Рэжым транзакцыі: "readonly" або "readwrite"
     * @param operation Функцыя, якая працуе са store і tx
     */
    public async performTransaction<T>(
        dbName: string,
        storeName: string,
        mode: IDBTransactionMode,
        operation: (store: IDBObjectStore, tx: IDBTransaction) => Promise<T> | T
    ): Promise<T> {
        const db = await this.getDbOrThrow(dbName);

        return new Promise<T>((resolve, reject) => {
            const tx = db.transaction([storeName], mode);
            const store = tx.objectStore(storeName);

            Promise.resolve(operation(store, tx))
                .then(result => {
                    tx.oncomplete = () => resolve(result);
                    tx.onerror = () => reject(tx.error);
                    tx.onabort = () => reject(tx.error);
                })
                .catch(error => {
                    tx.abort();
                    reject(error);
                });
        });
    }

    /**
     * Ініцыялізацыя базы дадзеных
     * @param dbName Назва базы
     * @param version Версія базы
     * @param onUpgradeNeeded Калбэк для стварэння/абнаўлення stores
     */
    initDB(dbName: string, version = 1, onUpgradeNeeded?: UpgradeCallback): Promise<IDBDatabase> {
        this.logger.log('--s', `📂 initDB: name=${dbName}, version=${version}`);

        const promise = new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(dbName, version);

            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                const db = (event.target as IDBOpenDBRequest).result;
                this.logger.log('--s', '📈 IndexedDbService: onupgradeneeded triggered for', db.name, db.version);
                if (onUpgradeNeeded) {
                    onUpgradeNeeded(db);
                }
            };

            request.onsuccess = () => {
                const db = request.result;
                this.dbs.set(dbName, db);
                this.logger.log('--s', `📂 IndexedDbService: база "${dbName}" адкрыта`);
                resolve(db);
            };

            request.onerror = () => {
                this.logger.error('--s', `❌ IndexedDbService: памылка пры адкрыцці базы "${dbName}"`, request.error);
                reject(request.error);
            };
        });

        this.dbReadyPromises.set(dbName, promise);
        return promise;
    }

    /**
     * Чаканне гатоўнасці базы (напрыклад, калі яна адкрываецца іншым сэрвісам)
     * @param dbName Назва базы
     */
    waitForDbReady(dbName: string): Promise<IDBDatabase> {
        const promise = this.dbReadyPromises.get(dbName);
        if (!promise) {
            throw new Error(`IndexedDbService: база "${dbName}" яшчэ не ініцыялізаваная.`);
        }
        return promise;
    }

    /**
     * Атрымлівае базу або кідае памылку, калі яна недаступная
     * @param dbName Назва базы
     */
    async getDbOrThrow(dbName: string): Promise<IDBDatabase> {
        const db = this.dbs.get(dbName);
        if (db) return db;

        this.logger.warn('--s', `🕓 getDbOrThrow: база "${dbName}" не знойдзена, чакаем init...`);
        return await this.waitForDbReady(dbName);
    }

    /**
     * Атрымлівае ўсе элементы з store
     * @param storeName Назва store
     * @param dbName Назва базы
     */
    async getAll(storeName: string, dbName: string): Promise<any[]> {
        const db = await this.getDbOrThrow(dbName);
        return new Promise((resolve, reject) => {
            const tx = db.transaction([storeName], 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                this.logger.log('--s', `📥 getAll: атрымана ${request.result.length} элементаў з "${storeName}"`);
                resolve(request.result);
            };

            request.onerror = () => {
                this.logger.error('--s', `❌ getAll: памылка пры чытанні з "${storeName}"`, request.error);
                reject(request.error);
            };
        });
    }
}
