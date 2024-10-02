import { Injectable, inject } from '@angular/core';
import { WSEventsEnum, WSProgress } from '@core';

import { Socket } from 'ngx-socket-io';

@Injectable()
export class ScrapperService {
    private socket = inject(Socket);

    public icetecoEvent$ = this.socket.fromEvent<any>(WSEventsEnum.iceteco);
    public pholodoEvent$ = this.socket.fromEvent<any>(WSEventsEnum.pholod);
    public wsConnectedEvent$ = this.socket.fromEvent<boolean>(WSEventsEnum.service);
    public wsProgress$ = this.socket.fromEvent<WSProgress>(WSEventsEnum.progress);

    public getDataFromScraper(site: WSEventsEnum.iceteco | WSEventsEnum.pholod): void {
        this.socket.emit(site);
    }
}