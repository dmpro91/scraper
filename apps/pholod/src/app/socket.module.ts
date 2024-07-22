import { NgModule } from '@angular/core';

import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { ScrapperService } from './scraper.service';


const config: SocketIoConfig = { url: 'http://localhost:3000/', options: {} };


@NgModule({
    imports: [SocketIoModule.forRoot(config)],
    providers: [ScrapperService]
})
export class SocketModule { }
