import { BuyerData } from './../models/buyer.data';
import { config } from './../../blockchain/config';
import { TransactionHelper } from './../../blockchain/transactionHelper';
import { Log } from './../models/log';
import { DeviceData } from './../models/device.data';
import { Shipment } from '../models/shipment';
import { Account } from 'nem2-sdk';
const fileSaver = require('fs');

export class Conveyor {
    fs = fileSaver;
    transactionHelper: TransactionHelper;
    constructor() {
        this.transactionHelper = new TransactionHelper();
    }
    async defineShipment(deviceData: DeviceData) {

        //let shipment = Shipment.filter(a => deviceData.shipmentId === a.shipmentId.id);
        //console.log('Shipment :', Shipment);
        const sensors = Shipment.find(k => k.shipmentId.id == deviceData.shipmentId).shipmentId.sensorId;
        let shipment = Shipment[0];
        //console.log('sensors :', sensors);
        let account;
        let sensorItem = {};
        let sensorDone = false;
        for (const sensor of sensors) {
            if (sensor.id === deviceData.sensorId && sensor.value === null) {
                sensor.value = deviceData.value;
                account = sensor.ассоunt;
                sensorDone = true;
                sensorItem = sensor;
            }
        }
        const consignerPrivateKeyName = sensorItem.id.toString().toUpperCase() + '_PRIV_KEY';

        await this.transactionHelper.confirmMultisig(config[consignerPrivateKeyName])
        if (sensorItem !== {} && sensorDone) {
            if (sensorItem.initiator) {
                //this.transactionHelper.initMultisigTransaction();
                const consignerPrivateKeyName = sensorItem.id.toString().toUpperCase() + '_PRIV_KEY';

                await this.transactionHelper.confirmMultisig(config[consignerPrivateKeyName])
                const oldData = await this.readLog();
                await this.writeLog(`export const Log = ${JSON.stringify(shipment)}`);
                this.writeDeviceData(shipment);
            } else {
                const consignerPrivateKeyName = sensorItem.id.toString().toUpperCase() + '_PRIV_KEY';

                await this.transactionHelper.confirmMultisig(config[consignerPrivateKeyName])
            } 
         }
    }

    writeDeviceData(shipment: any) {
        // Log.push(shipment); 
        console.log('Log :');
    }

    async readLog() {
        this.fs.readFile(__dirname + '/../models/log.ts', function (err, data) {
            if (err) {
                return console.error(err);
            }
            console.log("Asynchronous read: " + data.toString());
            return data
        })

    }

    async writeLog(newSensorData: any) {
        this.fs.writeFile(__dirname + '/../models/log.ts', newSensorData, function (err) {
            if (err) {
                return console.error(err);
            }
            console.log("File saved!");
        });
    }

    initMultisigTransaction(account: any) {
        console.log('writeToMultisigAccount :', account);
        this.transactionHelper.initMultisigTransaction();
    }

    prepayOfBuyer(buyerData: BuyerData) {
        this.transactionHelper.prepayBuyer()
    }
}
