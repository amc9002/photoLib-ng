import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LoggerService {
    private showHiddenLogs = false;

    showAll(): void {
        this.showHiddenLogs = true;
    }

    hideHidden(): void {
        this.showHiddenLogs = false;
    }

    log(...args: any[]): void {
        if (this.shouldShow(args)) {
            console.log(...this.stripFlags(args));
        }
    }

    warn(...args: any[]): void {
        if (this.shouldShow(args)) {
            console.warn(...this.stripFlags(args));
        }
    }

    error(...args: any[]): void {
        if (this.shouldShow(args)) {
            console.error(...this.stripFlags(args));
        }
    }

    info(...args: any[]): void {
        if (this.shouldShow(args)) {
            console.info(...this.stripFlags(args));
        }
    }

    private shouldShow(args: any[]): boolean {
        const flags = args.filter(a => typeof a === 'string' && a.startsWith('--'));
        if (flags.includes('--h')) return this.showHiddenLogs;
        return true; // па змаўчанні паказваць
    }

    private stripFlags(args: any[]): any[] {
        return args.filter(a => typeof a !== 'string' || !a.startsWith('--'));
    }
}
