import { Component, OnInit } from '@angular/core';
import { AdminService } from 'src/app/services/admin.service';
import { TimeService } from 'src/app/services/time.service';
import * as moment from 'moment';
import { Router, ActivatedRoute } from '@angular/router';
import { ADMIN_ROLE, ACTION_CREATE, ACTION_EDIT } from 'src/app/environments/environments';
import { PickerOptions } from '@ionic/core';
import { PickerController } from '@ionic/angular';

@Component({
  selector: 'app-total-sell-leads',
  templateUrl: './total-sell-leads.page.html',
  styleUrls: ['./total-sell-leads.page.scss'],
})
export class TotalSellLeadsPage implements OnInit {

  allSellLeads: any;
  monthFilterKey;
  displayLeads;

  constructor(private router: Router
    , private route: ActivatedRoute
    , private adminService: AdminService
    , private timeService: TimeService
    , private pickerCtrl: PickerController) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.allSellLeads = this.adminService.allSellLeads;
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

  selectSellLead() {
    this.router.navigate(['/profile'], {
      queryParams: {
      }
    });
  }

  async filterByMonth() {
    console.log("Apply Month Filter");
    let opts: PickerOptions = {
      buttons: [{ text: 'Ok', role: 'done' }, { text: 'Cancel', role: 'cancel' }],
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
      let col = await picker.getColumn('monthOptions');
      this.monthFilterKey = col.options[col.selectedIndex].value;
      console.log("Filter Key:", this.monthFilterKey);
      this.displayLeads = this.allSellLeads.filter(order => moment(order.sellorder.transferStartTs).format('M') == this.monthFilterKey);
    }
    );
  }
}