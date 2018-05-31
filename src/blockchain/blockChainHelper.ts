import { Component } from '@nestjs/common';
import { BlockchainHttp, Listener, Address } from 'nem2-sdk';
import { config } from './config';


export class BlockcainHelper {
    blockchainHttp: BlockchainHttp;
    listener: Listener;
    netUrl: string;

    constructor(_url: string) {
        this.netUrl = _url;
        this.blockchainHttp = new BlockchainHttp(this.netUrl);
        this.listener = new Listener(this.netUrl);
    }

    getBlockchainHeight(): any {
        return this.blockchainHttp.getBlockchainHeight().subscribe(
            height => console.log("height.compact = ", height.compact()),
            err => console.error(err)
        );
    }

    getBlockByHeight(height: number): any {
        return this.blockchainHttp.getBlockByHeight(height).subscribe(
            block => console.log(block),
            err => console.error(err)
        );
    }

    setListener() {
        const listener = new Listener(this.netUrl);

        listener.open().then(() => {

            listener.newBlock().subscribe(
                block => console.log(block),
                err => console.error(err)
            );
        });
    }

    debuggingTransactionsConfirmed(_address: string) {
        this.listener.open().then(() => {
            const address = Address.createFromRawAddress(_address);
            this.listener.confirmed(address).subscribe(
                transaction => console.log(transaction),
                err => console.error(err)
            );
        });
    }
}
