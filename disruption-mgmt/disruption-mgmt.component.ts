import { Component, OnInit, Output } from '@angular/core';
import { EventEmitter } from 'events';


@Component({
  selector: 'app-disruption-mgmt',
  templateUrl: './disruption-mgmt.component.html',
  styleUrls: ['./disruption-mgmt.component.css']
})
export class DisruptionMgmtComponent implements OnInit {

  /**
   * Testing Home Notebook works
   * Testing from other side nothing damaged
   */

  processHidden: boolean = false;
  analyticsHidden: boolean = false;

/**
 * Aufruf der aus dem disruption-mgmt.html-Event getriggerte Methode showProcess
 */
  showProcess () { // analyticsHidden: boolean, processHidden: boolean

    console.log("DisruptionMgmtComponent.showProcess() called");
    this.analyticsHidden = !this.analyticsHidden;
    this.processHidden = true;
    console.log(this.analyticsHidden, this.processHidden);
  }

/**
 * Aufruf der aus dem disruption-mgmt.html-Event getriggerte Methode showAnalytics
 */
  showAnalytics () { // analyticsHidden: boolean, processHidden: boolean
    console.log("DisruptionMgmtComponent.showAnalytics() called");
    this.analyticsHidden = true;
    this.processHidden = !this.processHidden;
    console.log(this.analyticsHidden, this.processHidden);
  }

  constructor() {
   }

  ngOnInit() {
  }

}
