export enum WSEventsEnum {
    service = 'service',
    iceteco = 'iceteco',
    pholod = 'pholod',
    progress = 'progress'
}

import {ProgressBarMode} from '@angular/material/progress-bar';
export interface WSProgress {
    count: number;
    label: string;
    type?: ProgressBarMode
}
