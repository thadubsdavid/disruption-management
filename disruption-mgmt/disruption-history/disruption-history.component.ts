/**
 * Comment Header:
 * DisruptionHistoryComponent is responsible to give details about the way the disruption has been resolved
 * This component is only shown if the disruption has a status of cancelled or done
 * Therefore the kpis and status history of the disruptions are used
 * The component starts by requiring several imports
 */

import { Component, OnInit, ViewChild } from '@angular/core';
import { DisruptionMgmtService } from '../disruption.service';
import { TableCfgHelperService, TableConfiguration } from '../../../../shared/services/table-cfg-helper.service';

import { DisruptionStatesEntry } from '../models/disruption-states-entry';
import { IntermodalTripEntry } from '../models/intermodal-trip-entry';
import { THaDisruption } from '../../../../the-haulier-api/model/models';

import { jqxComboBoxComponent } from 'jqwidgets-ng/jqxcombobox';
import { jqxGridComponent } from 'jqwidgets-ng/jqxgrid';

@Component({
  selector: 'app-disruption-history',
  templateUrl: './disruption-history.component.html',
  styleUrls: ['./disruption-history.component.css']
})
export class DisruptionHistoryComponent implements OnInit {
  @ViewChild('disruptionHistoryComboBox') disruptionHistoryComboBox: jqxComboBoxComponent;
  @ViewChild('intermodalTripSourceTableBlock') intermodalTripSourceTableBlock: jqxGridComponent;
  @ViewChild('disruptionStateHistorySourceTableBlock') disruptionStateHistorySourceTableBlock: jqxGridComponent;

  disruptionHistoryEnabled: boolean = false;
  private processingDisruption: THaDisruption = {};

  /**
   * Mapping incoming Source for the displayed disrupted intermodal Trips and chosen intermodal alternatives
   * JQX DataAdapter is used to load data into the data table
   */
  private intermodalTripSource = {

    localdata: [],
    datatype: "array",
    datafields: [
      { name: 'sequence', type: 'number' },
      { name: 'tripIdent', type: 'string' },
      { name: 'lineId', type: 'string' },
      { name: 'vehicleId', type: 'string' },
      { name: 'driverId', type: 'string' },
      { name: 'tripDuration', type: 'number' },
      { name: 'tripCost', type: 'number' },
      { name: 'tripEmission', type: 'number' },
      { name: 'tripStart', type: 'string' },
      { name: 'tripEnd', type: 'string' },
      { name: 'tripState', type: 'string' }
    ]
  };
  intermodalTripDataAdapter: any = new jqx.dataAdapter(this.intermodalTripSource);
  public intermodalTripTableConfiguration: TableConfiguration;
  public intermodalTripTableColumns: any[] = [];

  /**
   * Mapping incoming Source for the disruption state history
   * JQX DataAdapter is used to load data into the data table
   */
  private disruptionStateHistorySource = {

    localdata: [],
    datatype: "array",
    datafields: [
      { name: 'sequence', type: 'number' },
      { name: 'disruptionState', type: 'string' },
      { name: 'timeStamp', type: 'string' },
      { name: 'desc', type: 'string' },
    ]
  };
  stateHistoryDataAdapter: any = new jqx.dataAdapter(this.disruptionStateHistorySource);
  public stateHistoryTableConfiguration: TableConfiguration;
  public stateHistoryTableColumns: any[] = [];
  enableIntermodalTripSourceTableBlock: boolean = false;
  enableDisruptionStateHistorySourceTableBlock: boolean = false;

  /**
   * Provides the user multiple options to select what to see
   * SHOW_DISRUPTION_TRIP_ASSIGNMENTS = provides the intermodal alternatives and there disrupted intermodal trips
   * SHOW_DISRUPTION_HISTORY = provides the state history of a disruption
   * SHOW_ALL = shows both (SHOW_DISRUPTION_HISTORY + SHOW_DISRUPTION_TRIP_ASSIGNMENTS)
   */
  disruptionHistoryAdapter: string[] = [
    "SHOW_DISRUPTION_TRIP_ASSIGNMENTS",
    "SHOW_DISRUPTION_HISTORY",
    "SHOW_ALL"
  ];

  constructor(private disruptionService: DisruptionMgmtService, private tableCfgHelperService: TableCfgHelperService) {

    console.log(`DisruptionHistoryComponent.constructor(..) called.`);

  }

  ngOnInit() {

    console.log(`DisruptionHistoryComponent.ngOnInit(..) called.`);

    /**
     * Table configuration for the intermodal disrupted trips and intermodal alternatives
     */
    this.intermodalTripTableConfiguration = this.tableCfgHelperService.getTableConfig("Disruption", "IntermodalTripSourceGrid");
    if (this.intermodalTripTableConfiguration === null) {

      console.error(`DisruptionHistoryComponent.ngOnInit(..) intermodalTripTableConfiguration not valid`);
      return;
    }
    this.intermodalTripTableColumns = this.intermodalTripTableConfiguration.columns;

    /**
     * Table configuration for the history component
     */
    this.stateHistoryTableConfiguration = this.tableCfgHelperService.getTableConfig("Disruption", "DisruptionStateHistorySourceGrid");
    if (this.stateHistoryTableConfiguration === null) {

      console.error(`DisruptionHistoryComponent.ngOnInit(..) stateHistoryTableConfiguration not valid`);
      return;
    }
    this.stateHistoryTableColumns = this.stateHistoryTableConfiguration.columns;

    this.createObservables();
    this.processSelectedDisruption();
    this.disruptionHistoryEnabled = true;
  }

