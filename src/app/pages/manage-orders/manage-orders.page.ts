import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { OrderService } from 'src/app/services/order.service';
import { IngressService } from 'src/app/services/ingress.service';
import * as moment from 'moment';
import { PickerController, IonRefresher } from '@ionic/angular';
import { PickerOptions } from '@ionic/core';
import { CancelOrderModal1Page } from 'src/app/cancel-order-modal1/cancel-order-modal1.page';
import { ModalController, NavController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { ACTION_CREATE, ACTION_EDIT } from 'src/app/environments/environments';

@Component({
  selector: 'app-manage-orders',
  templateUrl: './manage-orders.page.html',
  styleUrls: ['./manage-orders.page.scss'],
})
export class ManageOrdersPage implements OnInit {
  orderTypeImageUrl: any;
  resFromServer: any;
  orderList: any;
  orderListUpdated: any = [];
  orderType: any;
  userId: any;
  periodFilterKey;
  allOrders;
  cancelledOrders;
  futureOrders;
  pastOrders;
  displayOrderList;
  monthFilterKey;
  energyTypeFilterKey;
  allOrdersAndContracts = [];
  orderDisabled = false;
  orderCSS = 'card-bottom';
  showGateClosureLabel = false;
  showLiveLabel = false;
  showFine = false;
  fineValue = '';
  deficitEnergy: number = 0;

  constructor(private orderService: OrderService
    , private ingressService: IngressService
    , private cdr: ChangeDetectorRef
    , private pickerCtrl: PickerController
    , public modal: ModalController
    , private router: Router
    , private route: ActivatedRoute
    , private navCtrl: NavController) { }

  ngOnInit() {

  }

  doRefresh(event) {
    setTimeout(() => {
      this.ionViewWillEnter();
      event.target.complete();
    }, 1000); 
  }

  ionViewWillEnter() {
    this.allOrdersAndContracts = [];
    this.orderListUpdated = [];
    this.ingressService.getUserIdToken().then((res) => {
      this.userId = res;
      if (this.userId) {
        this.orderService.getAllOrdersByUser(this.userId).subscribe((res) => {
          this.resFromServer = res;
          //this.orderList = this.resFromServer.ordersAndContracts;

          console.log("Orders List:", this.resFromServer.response);
          this.orderService.orderList = this.resFromServer.response;
          //combining orders and contracts
          if (this.resFromServer.response.sellOrders) {
            for (let i = 0; i < this.resFromServer.response.sellOrders.length; i++) {
              this.allOrdersAndContracts.push(this.resFromServer.response.sellOrders[i]);
            }
          }
          if (this.resFromServer.response.contracts) {
            for (let i = 0; i < this.resFromServer.response.contracts.length; i++) {
              this.allOrdersAndContracts.push(this.resFromServer.response.contracts[i]);
            }
          }
          console.log("All Sell Orders and contracts: ", this.allOrdersAndContracts);
          this.fineTuneOrderList();
        });
      }
    })
  }

  fineTuneOrderList() {
    for (var i = 0; i < this.allOrdersAndContracts.length; i++) {
      let obj = this.allOrdersAndContracts[i];
      if (!obj.contractId) {
        obj.orderType = "sell";
        obj.orderId = obj.sellOrderId;
      } else if (obj.contractId) {
        obj.orderType = "buy";
        obj.orderId = obj.contractId;
        obj.powerToSell = obj.sellorder.powerToSell;
        obj.totalAmount = obj.sellorder.totalAmount;
        obj.deviceTypeName = obj.sellorder.deviceTypeName;
        obj.transferStartTs = obj.sellorder.transferStartTs;
        obj.transferEndTs = obj.sellorder.transferEndTs;
        obj.energy = obj.sellorder.energy;
      }
      if (obj.orderType == "sell")
        obj.month = moment(obj.transferStartTs).format('M');
      else
        obj.month = moment(obj.sellorder.transferStartTs).format('M');
      this.orderListUpdated.push(obj);
    }
    console.log("Updated orders list", this.orderListUpdated);
    this.displayOrderList = this.orderListUpdated;
    this.displayOrderList.sort((ts1, ts2) => {
      let t1 = moment(ts1.transferStartTs);
      let t2 = moment(ts2.transferStartTs);
      let diff = t1.diff(t2, 'seconds');
      return diff * -1;
    });
    console.log("Display order list:", this.displayOrderList);
    this.allOrders = this.orderListUpdated;
    this.cancelledOrders = this.orderListUpdated.filter(order => order.orderStatus == "Cancelled");
    this.futureOrders = this.orderListUpdated.filter(order => moment(order.transferStartTs).isAfter(moment.now()));
    this.pastOrders = this.orderListUpdated.filter(order => moment(order.transferStartTs).isBefore(moment.now()));
  }

  // getOrderId(order: any) {
  //   if (order.seller_id) {
  //     this.orderTypeImageUrl = "assets/svg/sell (1).svg";
  //     this.orderType = 'SELL';
  //     return order.sell_order_id;
  //   }
  //   if (order.buyer_id) {
  //     this.orderTypeImageUrl = "assets/svg/buy (1).svg";
  //     this.orderType = 'BUY';
  //     return order.contract_id;
  //   }
  // }

  formatTime(ts, type) {
    //console.log('format time param : ' , ts);
    if (type == 't')
      return moment(ts).format("hh:mm A");
    else if (type == 'd')
      return moment(ts).format("Do MMM");
  }

  async applyPeriodFilter() {
    console.log("Apply Period Filter");

    let opts: PickerOptions = {
      buttons: [{
        text: 'Ok', role: 'done', handler: async () => {
          let col = await picker.getColumn('periodOptions');
          console.log("Selected Col", col);
          this.periodFilterKey = col.options[col.selectedIndex].value;
          console.log("Filter Key:", this.periodFilterKey);
          if (this.periodFilterKey == 'a')
            this.displayOrderList = this.allOrders;
          else if (this.periodFilterKey == 'c')
            this.displayOrderList = this.cancelledOrders;
          else if (this.periodFilterKey == 'f')
            this.displayOrderList = this.futureOrders;
          else if (this.periodFilterKey == 'p')
            this.displayOrderList = this.pastOrders;
          else
            this.displayOrderList = this.allOrders;

        }
      }, {
        text: "Cancel", role: "cancel", handler: () => {

        }
      }],
      columns: [{
        name: "periodOptions",
        options: [{ text: "All", value: "a" }
          , { text: "Canceled", value: "c" }
          , { text: "Future", value: "f" }
          , { text: "Past", value: "p" }]
      }]
    }
    let picker = await this.pickerCtrl.create(opts)
    picker.present();
    // picker.onDidDismiss().then(async data => {

    // }
    // );
  }
  async applyMonthFilter() {
    console.log("Apply Month Filter");
    let opts: PickerOptions = {
      buttons: [{
        text: 'Ok', role: 'done', handler: async () => {
          let col = await picker.getColumn('monthOptions');
          this.monthFilterKey = col.options[col.selectedIndex].value;
          console.log("Filter Key:", this.monthFilterKey);
          console.log('order : ', this.allOrders);
          this.displayOrderList = this.allOrders.filter(order => order.month == this.monthFilterKey);
        }
      }, { text: "Cancel", role: "cancel", handler: () => { } }],
      columns: [{
        name: "monthOptions",
        options: [{ text: "January", value: "1" }
          , { text: "February", value: "2" }
          , { text: "March", value: "3" }
          , { text: "April", value: "4" }
          , { text: "May", value: "5" }
          , { text: "June", value: "6" }
          , { text: "July", value: "7" }
          , { text: "August", value: "8" }
          , { text: "September", value: "9" }
          , { text: "October", value: "10" }
          , { text: "November", value: "11" }
          , { text: "December", value: "12" }]
      }]
    }
    let picker = await this.pickerCtrl.create(opts)
    picker.present();
    picker.onDidDismiss().then(async data => {

      // if(!this.monthFilterKey) {
      //   this.displayOrderList = this.allOrders.filter(order => order.month == this.monthFilterKey);
      // }    
    }
    );
  }
  async applyEnergyFilter() {
    console.log("Apply Month Filter");
    let opts: PickerOptions = {
      buttons: [{
        text: 'Ok',
        role: 'done',
        handler: async () => {
          let col = await picker.getColumn('energyTypeOptions');
          this.energyTypeFilterKey = col.options[col.selectedIndex].value;
          console.log("Filter Key:", this.energyTypeFilterKey);
          console.log('order : ', this.allOrders);
          if (this.energyTypeFilterKey) {
            this.displayOrderList = this.allOrders.filter(order => order.deviceTypeName == this.energyTypeFilterKey);
          }
        }
      }, {
        text: "Cancel",
        role: "cancel",
        handler: () => {

        }
      }],
      columns: [{
        name: "energyTypeOptions",
        options: [{ text: "Electric Vehicle (EV)", value: "EV" }
          , { text: "Solar", value: "Solar" }
          , { text: "Generator", value: "Generator" }]
      }]
    }
    let picker = await this.pickerCtrl.create(opts)
    picker.present();
    // picker.onDidDismiss().then(async data => {

    // }
    // );
  }

  editSellOrder(order: any) {
    this.router.navigate(['/sell-time-picker'], {
      queryParams: {
        action: ACTION_EDIT,
        sellOrderId: order.sellOrderId, //has to be updated
        sellerId: this.userId,
        userDeviceId: order.userDeviceId, //has to be updated
        deviceTypeId: order.deviceTypeId, // has to be updated
        powerToSell: order.powerToSell,
        startTime: order.transferStartTs,
        endTime: order.transferEndTs
      }
    });
  }

  async cancelModal(order: any, orderType: any) {
    let defg = await this.modal.create({
      component: CancelOrderModal1Page,
      cssClass: 'my-custom-modal-css',
      componentProps: {
        'orderId': order.orderId,
        'orderType': orderType
      }
    });
    defg.onDidDismiss().then((dataReturned) => {
      this.ionViewWillEnter();
      if (dataReturned !== null) {
      }
    });
    return await defg.present();
  }

  getCSS(order) {
    this.orderDisabled = false;
    this.orderCSS = 'card-bottom';
    if (order != null) {
      if (order.orderType == 'sell' &&
        (order.orderStatus == 'Completed'
          || (order.orderStatus == 'Validated' && order.isFineApplicable != 'Y'))) {
        this.showFine = false;
        this.orderDisabled = false;
        this.orderCSS = 'card-bottom green';
        this.showLiveLabel = false;
        this.showGateClosureLabel = false;
      }
      else if (order.orderType == 'sell' &&
        (order.orderStatus == 'Cancelled' || order.orderStatus == 'Expired')) {
        this.showFine = false;
        this.orderDisabled = true;
        this.orderCSS = 'card-bottom red';
        this.showLiveLabel = false;
        this.showGateClosureLabel = false;
      }
      else if (order.orderType == 'sell' && order.orderStatus == 'Live') {
        this.showFine = false;
        this.orderDisabled = false;
        this.orderCSS = 'card-bottom';
        this.showLiveLabel = true;
        this.showGateClosureLabel = false;
      }
      else if (order.orderType == 'sell' &&
        (order.orderStatus == 'Contracted' && order.isCancellable == 'N')) {
        this.showFine = false;
        this.orderDisabled = false;
        this.orderCSS = 'card-bottom';
        this.showLiveLabel = false;
        this.showGateClosureLabel = true;
      }
      // if (order.orderType == 'sell' &&
      // (order.orderStatus == 'Validated' && order.isFineApplicable == 'Y')) {
      //   this.showFine = true;
      //   this.deficitEnergy = (+order.energy) - (+order.sellerEnergyTransfer);
      //   this.fineValue = order.sellerFine;
      //   this.orderDisabled = false;
      //   this.orderCSS = 'card-bottom yellow';
      //   this.showLiveLabel = false;
      //   this.showGateClosureLabel = false;
      // }
      else if (order.orderType == 'buy' &&
        (order.contractStatus == 'Completed'
          || (order.contractStatus == 'Validated' && order.isFineApplicable != 'Y'))) {
        this.showFine = false;
        this.orderDisabled = false;
        this.orderCSS = 'card-bottom green';
        this.showLiveLabel = false;
        this.showGateClosureLabel = false;
      }
      else if (order.orderType == 'buy' &&
        (order.contractStatus == 'Cancelled' || order.contractStatus == 'Expired')) {
        this.showFine = false;
        this.orderDisabled = true;
        this.orderCSS = 'card-bottom red';
        this.showLiveLabel = false;
        this.showGateClosureLabel = false;
      }
      else if (order.orderType == 'buy' && order.contractStatus == 'Live') {
        this.showFine = false;
        this.orderDisabled = false;
        this.showLiveLabel = true;
        this.orderCSS = 'card-bottom';
        this.showGateClosureLabel = false;
      }
      else if (order.orderType == 'buy' &&
        (order.contractStatus == 'Active' && order.isCancellable == 'N')) {
        this.showFine = false;
        this.orderDisabled = false;
        this.orderCSS = 'card-bottom';
        this.showLiveLabel = false;
        this.showGateClosureLabel = true;
      } else {
        this.showFine = false;
        this.orderDisabled = false;
        this.orderCSS = 'card-bottom';
        this.showLiveLabel = false;
        this.showGateClosureLabel = false;
      }
      // if (order.orderType == 'buy' &&
      // (order.contractStatus == 'Validated' && order.isFineApplicable == 'Y')) {
      //   this.showFine = true;
      //   this.deficitEnergy = (+order.energy) - (+order.buyerEnergyTransfer);
      //   this.fineValue = order.buyerFine;
      //   this.orderDisabled = false;
      //   this.orderCSS = 'card-bottom yellow';
      //   this.showLiveLabel = false;
      //   this.showGateClosureLabel = false;
      // }
    }
    return this.orderCSS;
  }
}
