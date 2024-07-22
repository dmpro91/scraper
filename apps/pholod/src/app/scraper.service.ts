import { Injectable, inject } from '@angular/core';
import { WSEventsEnum, WSProgress } from '@core';

import { Socket } from 'ngx-socket-io';

@Injectable()
export class ScrapperService {
    private socket = inject(Socket);

    public icetecoEvent$ = this.socket.fromEvent<any>(WSEventsEnum.iceteco);
    public wsConnectedEvent$ = this.socket.fromEvent<boolean>(WSEventsEnum.service);
    public wsProgress$ = this.socket.fromEvent<WSProgress>(WSEventsEnum.progress);

    public getIceteco(): void {
        this.socket.emit(WSEventsEnum.iceteco);
    }
}