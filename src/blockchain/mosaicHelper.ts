import { Component } from '@nestjs/common';
import {
    NamespaceHttp, NamespaceId, Account, Deadline, NetworkType, RegisterNamespaceTransaction, TransactionHttp, UInt64,
    AggregateTransaction, MosaicDefinitionTransaction, MosaicProperties, MosaicSupplyChangeTransaction,
    MosaicSupplyType, SignedTransaction, MosaicId
} from 'nem2-sdk';
import { config } from './config';


export class MosaicHelper {

    namespaceHttp: NamespaceHttp;
    privateKey = config.TOCKEN_DISTRIBUTOR_PRIVATE_KEY as string;
    account = Account.createFromPrivateKey(this.privateKey, NetworkType.MIJIN_TEST);
    transactionHttp: TransactionHttp;

    constructor(private namespace: string, private mosaic: string, private duration: number) {
        this.transactionHttp = new TransactionHttp(config.URL);
        this.namespace = namespace;
        this.mosaic = mosaic;
        this.duration = duration;
    }

    setDefinitionTransaction(): any {
        return MosaicDefinitionTransaction.create(
            Deadline.create(),
            this.mosaic,
            this.namespace,
            MosaicProperties.create({
                supplyMutable: true,
                transferable: true,
                levyMutable: false,
                divisibility: 0,
                duration: UInt64.fromUint(this.duration),
            }),
            NetworkType.MIJIN_TEST,
        );
    }

    setSupplyChangeTransaction(): any {
        return MosaicSupplyChangeTransaction.create(
            Deadline.create(),
            this.setDefinitionTransaction().mosaicId,
            MosaicSupplyType.Increase,
            UInt64.fromUint(1000000),
            NetworkType.MIJIN_TEST,
        );
    }

    setAggregateTransaction() {
        return AggregateTransaction.createComplete(
            Deadline.create(),
            [
                this.setDefinitionTransaction().toAggregate(this.account.publicAccount),
                this.setSupplyChangeTransaction().toAggregate(this.account.publicAccount),
            ],
            NetworkType.MIJIN_TEST,
            []
        );
    }

    setMosaicID(): MosaicId {
        return new MosaicId(`${this.namespace}:${this.mosaic}`);
    }

    setMosaicSupplyChangeTransaction() {
        const mosaicID = this.setMosaicID();
        return MosaicSupplyChangeTransaction.create(
            Deadline.create(),
            mosaicID,
            MosaicSupplyType.Increase,
            UInt64.fromUint(2000000),
            NetworkType.MIJIN_TEST,
        );
    }

    sendSupplyChangedMosaic() {
        const mosaicSupplyChangeTransaction = this.setMosaicSupplyChangeTransaction();
        this.sendSignedTransaction(mosaicSupplyChangeTransaction);
    }

    sendNewMosaic() {
        const aggregateTransaction = this.setAggregateTransaction();
        this.sendSignedTransaction(aggregateTransaction);
    }

    sendSignedTransaction(transaction: any) {
        const signedTransaction = this.account.sign(transaction);

        this.transactionHttp.announce(signedTransaction).subscribe(
            x => console.log(x),
            err => console.error(err)
        );
    }
}