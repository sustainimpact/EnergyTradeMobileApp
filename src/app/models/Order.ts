import { IonDatetime } from '@ionic/angular';

export class Order{
    orderId?: any;
    sellerId?: any;
    deviceId?: any;
    orderType?: string;
    deviceName?: string;
    powerToSell?: number;
    transferStartTs?: string;
    transferEndTs?: string;
    duration?: number;
    ratePerUnit?: number;
    totalAmount?: number;
    budgerRange?: number;
    softdeleteflag?: any;
    status?: any;
}