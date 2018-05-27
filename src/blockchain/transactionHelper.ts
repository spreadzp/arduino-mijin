import { Component } from '@nestjs/common';
import { config } from './config';
import {
    Address, Deadline, XEM, NetworkType,
    PlainMessage, TransferTransaction, TransactionHttp,
    Account, RegisterNamespaceTransaction, Message, Mosaic,
    UInt64, MosaicId, PublicAccount, AggregateTransaction, LockFundsTransaction,
    Listener,
    CosignatureSignedTransaction,
    CosignatureTransaction,
    AccountHttp
} from 'nem2-sdk';


export class TransactionHelper {
    transactionHttp: TransactionHttp;
    privateKey = config.PRIV_KEY as string;
    account: Account;
    registerNamespaceTransaction: RegisterNamespaceTransaction;

    constructor() {
        this.transactionHttp = new TransactionHttp(config.URL);
        this.account = Account.createFromPrivateKey(this.privateKey, NetworkType.MIJIN_TEST);
    }

    createTransferTransaction() {
        const recipientAddress = config.RECIPIENT_ADDRESS;

        const transferTransaction = TransferTransaction.create(
            Deadline.create(),
            Address.createFromRawAddress(recipientAddress),
            [XEM.createRelative(10)],
            PlainMessage.create('Welcome To NEM'),
            NetworkType.MIJIN_TEST,
        );
    }

    sendMosaic() {
        const recipientAddress = config.RECIPIENT_ADDRESS;
        const signer = PublicAccount.createFromPublicKey(config.PUB_KEY, NetworkType.MIJIN_TEST);
        const transferTransaction = TransferTransaction.create(
            Deadline.create(),
            Address.createFromRawAddress(recipientAddress),
            [new Mosaic(new MosaicId("tokenbusiness1:nem-token11"), UInt64.fromUint(5555))],
            PlainMessage.create("send 55555 nem-token11"),
            NetworkType.MIJIN_TEST,
        );

        this.sendSignedTransaction(transferTransaction);
    }

    sendSignedTransaction(transaction: any) {
        const signedTransaction = this.account.sign(transaction);
        this.anounce(signedTransaction);
    }

    sendAtomicSwap(numberTickets: number, mosaicName: string, priceTicket: number) {
        console.log('mosaicName :', mosaicName);
        // Replace with private key
        const alicePrivateKey = config.PRIV_KEY;
        // Replace with public key
        const ticketDistributorPublicKey = config.TOCKEN_DISTRIBUTOR_PUBLIC_KEY;

        const aliceAccount = Account.createFromPrivateKey(alicePrivateKey, NetworkType.MIJIN_TEST);
        const ticketDistributorPublicAccount = PublicAccount.createFromPublicKey(ticketDistributorPublicKey, NetworkType.MIJIN_TEST);

        const aliceToTicketDistributorTx = TransferTransaction.create(
            Deadline.create(),
            ticketDistributorPublicAccount.address,
            [XEM.createRelative(priceTicket)],
            PlainMessage.create('send 10 nem:xem to distributor'),
            NetworkType.MIJIN_TEST,
        );
        const message = `send ${numberTickets}${mosaicName} to alice`;
        const ticketDistributorToAliceTx = TransferTransaction.create(
            Deadline.create(),
            aliceAccount.address,
            [new Mosaic(new MosaicId(mosaicName), UInt64.fromUint(numberTickets))],
            PlainMessage.create(message),
            NetworkType.MIJIN_TEST,
        );

        const aggregateTransaction = AggregateTransaction.createBonded(Deadline.create(),
            [
                aliceToTicketDistributorTx.toAggregate(aliceAccount.publicAccount),
                ticketDistributorToAliceTx.toAggregate(ticketDistributorPublicAccount),
            ],
            NetworkType.MIJIN_TEST);

        const signedTransaction = aliceAccount.sign(aggregateTransaction);
        /* const ticketDistributorAccount = Account.createFromPrivateKey(config.TOCKEN_DISTRIBUTOR_PRIVATE_KEY, NetworkType.MIJIN_TEST);
       
        const cosignatureTransaction = CosignatureTransaction.create(aggregateTransaction);
 */
        const lockFundsTransaction = LockFundsTransaction.create(
            Deadline.create(),
            XEM.createRelative(10),
            UInt64.fromUint(480),
            signedTransaction,
            NetworkType.MIJIN_TEST);

        const lockFundsTransactionSigned = aliceAccount.sign(lockFundsTransaction);
        const transactionHttp = new TransactionHttp(config.URL);

        // announce signed transaction
        const listener = new Listener(config.URL);
        this.anounce(lockFundsTransactionSigned);
     
    
        
        listener.open().then(() => {

            transactionHttp.announce(lockFundsTransactionSigned).subscribe(x => console.log("announce", x),
                err => console.error(err));

            listener.confirmed(aliceAccount.address)
                .filter((transaction) => transaction.transactionInfo !== undefined
                    && transaction.transactionInfo.hash === lockFundsTransactionSigned.hash)
                .flatMap(ignored => transactionHttp.announceAggregateBonded(signedTransaction))
                .subscribe(announcedAggregateBonded => {
                    console.log("announcedAggregateBonded", announcedAggregateBonded)
                    this.confirmDistributor(); 
                },
                    err => console.error(err));
        }); 
    }

    cosignAggregateBondedTransaction(transaction: AggregateTransaction,ticketDistributorAccount: Account )  {
        //const ticketDistributorAccount = Account.createFromPrivateKey(config.TOCKEN_DISTRIBUTOR_PRIVATE_KEY, NetworkType.MIJIN_TEST);
        const cosignatureTransaction = CosignatureTransaction.create(transaction);
        return  ticketDistributorAccount.signCosignatureTransaction(cosignatureTransaction); 
    }

    confirmDistributor() {
        const ticketDistributorAccount = Account.createFromPrivateKey(config.TOCKEN_DISTRIBUTOR_PRIVATE_KEY, NetworkType.MIJIN_TEST);
         
        const accountHttp = new AccountHttp(config.URL);
        const transactionHttp = new TransactionHttp(config.URL); 

        accountHttp.aggregateBondedTransactions(ticketDistributorAccount.publicAccount)
            .flatMap((_) => _)
            .filter((_) => !_.signedByAccount(ticketDistributorAccount.publicAccount))
            .map(transaction => { 
                //console.log('transaction :',transaction );
                return this.cosignAggregateBondedTransaction(transaction, ticketDistributorAccount)})
            .flatMap(cosignatureSignedTransaction => {// console.log('cosignatureSignedTransaction :', cosignatureSignedTransaction);
                return transactionHttp.announceAggregateBondedCosignature(cosignatureSignedTransaction)}
            )  
            .subscribe(announcedTransaction => console.log(announcedTransaction),
                err => console.error(err));
    }

    anounce(signedTransaction: any) {
        const transactionHttp = new TransactionHttp(config.URL);

        // announce signed transaction
        
        transactionHttp.announce(signedTransaction).subscribe(
            x => console.log(x),
            err => console.error(err));
    }
}
