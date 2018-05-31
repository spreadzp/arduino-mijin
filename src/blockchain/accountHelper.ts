import { TransactionHelper } from './transactionHelper';
import { Component } from '@nestjs/common';
import {
    Account, NetworkType, AccountHttp, Address,
    MosaicHttp, MosaicService, NamespaceHttp, PublicAccount,
    QueryParams, TransferTransaction, TransactionType, XEM,
    ModifyMultisigAccountTransaction, Deadline,
    MultisigCosignatoryModificationType, MultisigCosignatoryModification,
    TransactionHttp, AggregateTransaction, UInt64, LockFundsTransaction, Listener
} from "nem2-sdk";
import { config } from "./config";


export class AccountHelper {
    public account: Account;
    accountHttp: AccountHttp;
    originAccount: PublicAccount;
    balance: any;
    public address: string;
    transactionHelper: TransactionHelper;

    constructor() {
        this.accountHttp = new AccountHttp(config.URL);
        this.originAccount = PublicAccount.createFromPublicKey(config.PUB_KEY, NetworkType.MIJIN_TEST);
        //this.address = _address;
        this.transactionHelper = new TransactionHelper();
    }


    getAccountInfo() {

        return this.accountHttp.getAccountInfo(Address.createFromRawAddress(this.address)).subscribe(
            accountInfo => console.log('accountInfo=', accountInfo),
            err => console.error(err)
        );
    }

    public getBalanceAccount() {
        const mosaicHttp = new MosaicHttp(config.URL);
        const namespaceHttp = new NamespaceHttp(config.URL);

        const mosaicService = new MosaicService(this.accountHttp, mosaicHttp, namespaceHttp);

        return mosaicService.mosaicsAmountViewFromAddress(Address.createFromRawAddress(config.ADDRESS))
            .flatMap((_) => _)
            .subscribe(
                mosaic => {
                    this.balance = mosaic.relativeAmount();
                    console.log('You have', this.balance, mosaic.fullName())
                },
                err => console.error(err)
            );
    }

    createAccount() {
        this.account = Account.generateNewAccount(NetworkType.MIJIN_TEST);

        console.log('Your new account address is:', this.account.address.pretty(),
            'and its private key', this.account.privateKey, 'and its public key', this.account.publicKey);
    }

    openAccount(_privateKey: string) {
        const privateKey = config.PRIV_KEY as string;

        const account = Account.createFromPrivateKey(_privateKey, NetworkType.MIJIN_TEST);

        console.log('Your account address is:', account.address.pretty(), 'and its private key', account.privateKey);
    }

    getConfirmedTransactions() {
        /**
         * Page size between 10 and 100, otherwise 10
         */
        const pageSize = 10;

        this.accountHttp.transactions(
            this.originAccount,
            new QueryParams(pageSize)
        ).subscribe(
            transactions => console.log(transactions),
            err => console.error(err)
        );
    }

    getTheAmountOfXEMSentToAnAccount(): any {
        // Replace with address
        const address = Address.createFromRawAddress(config.RECIPIENT_ADDRESS);

        return this.accountHttp
            .outgoingTransactions(this.originAccount)
            .flatMap((_) => _) // Transform transaction array to single transactions to process them
            .filter((_) => _.type === TransactionType.TRANSFER) // Filter transfer transactions
            .map((_) => _ as TransferTransaction) // Map transaction as transfer transaction
            .filter((_) => _.recipient.equals(address)) // Filter transactions from to account
            .filter((_) => _.mosaics.length === 1 && _.mosaics[0].id.equals(XEM.MOSAIC_ID)) // Filter xem transactions
            .map((_) => _.mosaics[0].amount.compact() / Math.pow(10, XEM.DIVISIBILITY)) // Map only amount in xem
            .toArray() // Add all mosaics amounts into one array
            .map((_) => _.reduce((a, b) => a + b, 0))
            .subscribe(
                total => console.log('Total xem send to account', address.pretty(), 'is:', total),
                err => console.error(err)
            );
    }

    createArrayPublicAccounts(publicKeys: any[]): PublicAccount[] {
        let cosignatories: PublicAccount[] = [];
        for (let j = 0; j < publicKeys.length; j++) {

            let cosignatory = PublicAccount.createFromPublicKey(publicKeys[j], NetworkType.MIJIN_TEST);
            console.log(' cosignatory:', cosignatory, cosignatories);
            cosignatories.push(cosignatory);
        }
        return cosignatories;
    }

