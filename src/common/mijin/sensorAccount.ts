import { config } from './../../blockchain/config';
import { AccountHelper } from './../../blockchain/accountHelper';
export class SensorAccount {
    accountHelper: AccountHelper;
    constructor() {
        this.accountHelper = new AccountHelper();
    }

    sendToMultisig(sensorId: any) {

    }
    
    public createMultisig() {
        let consignatoriesPubKeys = [config.SENSOR1_PUB_KEY, config.SENSOR2_PUB_KEY, config.SENSOR3_PUB_KEY];
        this.accountHelper.createMultisigAccount(consignatoriesPubKeys);
    }
}
