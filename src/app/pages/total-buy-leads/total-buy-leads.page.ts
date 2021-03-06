import { Component, OnInit } from '@angular/core';
import { AdminService } from 'src/app/services/admin.service';
import { TimeService } from 'src/app/services/time.service';
import * as moment from 'moment';
import { Router, ActivatedRoute } from '@angular/router';
import { ADMIN_ROLE, ACTION_CREATE, ACTION_EDIT } from 'src/app/environments/environments';
import { PickerOptions } from '@ionic/core';
import { PickerController } from '@ionic/angular';
import { async } from '@angular/core/testing';

@Component({
  selector: 'app-total-buy-leads',
  templateUrl: './total-buy-leads.page.html',
  styleUrls: ['./total-buy-leads.page.scss'],
})
export class TotalBuyLeadsPage implements OnInit {

  allBuyLeads: any;
  monthFilterKey;
  displayLeads: any;
  locationFilterKey: any;
  selectedLead: any;

  orderCSS = 'card-bottom';
  showGateClosureLabel = false;
  showLiveLabel = false;
  orderDisabled = false;


  constructor(private router: Router
    , private route: ActivatedRoute
    , private adminService: AdminService
    , private timeService: TimeService
    , private pickerCtrl: PickerController) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.allBuyLeads = this.adminService.allBuyLeads;
    this.displayLeads = this.allBuyLeads;
    this.displayLeads.sort((ts1, ts2) => {
      let t1 = moment(ts1.sellorder.transferStartTs);
      let t2 = moment(ts2.sellorder.transferStartTs);
      let diff = t1.diff(t2, 'seconds');
      return diff * -1;
    });
    console.log("Display Leads", this.displayLeads);
  }

  formatTime(ts, type) {
    if (type == 't')
      return moment(ts).format("hh:mm A");
    else if (type == 'd')
      return moment(ts).format("Do MMM");
  }

  getDuration(startTime: string, endTime: string) {
    return this.timeService.getDuration(startTime, endTime, ADMIN_ROLE);
  }

  selectBuyLead(buyLead: any) {
    this.router.navigate(['/profile'], {
      queryParams: {
        userId: buyLead.buyerId,
        flow: 'ADMIN'
      }
    });
  }

  async filterByMonth() {
    console.log("Apply Month Filter");
    let opts: PickerOptions = {
      buttons: [{
        text: 'Ok', role: 'done', handler: async () => {
          let col = await picker.getColumn('monthOptions');
          this.monthFilterKey = col.options[col.selectedIndex].value;
          this.displayLeads = this.allBuyLeads.filter(order => moment(order.transferStartTs).format('M') == this.monthFilterKey);
        }
      }, {
        text: "Cancel",
        role: "cancel",
        handler: () => {

        }
      }],
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
    // picker.onDidDismiss().then(async data => {

    // }
    // );
  }

  async filterByLocation() {
    console.log("Apply Location Filter");
    let opts: PickerOptions = {
      buttons: [{
        text: 'Ok', role: 'done', handler: async () => {
          let col = await picker.getColumn('monthOptions');
          this.locationFilterKey = col.options[col.selectedIndex].value;
          if (this.locationFilterKey != 'All') {
            this.displayLeads = this.allBuyLeads.filter(order => order.sellorder.localityName == this.locationFilterKey);
          } else {
            this.displayLeads = this.allBuyLeads;
          }
        }
      }, {
        text: "Cancel",
        role: "cancel",
        handler: () => {

        }
      }],
      columns: [{
        name: "monthOptions",
        options: [{ text: "Tarnaka", value: "Tarnaka" }
          , { text: "Nizamabad", value: "Nizamabad" }
          , { text: "Shimachalam", value: "Shimachalam" }
          , { text: "Lingampalli", value: "Lingampalli" }
          , { text: "All", value: "All" }
        ]
      }]
    }
    let picker = await this.pickerCtrl.create(opts)
    picker.present();
    // picker.onDidDismiss().then(async data => {

    // });
  }

  selectLead() {
    if (this.selectedLead != null) {
      this.displayLeads = this.allBuyLeads.filter(buyLead => buyLead.contractId == this.selectedLead);
    }
  }

  getCSS(order) {
    this.orderDisabled = false;
    this.orderCSS = 'card-center';
    if (order != null) {
      if (order.contractStatus == 'Completed' 
      || (order.contractStatus == 'Validated' && order.isFineApplicable != 'Y')) {
        this.orderDisabled = false;
        this.orderCSS = 'card-center green';
        this.showLiveLabel = false;
        this.showGateClosureLabel = false;
      }
      else if (order.contractStatus == 'Cancelled' || order.contractStatus == 'Expired') {
        this.orderDisabled = true;
        this.orderCSS = 'card-center red';
        this.showLiveLabel = false;
        this.showGateClosureLabel = false;
      }
      else if (order.contractStatus == 'Live') {
        this.orderDisabled = false;
        this.showLiveLabel = true;
        this.orderCSS = 'card-center';
        this.showGateClosureLabel = false;
      }
      else if (order.contractStatus == 'Active' && order.isCancellable == 'N') {
        this.orderDisabled = false;
        this.orderCSS = 'card-center';
        this.showLiveLabel = false;
        this.showGateClosureLabel = true;
      }
      else {
        this.orderDisabled = false;
        this.orderCSS = 'card-center';
        this.showLiveLabel = false;
        this.showGateClosureLabel = false;
      }
      // if (order.contractStatus == 'Validated' && order.isFineApplicable == 'Y') {
      //   this.orderDisabled = false;
      //   this.orderCSS = 'card-center yellow';
      //   this.showLiveLabel = false;
      //   this.showGateClosureLabel = false;
      // }
    }
    return this.orderCSS;
  }
}
