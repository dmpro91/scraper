import { Component, OnInit, inject, signal } from '@angular/core';

import { ScrapperService } from './scraper.service';
import { debounceTime, tap } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { WSEventsEnum, WSProgress, XLSXHelper } from '@core';
import { CommonModule } from '@angular/common';
import { StubData } from './data';

@Component({
    standalone: true,
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    imports: [MatButtonModule, MatProgressBarModule, CommonModule],
})
export class AppComponent implements OnInit {
    public wsConnected = signal<boolean>(false);
    public wsProgress = signal<WSProgress | null>(null);
  
    private scrapperService = inject(ScrapperService);

    ngOnInit(): void {
        this.scrapperService.wsConnectedEvent$.subscribe((res) => this.wsConnected.set(res));
        this.scrapperService.wsProgress$.subscribe((res) => this.wsProgress.set(res));
    }

    public scrapIceteco(): void {
        this.scrapperService.icetecoEvent$
            .pipe(tap((res) => console.log(res)))
            .subscribe((data: Record<string, unknown[]>) => this.downloadExcelFile(data));
        this.scrapperService.getDataFromScraper(WSEventsEnum.iceteco);
    }

    public scrapPholod(): void {
        this.scrapperService.pholodoEvent$
            .pipe(tap((res) => console.log(res)))
            .subscribe((data: Record<string, unknown[]>) => {});
            this.scrapperService.getDataFromScraper(WSEventsEnum.pholod);
    }

    public downloadExcelFile(data: Record<string, unknown[]>): void {
        const workbook = XLSXHelper.createWorkbook();

        Object.entries(data).forEach(([category, dataRow], index) => {
            const worksheet = XLSXHelper.jsonToSheet(dataRow);
            XLSXHelper.appendSheetToBook(workbook, worksheet, XLSXHelper.sheetNameWithLimits(`${index+1}`));
        });

        XLSXHelper.writeAndDownloadFile(workbook);
    }
}
