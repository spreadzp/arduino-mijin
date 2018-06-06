import { BuyerData } from './common/models/buyer.data'; 
import { TransactionHelper } from './blockchain/transactionHelper';
import { SensorAccount } from './common/mijin/sensorAccount';
import { Conveyor } from './common/helpers/conveyor';
import { DeviceData } from './common/models/device.data';
import { AccountHelper } from './blockchain/accountHelper';
import { config } from './blockchain/config';
import { Get, Controller, Post, Param, Body, Res, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {

  accountHelper: AccountHelper;
  pathTransaction: any;
  pathAccount: any;
  path: any;
  conveyor: Conveyor;
  sensorAccount: SensorAccount;
  transactionHelper: TransactionHelper;

  constructor(private readonly appService: AppService) {
    this.conveyor = new Conveyor();
    this.accountHelper = new AccountHelper();
    this.path = `${config.URL}/account/`;
    this.pathAccount = `${this.path}${config.TOCKEN_DISTRIBUTOR_PUBLIC_KEY}`;
    this.pathTransaction = `${this.pathAccount}/transactions`;
    this.sensorAccount = new SensorAccount();
    this.transactionHelper = new TransactionHelper();
  }

  @Get()
  root(): string {
    return this.appService.root();
  }

  @Get('address')
  getAddress(): string {
    return `<div>${this.accountHelper.address}</div>`
  }

  @Get('create-multisig')
  createMultiSig(): string {
    this.sensorAccount.createMultisig();
    return `<div>${this.path}${config.MULTISIG_PUB_KEY}</div>`
  }

  @Get('modify-multisig')
  modifyMultiSig(): string {
    this.accountHelper.modifyMultisig();
    return `<div>${this.path}${config.MULTISIG_PUB_KEY}</div>`
  }

  @Get('create-account')
  createAccount(): string {
    let account = this.accountHelper.createAccount();
    return `<div>${account}</div>`
  }

  @Get('account')
  getAccount(@Res() res) {
    console.log('this.pathAccount:', this.pathAccount);
    res.redirect(this.pathAccount);
  }

  @Get('device/:id')
  findOne(@Param() params) {
    console.log(params.id);
    return `This action returns a #${params.id} device`;
  }

  @Get('tx')
  sendTransaction(@Res() res) {
    console.log('this.pathTransaction :', this.pathTransaction);
    res.redirect(this.pathTransaction);
  }

  @Post('device/signal')
  setNewSignal(@Body() newSignal: DeviceData, @Res() res) {
    this.conveyor.defineShipment(newSignal);
    res.status(HttpStatus.OK).json(newSignal);
  }

  @Post('buyer/prepay')
  buyerPrepay(@Body() buyerData: BuyerData, @Res() res) {
    this.conveyor.prepayOfBuyer(buyerData);
    res.status(HttpStatus.OK).json(buyerData);
  }

  @Get('**')
  notFoundPage(@Res() res) {
    res.redirect('/');
  }
}