    public createMultisigAccount(cosignatoriesPubKeys: any[]) {
        const account = Account.createFromPrivateKey(config.MULTI_PRIV_KEY, NetworkType.MIJIN_TEST);
        let cosignatories = this.createArrayPublicAccounts(cosignatoriesPubKeys);
        const convertIntoMultisigTransaction = this.convertIntoMultisigTransaction(cosignatories);
        const signedTransaction = account.sign(convertIntoMultisigTransaction);
        this.transactionHelper.anounce(signedTransaction);
    }

    private convertIntoMultisigTransaction(cosignatories: PublicAccount[]) {
        let cosignatoriesMultisigArray: MultisigCosignatoryModification[] = [];
        const numberConsignators = cosignatories.length
        for (let i = 0; i < numberConsignators; i++) {

            let newConsignatory = new MultisigCosignatoryModification(
                MultisigCosignatoryModificationType.Add,
                cosignatories[i],
            )
            cosignatoriesMultisigArray.push(newConsignatory);
        }
        return ModifyMultisigAccountTransaction.create(
            Deadline.create(),
            numberConsignators, 1,
            cosignatoriesMultisigArray,
            NetworkType.MIJIN_TEST
        );
    }

    modifyMultisig() {
        const cosignatoryPrivateKey = config.SENSOR1_PRIV_KEY;

        const cosignatoryAccount = Account.createFromPrivateKey(cosignatoryPrivateKey, NetworkType.MIJIN_TEST);
        const multisigAccount = PublicAccount.createFromPublicKey(config.MULTISIG_PUB_KEY, NetworkType.MIJIN_TEST);

        const modifyMultisigAccountTransaction = ModifyMultisigAccountTransaction.create(
            Deadline.create(),
            3,
            0,
            [],
            NetworkType.MIJIN_TEST
        );
        const aggregateTransaction = AggregateTransaction.createComplete(
            Deadline.create(),
            [
                modifyMultisigAccountTransaction.toAggregate(multisigAccount),
            ],
            NetworkType.MIJIN_TEST,
            []
        );

        const signedTransaction = cosignatoryAccount.sign(aggregateTransaction);

        this.transactionHelper.anounce(signedTransaction);
    }

    addCosignatory() {
        // Replace with the multisig public key
        const cosignatoryPrivateKey = config.PRIV_KEY as string;
        const multisigAccountPublicKey = config.MULTISIG_PUB_KEY;
        const newCosignatoryPublicKey = config.NEW_COSIGNATORY_PUB_KEY;

        const cosignatoryAccount = Account.createFromPrivateKey(cosignatoryPrivateKey, NetworkType.MIJIN_TEST);
        const newCosignatoryAccount = PublicAccount.createFromPublicKey(newCosignatoryPublicKey, NetworkType.MIJIN_TEST);
        const multisigAccount = PublicAccount.createFromPublicKey(multisigAccountPublicKey, NetworkType.MIJIN_TEST);

        const multisigCosignatoryModification = new MultisigCosignatoryModification(MultisigCosignatoryModificationType.Add, newCosignatoryAccount);
        const modifyMultisigAccountTransaction = ModifyMultisigAccountTransaction.create(
            Deadline.create(),
            0,
            0,
            [
                multisigCosignatoryModification
            ],
            NetworkType.MIJIN_TEST
        );

        const aggregateTransaction = AggregateTransaction.createBonded(
            Deadline.create(),
            [
                modifyMultisigAccountTransaction.toAggregate(multisigAccount),
            ],
            NetworkType.MIJIN_TEST
        );

        const signedTransaction = cosignatoryAccount.sign(aggregateTransaction);
        const lockFundsTransaction = LockFundsTransaction.create(
            Deadline.create(),
            XEM.createRelative(10),
            UInt64.fromUint(480),
            signedTransaction,
            NetworkType.MIJIN_TEST);

        const lockFundsTransactionSigned = cosignatoryAccount.sign(lockFundsTransaction);

        const transactionHttp = new TransactionHttp(config.URL);

        // announce signed transaction
        const listener = new Listener(config.URL);

        listener.open().then(() => {


            this.transactionHelper.anounce(lockFundsTransactionSigned);
            listener.confirmed(cosignatoryAccount.address)
                .filter((transaction) => transaction.transactionInfo !== undefined
                    && transaction.transactionInfo.hash === lockFundsTransactionSigned.hash)
                .subscribe(ignored => {
                    transactionHttp.announceAggregateBonded(signedTransaction).subscribe(
                        x => console.log("success add new Cosignatory", x),
                        err => console.error(err)
                    );
                },
                    err => console.error(err));
        });
    }


    /* public createAgregateTransaction() {
        console.log('agregate :');
        return "agregate";
    } */

};