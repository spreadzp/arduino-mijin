import { TransactionHelper } from './../../blockchain/transactionHelper';
import { Log } from './../models/log';
import { DeviceData } from './../models/device.data';
import { Shipment } from '../models/shipment';
const fileSaver = require('fs');

export class Conveyor {
    fs = fileSaver;
    transactionHelper: TransactionHelper;
    constructor() {
        this.transactionHelper = new TransactionHelper();
    }
    async defineShipment(deviceData: DeviceData) {

        //let shipment = Shipment.filter(a => deviceData.shipmentId === a.shipmentId.id);
        let shipment = Shipment[0];
        console.log('shipment :', shipment);
        this.writeDeviceData(shipment);
        //const data = shipment.filter(b => b.shipmentId.sensorId.filter(c => c.id === deviceData.sensorId));
        const data = shipment.shipmentId.sensorId[0].ассоunt;
        await this.writeToMultisigAccount(data);
        const oldData = await this.readLog();
        //console.log('oldData :', oldData);
        await this.writeLog(`export const Log = ${JSON.stringify(shipment)}`);
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

    writeToMultisigAccount(account: any) {
        this.transactionHelper.initMultisigTransaction();
    }
}