  /**
   * Defining the observables for the disruption state history and the disrupted intermodal trip
   * These observables are informed as soon as the subeject receives an update
   */
  private createObservables() {

    console.log(`DisruptionHistoryComponent.createObservables(..) called.`);

    if (this.disruptionService.containsSubscription("DisruptionHistoryComponent") === false) {

      this.disruptionService.disruptionHistoryObject.subscribe((statesHistory) => { this.refreshDisruptionStatesTable(statesHistory) });
      console.log(`DisruptionHistoryComponent.createObservables(..) initialized statesHistory.`);

      this.disruptionService.intermodalTourFinderByCommonIdentForKPIObject.subscribe((disruptedIntermodalTrips) => { this.refreshDisruptedIntermodalTable(disruptedIntermodalTrips) });
      console.log(`DisruptionHistoryComponent.createObservables(..) initialized disruptedIntermodalTrips.`);
    }
  }

  /**
   * processSelectedDisruption() gets the current disruption in process and declares it in a global variable
   */
  private processSelectedDisruption() {
    console.log(`DisruptionHistoryComponent.processSelectedDisruption(..) called.`);
    this.processingDisruption = this.disruptionService.getCurrentDisruption2Process();

  }

  /**
   * disruptionHistoryComboboxOnSelect() is triggered by a selection of the combobox
   * Pending on the value executes certain methods and shows and enables ui elements
   */
  public disruptionHistoryComboboxOnSelect($event) {
    console.log(`DisruptionHistoryComponent.disruptionHistoryComboboxOnSelect(..) called.`);

    if (this.disruptionHistoryComboBox.val() === "SHOW_DISRUPTION_TRIP_ASSIGNMENTS") {
      console.log(`ProcessDisruptionComponent.disruptionHistoryComboboxOnSelect() SHOW_DISRUPTION_TRIP_ASSIGNMENTS CLICKED`);
      this.enableIntermodalTripSourceTableBlock = true;
      this.enableDisruptionStateHistorySourceTableBlock = false;
      this.getDisruptionIntermodalTripHistoryTable();

    } else if (this.disruptionHistoryComboBox.val() === "SHOW_DISRUPTION_HISTORY") {
      console.log(`ProcessDisruptionComponent.disruptionHistoryComboboxOnSelect() SHOW_DISRUPTION_HISTORY CLICKED`);
      this.enableDisruptionStateHistorySourceTableBlock = true;
      this.enableIntermodalTripSourceTableBlock = false;
      this.getDisruptionStateHistoryTable();

    } else if (this.disruptionHistoryComboBox.val() === "SHOW_ALL") {
      console.log(`ProcessDisruptionComponent.disruptionHistoryComboboxOnSelect() SHOW_ALL CLICKED`);
      this.enableIntermodalTripSourceTableBlock = true;
      this.enableDisruptionStateHistorySourceTableBlock = true;
    }
  }

  /**
   * getDisruptionStateHistoryTable() is triggered by selection of combobox
   * and calls the disruption history of the processing disruption
   */
  private getDisruptionStateHistoryTable() {
    console.log(`DisruptionHistoryComponent.getDisruptionStateHistoryTable(..) called.`);
    this.disruptionService.loadDisruptionHistoryTable();
  }

  /**
   * refreshDisruptionStatesTable() is triggered by an observable
   * and loads the list of states into the table conencted to dataAdapter
   */
  private refreshDisruptionStatesTable(statesHistory: DisruptionStatesEntry[]) {
    console.log(`DisruptionHistoryComponent.refreshDisruptionStatesTable(..) called.`);

    var statesHistoryLocal = new Array<DisruptionStatesEntry>();
    statesHistoryLocal = statesHistory;
    this.disruptionStateHistorySource.localdata = statesHistoryLocal;
    this.stateHistoryDataAdapter = new jqx.dataAdapter(this.disruptionStateHistorySource);
  }

  /**
   * getDisruptionIntermodalTripHistoryTable() is triggered by selection of combobox
   * and calls the disrupted intermodal trips of the processing disruption
   */
  private getDisruptionIntermodalTripHistoryTable() {
    console.log(`DisruptionHistoryComponent.getDisruptionIntermodalTripHistoryTable(..) called.`);
    this.disruptionService.loadIntermodalTripsTable();
  }

  /**
   * refreshDisruptedIntermodalTable() is triggered by an observable
   * and loads the list of disrupted intermodal trips into the table conencted to dataAdapter 
   * => but only one phase of three intermodal phases
   * ToDo: Show up a sub section for all intermodal phases
   */
  refreshDisruptedIntermodalTable(disruptedIntermodalTrips: IntermodalTripEntry[]) {
    console.log(`DisruptionHistoryComponent.refreshDisruptedIntermodalTable(..) called.`);
     debugger;
    var disruptedIntermodalTripsLocal = new Array<IntermodalTripEntry>();
    disruptedIntermodalTripsLocal = disruptedIntermodalTrips;
    this.intermodalTripSource.localdata = disruptedIntermodalTripsLocal;
    this.intermodalTripDataAdapter = new jqx.dataAdapter(this.intermodalTripSource);
  }
}
