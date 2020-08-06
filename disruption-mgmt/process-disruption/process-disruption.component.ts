/**
 * Comment Header:
 * ProcessDisruptionComponent is responsible for handling and processing existing disruptions in the process area disruption mgmt. system
 * ProcessDisruptionComponent will be presented by using different tables and a header wich provides further information to the disruption
 * and its affects on the transport planning. A status control will ensure each process step.
 * The component starts by requiring several imports
 */

import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

import { DisruptionMgmtService } from '../disruption.service';
import { TableCfgHelperService, TableConfiguration, DataTableColumns } from '../../../services/table-cfg-helper.service';

import { jqxGridComponent } from 'jqwidgets-ng/jqxgrid';
import { jqxInputComponent } from 'jqwidgets-ng/jqxinput';
import { jqxComboBoxComponent } from 'jqwidgets-ng/jqxcombobox';
import { jqxButtonComponent } from 'jqwidgets-ng/jqxbuttons';
import { jqxLoaderComponent } from 'jqwidgets-ng/jqxloader';
import { jqxNotificationComponent } from 'jqwidgets-ng/jqxnotification';

import {
  THaDisruption, DriversFinder, THaVehicle, THaDriver, IntermodalAlternative, IntermodalAlternativeResp,
  THaDisruptionState, THaDisruptionResp, LineResp, THaKpiBase, THaRouteKPIs, RoutingOption, RoutingRequest,
  PlainPoint, Location, THaAlternativesCommon
} from '../../../../the-haulier-api/model/models';
import { CatalogDriverTripsResult } from '../models/catalog-driver-trips-result';
import { CatalogVehicleTripsResult } from '../models/catalog-vehicle-trips-result';
import { VehicleFinder } from '../models/vehicleFinder';
import { CatalogLineTripsResult } from '../models/catalog-line-trips-result';
import { KpiValueModel } from '../models/kpi-value-model';
import { DriverEntryTableRow } from '../models/driver-entry-model';
import { CatalogDriverResult } from '../models/catalog-driver-result';
import { CatalogVehicleResult } from '../models/catalog-vehicle-result';
import { VehicleEntryTableRow } from '../models/vehicle-entry-model';
import { IntermodalAlternativeEntryTableRow } from '../models/intermodal-alternative-entry-table-row';
import { IntermodalRoutingResponseRowModel } from '../models/intermodal-routing-response-row-model';



@Component({
  selector: 'app-process-disruption',
  templateUrl: './process-disruption.component.html',
  styleUrls: ['./process-disruption.component.css']
})
export class ProcessDisruptionComponent implements OnInit, AfterViewInit {

  private routingOptions = {} as RoutingOption;
  /**
   * ToDo: State Buttons eingebunden
   */
  @ViewChild('disruptionStateCancelButton') disruptionStateCancelButton: jqxButtonComponent;
  @ViewChild('disruptionStateProcessButton') disruptionStateProcessButton: jqxButtonComponent;
  @ViewChild('cancelInformationBtnEnabled') forwardCancellationBtn: jqxButtonComponent;
  @ViewChild('disruptionStateDoneButton') disruptionStateDoneButton: jqxButtonComponent;
  @ViewChild('disruptionResetButton') disruptionResetButton: jqxButtonComponent;
  @ViewChild('searchIntermodalTrip') searchIntermodalTrip: jqxButtonComponent;
  @ViewChild('tourselected') tourselected: jqxButtonComponent;
  /**
   * Send Button which updates Alternative
   */
  @ViewChild('alternativeSendButton') sendButton: jqxButtonComponent;
  /**
   * Cancel Input prompt
   */
  @ViewChild('cancelInformation') cancelInformation: jqxInputComponent;
  /**
   * Table for disrupted Trip
   */
  @ViewChild('intermodalAlternativeDataTableRef') intermodalAlternativeDataTableRef: jqxGridComponent;
  @ViewChild('disruptedIntermodalTourDataTableRef') disruptedIntermodalTourDataTableRef: jqxGridComponent;
  /**
   * Table for alternative driver and vehicles
   */
  @ViewChild('driversDataTableRef') driversDataTableRef: jqxGridComponent;
  @ViewChild('vehiclesDataTableRef') vehiclesDataTableRef: jqxGridComponent;
  /**
   * Solution Comboboxes
   */
  @ViewChild('disruptionVehicleComboBox') disruptionVehicleComboBox: jqxComboBoxComponent;
  @ViewChild('disruptionDriverComboBox') disruptionDriverComboBox: jqxComboBoxComponent;
  @ViewChild('disruptionLineComboBox') disruptionLineComboBox: jqxComboBoxComponent;
  @ViewChild('cancelOptionsComboBox') cancelOptionsComboBox: jqxComboBoxComponent;
  @ViewChild('jqxLoader') jqxLoader: jqxLoaderComponent;
  @ViewChild('jqxLoaderRouting') jqxLoaderRouting: jqxLoaderComponent;
  @ViewChild('notifyTripSelected') notifyTripSelected: jqxNotificationComponent;

  private disruptionType: string;
  processDisruption: THaDisruption;
  disruptionStart: string;
  disruptionEnd: string;
  disruptionReferenceDesc: string;
  intermodalAlByCommonIdentFinder: IntermodalAlternative;
  disruptionReferenceLineRef: string;
  disruptedLineId: string;
  disruptedEntityTripLineId: string;
  disruptedTourRowIndex: any;
  private disruptionTypesAdapter = null;
  private disruptionAssignmentsAdapter = null;
  private disruptionStates: [];
  private disruptionReferenceDriverType: string;
  private disruptionReferenceVehicleType: string;
  private resultPath: string;
  private disruptionReferenceLineType: string;
  private disruptionStateLine: string;

  driverReferencePreName: string;
  driverReferenceName: string;
  driverReferenceEmail: string;
  driverReferenceDateOfBirth: string;
  newDriverFirstName: string;
  newDriverLastName: string;
  private newDriverDetails: THaDriver;
  private driverHeader: DriverEntryTableRow;

  disruptedEntityTripIdent: string;
  disruptedEntityTripState: string;
  disruptedEntityTripStart: string;
  disruptedEntityTripEnd: string;
  disruptedEntityTripVehicle: string;
  disruptedEntityTripDriver: string;
  disruptedEntityTrip: IntermodalAlternative;
  disruptedIntermodalTour: IntermodalAlternativeEntryTableRow;
  vehicleReferenceVehicleType: string;
  public tripsOfDisruptedLine: IntermodalAlternativeEntryTableRow[] = [];
  public intermodalAlternativesOfDiruptedTrip: IntermodalRoutingResponseRowModel[] = [];
  private preHaul: IntermodalAlternativeEntryTableRow;
  private postHaul: IntermodalAlternativeEntryTableRow;
  private mainHaul: IntermodalAlternativeEntryTableRow[] = [];
  private selectedIntermodalAlternativeRoute = <IntermodalRoutingResponseRowModel>{};

  private vehicleRowDetails: VehicleEntryTableRow;
  private vehicleHeader: VehicleEntryTableRow;
  private disruptedEntityTripDepot: string;
  private newVehicleDetails: THaVehicle;
  private vehicleReferenceLicensePlate: string;
  private vehicleReferenceDepot: string;

  /**
   * Variables to enable or disable UI elements
   */
  private enableUISearchTripByDriver: boolean = false;
  private enableShowTripByDriverDetails: boolean = false;
  private enableUISearchTripByVehicle: boolean = false;
  private enableShowTripByVehicleDetails: boolean = false;
  showSendButton: boolean = false;
  showSelectedTourButton: boolean = false;
  showNotripsFound: boolean = false;
  cancelInformationBtnEnabled: boolean = false;
  cancelInformationInputEnabled: boolean = false;
  cancelEnabled: boolean = false;
  resetEnabled: boolean = true;
  inProcessEnabled: boolean = true;
  doneEnabled: boolean = false;
  selectedTourButtonEnabled: boolean = false;
  enableSendButton: boolean = false;
  showSolutionTripVehicle: boolean = false;
  showSolutionTripDriver: boolean = false;
  referenceBlockDriverEnabled: boolean = false;
  referenceBlockVehicleEnabled: boolean = false;
  referenceBlockLineEnabled: boolean = false;
  entityInTripsFound: boolean = false;
  noEntityTripsFound: boolean = false;
  showInformCustomer: boolean = false;
  showSolutionDriverDropdown: boolean = false;
  showSolutionVehicleDropdown: boolean = false;
  showCancelOptions: boolean = false;
  newDriverAlternativeTrip: boolean = false;
  newVehicleAlternativeTrip: boolean = false;
  showSolutionLineDropdown: boolean = false;
  showdisruptedIntermodalTour: boolean = false;
  searchIntermodalTripEnabled: boolean = false;
  showIntermodalTourSearchButton: boolean = false;
  enableDisruptedIntermodalTourTable: boolean = true;
  enableIntermodalAlternativeTourTable: boolean = true;
  disruptionHistoryComponentEnabled: boolean = false;
  processDisruptionEnabled: boolean = false;
  processDisruptionEnabledDefault: boolean = true;
  disruptionHistoryEnabledDefault: boolean = true;

  /**
   * These variables are for alternative which are selected in the alterantive grid
   */
  newIntermodalAlternative = <IntermodalAlternative>{};
  setIntermodalAlternative = <IntermodalAlternative>{};
  private newIntermodalAlternativeStart: string;
  private newIntermodalAlternativeEnd: string;
  disruptedIntermodalAlternative = <IntermodalAlternative>{};

  /**
   * These are hardcoded solutions for the solutionscombox
   * ToDo: Bind solution options to disruptions catalog
   */
  driverSolutionsAdapter: string[] = [
    "ASSIGN_ALTERNATIVE_DRIVER",
    "ESCALATION"
  ];

  vehicleSolutionsAdapter: string[] = [
    "ASSIGN_ALTERNATIVE_VEHICLE",
    "ESCALATION"
  ];

  lineSolutionsAdapter: string[] = [
    "CALCULATE_ALTERNATIVE_ROUTE",
    "ESCALATION"
  ];

  cancelOptionsAdapter: string[] = [
    "LINE_HAS_NO_TRIP_ASSIGNMENT",
    "DRIVER_HAS_NO_TRIP_ASSIGNMENT",
    "VEHICLE_HAS_NO_TRIP_ASSIGNMENT"

  ]

  /**
   * Source mapping table for the alternative driver
   * jqx DataAdapter binds data to the jqx table
   */
  private driversDataSource = {
    localdata: [],
    datatype: "array",
    datafields: [
      { name: 'sequence', type: 'number' },
      { name: 'selected', type: 'boolean' },
      { name: 'ident', type: 'string' },
      { name: 'firstname', type: 'string' },
      { name: 'lastname', type: 'string' },
      { name: 'email', type: 'string' },
      { name: 'dateOfBirth', type: 'string' }
    ]
  };
  driversDataAdapter: any = new jqx.dataAdapter(this.driversDataSource);
  public driversTableConfiguration: TableConfiguration;
  public driversColumns: any[] = [];

  /**
   * Source mapping table for the alternative vehicle
   * jqx DataAdapter binds data to the jqx table
   */
  private vehiclesDataSource = {
    localdata: [],
    datatype: "array",
    datafields: [
      { name: 'licensePlate', type: 'string' },
      { name: 'depot', type: 'string' },
      { name: 'vehicleType', type: 'string' },
      { name: 'sequence', type: 'number' },
      { name: 'selected', type: 'boolean' },
      { name: 'extId', type: 'string' }
    ]
  };
  vehiclesDataAdapter: any = new jqx.dataAdapter(this.vehiclesDataSource);
  public vehiclesTableConfiguration: TableConfiguration;
  public vehiclesColumns: any[] = [];

  /**
   * Source mapping table for the disrupted intermodal trip
   * jqx DataAdapter binds data to the jqx table
   */
  private disruptedIntermodalTourSource = {
    localdata: [],
    datatype: "array",
    datafields: [
      { name: 'lineId', type: 'string' },
      { name: 'sequence', type: 'number' },
      { name: 'selected', type: 'boolean' },
      { name: 'ident', type: 'string' },
      { name: 'startTime', type: 'string' },
      { name: 'endTime', type: 'string' },
      { name: 'co2', type: 'number' },
      { name: 'duration', type: 'string' },
      { name: 'distance', type: 'number' },
      { name: 'costs', type: 'string' }
    ]
  };
  disruptedIntermodalTourDataAdapter: any = new jqx.dataAdapter(this.disruptedIntermodalTourSource);
  public disruptedIntermodalTourConfiguration: TableConfiguration;
  public disruptedIntermodalTourColumns: any[] = [];

  /**
   * Source mapping table for the alternative intermodal trip with delta columns
   * jqx DataAdapter binds data to the jqx table
   */
  private intermodalAlternativeSource = {
    localdata: [],
    datatype: "array",
    datafields: [
      { name: 'sequence', type: 'number' },
      { name: 'route', type: 'string' },
      { name: 'numberOfTransfers', type: 'number' },
      { name: 'start', type: 'string' },
      { name: 'totalDuration', type: 'number' },
      { name: 'totalCost', type: 'number' },
      { name: 'totalTravelTimeIM', type: 'number' },
      { name: 'totalTravelTimeRoad', type: 'number' },
      { name: 'co2', type: 'number' },
      { name: 'distance', type: 'number' },
      { name: 'deltaDuration', type: 'number' },
      { name: 'deltaCost', type: 'number' },
      { name: 'deltaEmission', type: 'number' }
    ]
  };
  intermodalAltenativeDataAdapter: any = new jqx.dataAdapter(this.intermodalAlternativeSource);
  public intermodalAlternativeTableConfiguration: TableConfiguration;
  intermodalAlternativeColumns: DataTableColumns[] = [];

  /**
   * Loading several services in by cosntructor 
   * Translation service for ui elemnts etc.
   * Table helper service for conguring tables
   */
  constructor(private datePipe: DatePipe, private translateService: TranslateService, private tableCfgHelperService: TableCfgHelperService,
    private disruptionService: DisruptionMgmtService) {

    console.log(`ProcessDisruptionComponent.constructor(..) called.`);
  }

  ngAfterViewInit(): void {

    console.log(`ProcessDisruptionComponent.ngAfterViewInit(..) called.`);
  }

  ngOnInit(): void {
    console.log(`ProcessDisruptionComponent.ngOnInit(..) called.`);


    /**
     * Drivers table receives table, column configuration
     */
    this.driversTableConfiguration = this.tableCfgHelperService.getTableConfig("Disruption", "DisruptionGridDriverComponent");
    if (this.driversTableConfiguration === null) {

      console.error(`ProcessDisruptionComponent.ngOnInit(..) TableConfiguration not valid`);
      return;
    }
    this.driversColumns = this.driversTableConfiguration.columns;

    /**
     * vehicles table receives table, column configuration
     */
    this.vehiclesTableConfiguration = this.tableCfgHelperService.getTableConfig("Disruption", "DisruptionGridVehicleComponent");
    if (this.vehiclesTableConfiguration === null) {

      console.error(`ProcessDisruptionComponent.ngOnInit(..) TableConfiguration not valid`);
      return;
    }
    this.vehiclesColumns = this.vehiclesTableConfiguration.columns;

    /**
     * Intermodal alternatives table receives table configuration 
     * and a special column configuration to highlight delta values
     */
    this.intermodalAlternativeTableConfiguration = this.tableCfgHelperService.getTableConfig("Disruption", "DisruptionIntermodalRouteGrid");
    if (this.intermodalAlternativeTableConfiguration === null) {

      console.error(`ProcessDisruptionComponent.ngOnInit(..) TableConfiguration not valid`);
      return;
    }
    this.intermodalAlternativeTableConfiguration.columns.forEach(dataTableColumn => {
      dataTableColumn.cellClassName = this.cellClassIntermodalAlternatives;
    });
    this.intermodalAlternativeColumns = this.intermodalAlternativeTableConfiguration.columns;

    /**
     * Intermodal disrupted trips table receives table configuration and table configuration
     */
    this.disruptedIntermodalTourConfiguration = this.tableCfgHelperService.getTableConfig("Disruption", "DisruptionIntermodalTourGrid");
    if (this.disruptedIntermodalTourConfiguration === null) {

      console.error(`ProcessDisruptionComponent.ngOnInit(..) TableConfiguration not valid`);
      return;
    }
    this.disruptedIntermodalTourColumns = this.disruptedIntermodalTourConfiguration.columns;

    this.processSelectedDisruption(this.disruptionService.getCurrentDisruption2Process());
    this.createObservables();
    this.initializeCatalog(true);
  }

  /**
   * cellClassIntermodalAlternatives is responsible to manage the color scheme of the intermodal alternatives delta
   */
  cellClassIntermodalAlternatives = (row: any, dataField: any, cellText: any, rowData: any): string => {

    console.log(`ProcessDisruptionComponent.cellClassIntermodalAlternatives(..) called`);

    let cellValue = rowData[dataField];
    switch (dataField) {
      case 'deltaCost':
        if (cellValue < 0) {
          return 'bg-delta-positive'; // green
        } else if (cellValue > 0) {
          return 'bg-delta-negative'; // red
        }
      case 'deltaDuration':
        if (cellValue < 0) {
          return 'bg-delta-positive';
        } else if (cellValue > 0) {
          return 'bg-delta-negative';
        }
      case 'deltaEmission':
        if (cellValue < 0) {
          return 'bg-delta-positive';
        } else if (cellValue > 0) {
          return 'bg-delta-negative';
        }
    }
  }

  /**
   * All important observables for this component are defined in the following
   */
  createObservables() {

    console.log(`CreateStepperDisruptionComponent.createObservables(..) called.`);

    if (this.disruptionService.containsSubscription("ProcessDisruptionComponent") === false) {

      // information about the selected disruption from the data table is provided to this component
      this.disruptionService.enableProcessDisruptionObservable.subscribe((processSelectedDisruption) => { this.processSelectedDisruption(processSelectedDisruption) });
      console.log(`ProcessDisruptionComponent.createObservables(..) initialized processSelectedDisruption.`);

      // updates alternative driver table
      this.disruptionService.driversFinderObservable.subscribe((resultDriverSearch) => { this.resultDriverSearch(resultDriverSearch) });
      console.log(`ProcessDisruptionComponent.createObservables(..) initialized resultDriverSearch.`);

      // update alterantive vehicle table
      this.disruptionService.vehiclesFinderObservable.subscribe((resultVehicleSearch) => { this.resultVehiclesSearch(resultVehicleSearch) });
      console.log(`ProcessDisruptionComponent.createObservables(..) initialized resultVehicleSearch.`);

      // updates the affected trip by the disrupted driver
      this.disruptionService.intermodaleAlternativeFinderByDriverObservable.subscribe((resultDriverTrips) => { this.refreshTripsOfDriver(resultDriverTrips) });
      console.log(`ProcessDisruptionComponent.createObservables(..) initialized resultDriverTrips.`);

      // updates the affected trip by the disrupted vehicle
      this.disruptionService.intermodaleAlternativeFinderByVehicleObservable.subscribe((resultVehicleTrips) => { this.refreshTripsOfVehicle(resultVehicleTrips) });
      console.log(`ProcessDisruptionComponent.createObservables(..) initialized resultVehicleTrips`);

      // updates the disrupted intermodal tour table
      this.disruptionService.intermodalAlternativeFinderByNetLineObservable.subscribe((resultNetLineTrips) => { this.refreshTripsOfNetLine(resultNetLineTrips) });
      console.log(`ProcessDisruptionComponent.createObservables(..) initialized resultNetLineTrips`);

      // receives all affected trips by the chosen disrupted IM Trip
      this.disruptionService.intermodalTourFinderByCommonIdentObservable.subscribe((resultDisruptedIntermodalTour) => { this.receiveAllHaulsOfIMTrip(resultDisruptedIntermodalTour) });
      console.log(`ProcessDisruptionComponent.createObservables(..) initialized resultDisruptedIntermodalTour`);

      // this.disruptionService.intermodaleAlternativeResponseObservable.subscribe((resultNewIntermodalAlternative) => { this.onNewIntermodalAlternative(resultNewIntermodalAlternative) });
      // console.log(`ProcessDisruptionComponent.createObservables(..) initialized resultNewIntermodalAlternative`);

      // updates the intermodal ALternative table
      this.disruptionService.updateRoutingResponseTableObservable.subscribe((resultIntermodalAlternativeRoutes) => { this.updateIntermodalAlternatives(resultIntermodalAlternativeRoutes) });
      console.log(`ProcessDisruptionComponent.createObservables(..) initialized resultIntermodalAlterantiveRoutes`);

      // updates the disruption catalog
      this.disruptionService.disruptionCatalogLoadedObservable.subscribe(loaded => { this.initializeCatalog(loaded) });
      console.log(`ProcessDisruptionComponent.createObservables(..) initialized catalog.`);

      // updates the disruption states
      this.disruptionService.disruptionStatesObservable.subscribe((disruptionStates) => { this.getDisruptionStates(disruptionStates) });
      console.log(`ProcessDisruptionComponent.createObservables(..) initialized disruption States.`);

    }
  }

  /**
   * updateIntermodalAlternatives() triggered by an observable and presents the available intermodal alternatives to the user
   * Data is loaded into the table by jqx dataAdapter
   */
  private updateIntermodalAlternatives(resultIntermodalAlternativeRoutes: IntermodalRoutingResponseRowModel[]) {

    console.log(`ProcessDisruptionComponent.updateIntermodalAlternatives(..) called`);
    this.jqxLoaderRouting.close();
    this.intermodalAlternativesOfDiruptedTrip = resultIntermodalAlternativeRoutes;
    this.intermodalAlternativeSource.localdata = this.intermodalAlternativesOfDiruptedTrip;
    this.intermodalAltenativeDataAdapter = new jqx.dataAdapter(this.intermodalAlternativeSource);

    /**
     * Transform results to add KPI values
     * A for each loop adds for every alternative a kpi
     * the typed array THaRouteKPIs and unique idents (R1, R2, R3,..) of the alternatives will be hand over to the addKpiToDisruption()
     */
    let keyValueLineIdent = [];
    let trips: Array<THaRouteKPIs> = [];

    let trip: THaRouteKPIs = {};
    resultIntermodalAlternativeRoutes.forEach(element => {

      keyValueLineIdent.push(element.route);
      trip.tourIdent = element.route;
      trip.cost = element.totalCost;
      trip.duration = element.totalDuration;
      trip.emission = element.co2;

      trips.push(trip);
    });

    var kpiName = "kpi-alternative-routes-found";
    this.addKpiToDisruption(kpiName, keyValueLineIdent, trips);
  }



  // Diruption Catalog is been initialized
  private initializeCatalog(loaded: boolean) {

    console.log(`ProcessDisruptionComponent.initialize Catalog(..) called)`);
    this.disruptionTypesAdapter = this.disruptionService.getAllDisrutionTypes("PROCESS");
    this.disruptionAssignmentsAdapter = this.disruptionService.getAllDisruptionAssignments("");
  }

  /**
   * This method is called by an observable
   * This method receives the disruption obbject by the selected disruption from the CreateStepperComponent
   * When the selected disruption already has been processed and has a status of DONE or CANCELLED it will enable the history component
   * When the selected disruption has not been processed yet and has a status of NEW or "IN_PROCESS" (=> Only during testing) 
   * It will enable certain UI elements, change the status of the disruption to "IN_PROCESS" 
   * and  continue the control flow in the process disruption component by calling setProcessHeader()
   *  
   */
  private processSelectedDisruption(processCurrentDisruption: THaDisruption) {

    console.log(`ProcessDisruptionComponent.processSelectedDisruption(..) called)`);

    if (processCurrentDisruption != null) {

      if (processCurrentDisruption.currentState.state === "DONE" || processCurrentDisruption.currentState.state === "CANCELLED") {
        console.log(`ProcessDisruptionComponent.processSelectedDisruption(STATE ${JSON.stringify(processCurrentDisruption.currentState.state)}) => TRIGGERED)`);

        this.disruptionHistoryComponentEnabled = true;
        this.processDisruptionEnabledDefault = false;
        this.processDisruptionEnabled = false;

      } else if (processCurrentDisruption.currentState.state === "NEW" || processCurrentDisruption.currentState.state === "IN_PROCESS") {

        this.disruptionHistoryComponentEnabled = false;
        this.processDisruptionEnabledDefault = false;
        this.processDisruptionEnabled = true;
        this.cancelEnabled = false;
        this.processDisruption = this.disruptionService.getCurrentDisruption2Process();

        this.setProcessHeader();
      }
    }

    else {

      console.error(`ProcessDisruptionComponent.processSelectedDisruption(..): Error parameter null not valid)`);
    }
  }

  /**
   * The header of processing disruption is set to view details on the disruption
   * Based on the disruption type a different layout and detail view will be provided for the user
   * To provide full details based on disruption type the details of driver and vehicle will be request at the WebAPI
   * LineId excepted because there are no further details to aquire
   * @param processCurrentDisruption
   */
  private setProcessHeader() {

    console.log(`ProcessDisruptionComponent.setProcessHeader() called`);

    this.disruptionType = this.processDisruption.type;

    if (this.processDisruption.reference.type === "THaDriver") {
      console.log(`ProcessDisruptionComponent.setProcessHeader => DRIVER_SELECTED`);
      this.referenceBlockDriverEnabled = true;
      this.referenceBlockVehicleEnabled = false;

      var driversFinder = <DriversFinder>{};
      driversFinder.ident = this.processDisruption.reference.ident;
      this.disruptionService.searchDrivers("setProcessHeader", driversFinder);
    }
    else if (this.processDisruption.reference.type === "THaVehiclesResp" || this.processDisruption.reference.type === "THaVehicle") {

      this.referenceBlockDriverEnabled = false;
      this.referenceBlockVehicleEnabled = true;

      var thaVehicleFinder = <THaVehicle>{};
      thaVehicleFinder.ident = this.processDisruption.reference.ident;
      this.disruptionService.searchVehicles("setProcessHeader", thaVehicleFinder);
    }
    else if (this.processDisruption.reference.type === "LineResp") {

      this.referenceBlockDriverEnabled = false;
      this.referenceBlockVehicleEnabled = false;
      this.referenceBlockLineEnabled = true;
      this.disruptionStart = this.transformDate(this.processDisruption.startTime, "DisruptionProcessComponent.DateFormat");
      this.disruptionEnd = this.transformDate(this.processDisruption.endTime, "DisruptionProcessComponent.DateFormat");
      this.disruptionReferenceLineType = this.processDisruption.reference.type;
      this.disruptionReferenceLineRef = this.processDisruption.reference.desc;
      this.disruptedLineId = this.processDisruption.reference.ident;
    }
  }

  /**
   * This method is called by an observable and stores the disruption states in a global variable
   * @param disruptionStates
   */
  private getDisruptionStates(disruptionStates: any) {

    console.log(`ProcessDisruptionComponent.getDisruptionStates(..) called)`);

    this.disruptionStates = disruptionStates;
  }

  /**
   * resultDriverSearch() is splitted into two instrucitons
   * First instructions: Returns the driver of the disruption to show full details in process header 
   * Second instructions: Returns the alternative drivers to resolve the disruption to present them in a jqx data table
   * => controlled by a request ID
   * and for the ui area which displays 
   * @param resultDriverSearch
   */
  private resultDriverSearch(resultDriverSearch: CatalogDriverResult) {

    console.log(`ProcessDisruptionComponent.resultDriverSearch(..) called`);

    // Instruction for full information about driver
    if (resultDriverSearch.requestId === "setProcessHeader") {

      if (resultDriverSearch.drivers.length != null || resultDriverSearch.drivers.length > 0) {
        this.driverHeader = resultDriverSearch.drivers[0];

        console.log(`ProcessDisruptionComponent.resultDriverSearch(..) TYPE ${this.disruptionType}`);
        this.disruptionStart = this.transformDate(this.processDisruption.startTime, "DisruptionProcessComponent.DateFormat");
        this.disruptionEnd = this.transformDate(this.processDisruption.endTime, "DisruptionProcessComponent.DateFormat");
        this.disruptionReferenceDriverType = this.processDisruption.reference.type;
        this.driverReferenceEmail = this.driverHeader.email;
        this.driverReferenceName = this.driverHeader.lastname;
        this.driverReferencePreName = this.driverHeader.firstname;
        /**
         * ToDo: Repair tranformDate Method (does not work on birthday)
         */
        this.driverReferenceDateOfBirth = this.driverHeader.dateOfBirth;


      } else {
        console.error("ProcessDisruptionComponent.resultDriverSearch(..) No Driver Found");
      }
    }
    /**
     * Second instruction for creating a jqx data table per dataAdapter
     */
    else if (resultDriverSearch.requestId === "driverSolutionComboBoxOnSelect") {

      this.showSendButton = true;
      this.driversDataSource.localdata = resultDriverSearch.drivers;
      this.driversDataAdapter = new jqx.dataAdapter(this.driversDataSource);

      /**
       * The alternative drivers are stored in a kpi object and pushed intp typed array
       * The parametes are handed over into the called method addKpiToDisruption()
       */
      let keyValueDriverIdents = [];
      const kpiValueModel = new Array<KpiValueModel>();
      resultDriverSearch.drivers.forEach(driverElement => {

        const resultDriverAmount = new KpiValueModel();
        resultDriverAmount.ident = driverElement.ident;

        keyValueDriverIdents.push(resultDriverAmount);
      });

      var kpiName = "kpi-alternative-drivers-found";
      this.addKpiToDisruption(kpiName, keyValueDriverIdents);
    }
    else {

      console.error(`ProcessDisruptionComponent.resultDriverSearch(${resultDriverSearch.requestId}) is not supported`);
    }
  }

  /**
   * resultVehiclesSearch() is splitted into two instrucitons
   * First instructions: Returns the vehicle of the disruption to show full details in process header 
   * Second instructions: Returns the alternative vehicles to resolve the disruption to present them in a jqx data table
   * => controlled by a request ID
   * and for the ui area which displays 
   * @param resultVehicleSearch
   */
  private resultVehiclesSearch(resultVehicleSearch: CatalogVehicleResult) {
    console.log(`ProcessDisruptionComponent.resultVehiclesSearch(..) called`);

    // First instruction to view full details of vehicle
    if (resultVehicleSearch.requestId === "setProcessHeader") {

      if (resultVehicleSearch.vehicles.length != null || resultVehicleSearch.vehicles.length > 0) {

        this.vehicleHeader = resultVehicleSearch.vehicles[0];

        console.log(`ProcessDisruptionComponent.resultVehiclesSearch(..) called TYPE ${this.disruptionType}`);
        this.disruptionStart = this.transformDate(this.processDisruption.startTime, "DisruptionProcessComponent.DateFormat");
        this.disruptionEnd = this.transformDate(this.processDisruption.endTime, "DisruptionProcessComponent.DateFormat");
        this.disruptionReferenceVehicleType = this.processDisruption.reference.type;
        this.vehicleReferenceDepot = this.vehicleHeader.depot;
        this.vehicleReferenceLicensePlate = this.vehicleHeader.licensePlate;
        this.vehicleReferenceVehicleType = this.vehicleHeader.vehicleType;
      }
      else {

        console.error("ProcessDisruptionComponent.resultVehiclesSearch(..) No Vehicle Found");
      }
    }
    // Second instructions to view the alternative vehicles in a jqx data table
    else if (resultVehicleSearch.requestId === "vehicleSolutionComboBoxOnSelect") {

      this.showSendButton = true;
      this.vehiclesDataSource.localdata = resultVehicleSearch.vehicles;
      this.vehiclesDataAdapter = new jqx.dataAdapter(this.vehiclesDataSource);

      /**
       * The alternative vehicles are stored in a kpi object and pushed intp typed array
       * The parametes are handed over into the called method addKpiToDisruption()
       */
      let keyValueVehicleIdents = [];
      const kpiValueModel = new Array<KpiValueModel>();
      resultVehicleSearch.vehicles.forEach(vehicleElement => {

        const resultVehicleAmount = new KpiValueModel();
        resultVehicleAmount.ident = vehicleElement.licensePlate;

        keyValueVehicleIdents.push(resultVehicleAmount);
      });
      console.log(`ProcessDisruptionComponent.resultVehiclesSearch(..) => KPI Values Objects ${JSON.stringify(keyValueVehicleIdents)}`);

      var kpiName = "kpi-alternative-vehicles-found";
      this.addKpiToDisruption(kpiName, keyValueVehicleIdents);
    }
    else {

      console.error(`ProcessDisruptionComponent.resultVehiclesSearch(${resultVehicleSearch.requestId}) is not supported`);
    }
  }

  /**
   * refreshTripsOfDriver() will make the disrupted trip (by driver) on the ui available with detailed informations
   */
  private refreshTripsOfDriver(resultDriverTrips: CatalogDriverTripsResult) {

    console.log(`ProcessDisruptionComponent.refreshTripsOfDriver() called`);
    this.jqxLoader.close();

    if (resultDriverTrips.path === "DRIVER_HAS_TRIP_ASSIGNMENT") {
      var disruptedEntityTrip = Array<IntermodalAlternative>();

      this.disruptedEntityTrip = resultDriverTrips.intermodalAlternatives[0];
      this.controlUiAndValue("DRIVER_HAS_TRIP_ASSIGNMENT")


      // Stores the path for Done Procedure
      this.resultPath = resultDriverTrips.path;


      // Only trips that have an earlier start than the end of processing disruptions
      var i;
      for (i = 0; i < disruptedEntityTrip.length; i++) {

        if (disruptedEntityTrip[i].startTime < this.processDisruption.endTime) {
          this.disruptedEntityTrip[i].selected = true;
        } else {
          this.disruptedEntityTrip = resultDriverTrips.intermodalAlternatives[0];
        }
      }

      this.disruptedEntityTripIdent = this.disruptedEntityTrip.ident;
      this.disruptedEntityTripState = this.disruptedEntityTrip.state;
      this.disruptedEntityTripStart = this.transformDate(this.disruptedEntityTrip.startTime, "DisruptionProcessComponent.DateFormat");
      this.disruptedEntityTripEnd = this.transformDate(this.disruptedEntityTrip.endTime, "DisruptionProcessComponent.DateFormat");
      this.disruptedEntityTripVehicle = this.disruptedEntityTrip.vehicleId;
      this.disruptedEntityTripDriver = this.disruptedEntityTrip.driverId;

      /**
       * The disrupted trip is gonna be stored in a kpi object and pushed intp typed array
       * The parametes are handed over into the called method addKpiToDisruption()
       */
      let keyValueDriverIdent = [];
      let trips: Array<THaRouteKPIs> = [];

      resultDriverTrips.intermodalAlternatives.forEach(element => {
        keyValueDriverIdent.push(element.ident);
        let trip: THaRouteKPIs = {};

        trip.tourIdent = element.ident;
        trip.cost = element.commonalities.totalCosts;
        trip.duration = element.commonalities.totalDuration;
        trip.emission = element.routingSegment.emission.carbonDioxide;

        trips.push(trip);
      });

      console.log(`ProcessDisruptionComponent.refreshTripsOfDriver(..) => KPI Values Objects ${JSON.stringify(keyValueDriverIdent)} and ${JSON.stringify(trips)}`);

      var kpiName = "kpi-disrupted-driver-trips-found";
      this.addKpiToDisruption(kpiName, keyValueDriverIdent, trips);

    } else if (resultDriverTrips.path === "DRIVER_HAS_NO_TRIP_ASSIGNMENT") {

      this.controlUiAndValue("DRIVER_HAS_NO_TRIP_ASSIGNMENT")

      // store path for done procedure
      this.resultPath = resultDriverTrips.path;

    } else {
      console.error(`ProcessDisruptionComponent.refreshTripsOfDriver() strange error`);
    }
  }

  /**
   * refreshTripsOfVehicle() will make the disrupted trip (by vehicles) on the ui available with detailed informations
   */
  private refreshTripsOfVehicle(resultVehicleTrips: CatalogVehicleTripsResult) {

    console.log(`ProcessDisruptionComponent.refreshTripsOfVehicle() called`);
    this.jqxLoader.close();

    if (resultVehicleTrips.path === "VEHICLE_HAS_TRIP_ASSIGNMENT") {
      var disruptedEntityTrip: IntermodalAlternative;
      // disruptedEntityTrip = resultVehicleTrips.intermodalAlternatives;
      this.entityInTripsFound = true;
      this.noEntityTripsFound = false;
      this.cancelEnabled = false;
      this.showSolutionVehicleDropdown = true;

      // Stores the path for Done Procedure
      this.resultPath = resultVehicleTrips.path;

      // It sets parameter selected = true at all trips which are out of disruption range (not affected by disruption)  => Use cannot work on them
      var i;
      for (i = 0; i < resultVehicleTrips.intermodalAlternatives.length; i++) {

        if (resultVehicleTrips.intermodalAlternatives[i].startTime > this.processDisruption.endTime) {

          console.log(`rocessDisruptionComponent.refreshTripsOfVehicle(${resultVehicleTrips.intermodalAlternatives[i]}) => Trip not in Disruption Time`);

        } else if (resultVehicleTrips.intermodalAlternatives[i].startTime > this.processDisruption.startTime &&
          resultVehicleTrips.intermodalAlternatives[i].startTime < this.processDisruption.endTime) {
          this.disruptedEntityTrip = resultVehicleTrips.intermodalAlternatives[0];
          break;
        }
      }

      /**
       * These variables are linked to HTML elements and present relevant values on the UI about the disrupted trip
       */
      this.disruptedEntityTripIdent = this.disruptedEntityTrip.ident;
      this.disruptedEntityTripState = this.disruptedEntityTrip.state;
      this.disruptedEntityTripStart = this.transformDate(this.disruptedEntityTrip.startTime, "DisruptionProcessComponent.DateFormat");
      this.disruptedEntityTripEnd = this.transformDate(this.disruptedEntityTrip.endTime, "DisruptionProcessComponent.DateFormat");
      this.disruptedEntityTripVehicle = this.disruptedEntityTrip.vehicleId;
      this.disruptedEntityTripDriver = this.disruptedEntityTrip.driverId;

      /**
       * Declare typed array to store all KPIs by each disrupted trip
       * Declare variable which stores the unique ident of affected trips
       */
      let keyValueVehicleIdent = [];
      let trips: Array<THaRouteKPIs> = [];

      /**
       * For each loop for all disrupted trips by the disruption VEHICLE_DEFECT
       * Stores the main KPIs and unique ident of each disrupted trip
       * Then pushes them into a typed array trips
       */
      resultVehicleTrips.intermodalAlternatives.forEach(element => {

        if (element.startTime >= this.disruptedEntityTrip.startTime && element.endTime <= this.disruptedEntityTrip.endTime) {
          let trip: THaRouteKPIs = {};
          trip.tourIdent = element.ident;
          trip.cost = element.commonalities.totalCosts;
          trip.duration = element.commonalities.totalDuration;
          trip.emission = element.routingSegment.emission.carbonDioxide;
          trips.push(trip);

          keyValueVehicleIdent.push(element.ident);

        } else {
          console.log(`ProcessDisruptionComponent.refreshTripsOfVehicle(..) => ELSE NO TRIPS`);
        }
      });

      console.log(`ProcessDisruptionComponent.refreshTripsOfVehicle(..) => KPI Values Objects ${JSON.stringify(keyValueVehicleIdent)} and ${JSON.stringify(trips)}`);

      var kpiName = "kpi-disrupted-vehicle-trips-found";
      this.addKpiToDisruption(kpiName, keyValueVehicleIdent, trips);


    } else if (resultVehicleTrips.path === "VEHICLE_HAS_NO_TRIP_ASSIGNMENT") {
      console.log(`ProcessDisruptionComponent.refreshTripsOfVehicle() np vehicles found`);
      this.controlUiAndValue("VEHICLE_HAS_NO_TRIP_ASSIGNMENT")

      // Stores the path for Done Procedure
      this.resultPath = resultVehicleTrips.path;

    } else {
      console.error(`ProcessDisruptionComponent.refreshTripsOfVehicle() strange error`);
    }
  }

  /**
   * This method is triggered by an Observable which hands over the disrupted trips of a LINE_CANCELLED disruption 
   * First it closes the loader
   * Then it calls the controlUIAndValue() by a param to enable and disable some UI elements
   * It sets parameter selected = true at all trips which are out of disruption range (not affected by disruption)  => Use cannot work on them
   * Then it updates the source for the dataAdapter for the table disruptedIntermodalTourConfiguration
   * Then it stores KPI Objects in the disruptions to later follow the KPIs of the disrupted Trip
   */
  private refreshTripsOfNetLine(resultNetLineTrips: CatalogLineTripsResult) {

    console.log(`ProcessDisruptionComponent.refreshTripsOfNetLine() called`);
    this.jqxLoader.close();
    this.enableDisruptedIntermodalTourTable = true;

    if (resultNetLineTrips.path === "LINE_HAS_TRIP_ASSIGNMENT" || resultNetLineTrips.path === "TRAIN_LINE_HAS_TRIP_ASSIGNMENT") {

      this.controlUiAndValue("LINE_HAS_TRIP_ASSIGNMENT")

      /**
       * received lines are declared as typed array (the table rows)
       */
      this.tripsOfDisruptedLine = resultNetLineTrips.intermodalAlternativeEntryTableRows;

      /**
       * the selected attribute receives a value of true for each trip which is out of disruption range
       * => meaning not affected trip will not be displayed at the user interface
       * Check for upper/ lower cases 
       * => lower case trips are already applied alternatives
       */
      var i;
      for (i = 0; i < this.tripsOfDisruptedLine.length; i++) {

        // a disrutped IM trip is defined by its start of execution being in between start and end time of disruption 
        if (this.tripsOfDisruptedLine[i].ident === this.tripsOfDisruptedLine[i].ident.toUpperCase() &&
        // Das generiert weniger Ausfälle this.tripsOfDisruptedLine[i].startTime > this.transformDate(this.processDisruption.startTime, "DisruptionGridComponent.DateFormat") &&
          this.tripsOfDisruptedLine[i].startTime < this.transformDate(this.processDisruption.endTime, "DisruptionGridComponent.DateFormat")) {
          this.tripsOfDisruptedLine[i].selected = false;
        }
        else {
          this.tripsOfDisruptedLine[i].selected = true;
        }
      }

      /**
       * load affected trips into table as intermodalAlternativeEntryTableRows
       */
      this.disruptedIntermodalTourSource.localdata = this.tripsOfDisruptedLine;
      this.disruptedIntermodalTourDataAdapter = new jqx.dataAdapter(this.disruptedIntermodalTourSource);

      /**
      * Declare typed array to store all KPIs by each disrupted trip
      * Declare variable which stores the unique ident of affected trips
      */
      let trips: Array<THaRouteKPIs> = [];
      let keyValueLineIdent = [];

      /**
       * For each loop for all disrupted trips by the disruption LINE_CANCELLED
       * Stores the main KPIs and unique ident of each disrupted trip
       * Then pushes them into a typed array trips
       */
      resultNetLineTrips.intermodalAlternativeEntryTableRows.forEach(element => {
        let trip: THaRouteKPIs = {};

        keyValueLineIdent.push(element.ident);
        trip.tourIdent = element.ident;
        trip.cost = element.costs;
        trip.duration = element.duration;
        trip.emission = element.emissions;

        trips.push(trip);
      });

      /**
       * sets a kpi name for the later in addKpiToDisruption() created kpiBase object
       * Then all parametes are handed over to addKpiToDisruption() which will create a kpi object 
       */
      var kpiName = "kpi-disrupted-train-line-trips-found";
      this.addKpiToDisruption(kpiName, keyValueLineIdent, trips);

      /**
       * Stores the path for Done Procedure
       */
      this.resultPath = resultNetLineTrips.path;

      /**
       * This method is called in case the affected line has not trip assignment
       * First it will enable and disable certain ui elements by calling controlUiAndValue()
       * Within this it will enable a cancel button on the ui to trigger disruptionStateCancelButtonOnClick()
       */
    } else if (resultNetLineTrips.path === "LINE_HAS_NO_TRIP_ASSIGNMENT" || resultNetLineTrips.path === "TRAIN_LINE_HAS_NO_TRIP_ASSIGNMENT") {

      console.log(`ProcessDisruptionComponent.refreshTripsOfNetLine() => no trips found`);

      this.controlUiAndValue("LINE_HAS_NO_TRIP_ASSIGNMENT");

      /**
      * Stores the path for Done Procedure
      */
      this.resultPath = resultNetLineTrips.path;

    } else if (resultNetLineTrips.path === "INFORM_CUSTOMER") {
      console.log(`ProcessDisruptionComponent.refreshTripsOfNetLine() => Inform Customer`);
      this.controlUiAndValue("INFORM_CUSTOMER");

    }
    else {
      console.error(`ProcessDisruptionComponent.refreshTripsOfNetLine() strange error`);
    }
  }

  /**
   * receiveAllHaulsOfIMTrip() is triggered by an observable 
   * and provides the full intermodal trip of the selected disruption LINE_CANCELLED
   * The pre and post haul are extracted in order to find start and end point of the intermodal trip
   * These hauls will be handed over to calculate routing alternatives
   */
  private receiveAllHaulsOfIMTrip(resultDisruptedIntermodalTour: CatalogLineTripsResult) {

    console.log(`ProcessDisruptionComponent.refreshDisruptedIntermodalTour(..) called`);

    this.preHaul = resultDisruptedIntermodalTour.intermodalAlternativeEntryTableRows[0];
    this.postHaul = resultDisruptedIntermodalTour.intermodalAlternativeEntryTableRows.slice(-1)[0];
    // console.log(`ProcessDisruptionComponent.refreshDisruptedIntermodalTour(${JSON.stringify(this.preHaul)}) called`);

    this.sendRoutingRequest(this.preHaul, this.postHaul);
  }

  // uses a pipe to translate service to transform dates into some better looking on the frontend
  private transformDate(date, component: string) {

    return this.datePipe.transform(date, this.translateService.instant(component));
  }

  /**
   * Triggers the process of a disruption
   * Adds a new state "IN_PROCESS" to disruption
   * Sets unallowed states inactive 
   * Opens up a loader to be informed that something happend in the background
   * UI elements are set to be unavailbale for the user -> ensure user guidance
   * For type ILLNESS_REPORT it looks up a driver in the current planning
   * For type LINE_CANCELLED it shows a search Button: <searchIntermodalTripEnabled> this handles the search results better
   * For type VEHICLE_DEFECT it looks up a vehicle in the current planning
   * ToDo: In Bearbeitung -> Translation anpassen diese Funktioniert bislang nicht
   * @param event Button Process clicked
   */
  public onDisruptionProcessButtonClick(event: any): void {

    console.log(`ProcessDisruptionComponent.onDisruptionProcessButtonClick() called`);
    this.disruptionStateProcessButton.value("In Bearbeitung");
    this.cancelEnabled = false;
    this.inProcessEnabled = false;
    this.doneEnabled = false;
    var processInfo: string;
    processInfo = this.processDisruption.reference.desc;
    this.jqxLoader.open();

    this.apiRequestAddState(this.processDisruption.ident, "IN_PROCESS", processInfo);

    if (this.processDisruption.type === "ILLNESS_REPORT") {

      console.log(`ProcessDisruptionComponent.onDisruptionProcessButtonClick() => ILLNESS REPORT called`);
      this.enableUISearchTripByDriver = false;
      this.enableShowTripByDriverDetails = false;
      this.enableUISearchTripByVehicle = false;
      this.enableShowTripByVehicleDetails = false;

      /**
       * hier eine Finder Methode für die Trips
       */
      let searchParamIdent = this.processDisruption.reference.ident;
      const driverInTourFinder = <IntermodalAlternative>{};
      driverInTourFinder.driverId = searchParamIdent;
      driverInTourFinder.startTime = this.processDisruption.startTime;
      this.disruptionService.searchDriverInIntermodalTrips(driverInTourFinder);

    }
    else if (this.processDisruption.type === "VEHICLE_DEFECT" || this.processDisruption.type === "TRUCK_DEFECT") {

      console.log(`ProcessDisruptionComponent.onDisruptionProcessButtonClick() => "VEHICLE/TRUCK_DEFECT" called`);
      this.enableUISearchTripByDriver = false;
      this.enableShowTripByDriverDetails = false;
      this.enableUISearchTripByVehicle = true;
      this.enableShowTripByVehicleDetails = false;

      /**
       * hier eine Finder Methode für die Trips Nalog zu Fahrer
       */
      let searchParamIdent = this.processDisruption.reference.ident;
      const vehicleInTourFinder = <IntermodalAlternative>{};
      vehicleInTourFinder.vehicleId = searchParamIdent;
      vehicleInTourFinder.startTime = this.processDisruption.startTime;
      this.disruptionService.searchVehicleInIntermodalTrips(vehicleInTourFinder);
    }
    else if (this.processDisruption.type === "LINE_CANCELLED" || this.processDisruption.type === "TRAIN_CANCELLED") {

      console.log(`ProcessDisruptionComponent.onDisruptionProcessButtonClick() => "LINE CANCELLED" called`);
      this.enableUISearchTripByDriver = false;
      this.enableShowTripByDriverDetails = false;
      this.enableUISearchTripByVehicle = false;
      this.enableShowTripByVehicleDetails = false;
      this.searchIntermodalTripEnabled = true;
      this.showIntermodalTourSearchButton = true;

      this.jqxLoader.close();
    }
  }

  /**
   * This method will request all disrupted Trips by the selected disruption
   * User clicked search Button #searchIntermodalTrip
   * Enable Disrupted Tour Grid
   * Build a finder based on the current selected disruption attributes: lineId, startTime and state
   * Call the required method in the disruption service and handle over the finder into disruption service
   */
  public onSearchIntermodalTripClicked($event) {

    console.log(`ProcessDisruptionComponent.onSearchIntermodalTripClicked() called`);

    this.showSolutionLineDropdown = false;
    this.showdisruptedIntermodalTour = true;
    var disruptionStartDate = this.processDisruption.startTime;
    var disruptionEndDate = this.processDisruption.endTime;
    let searchParamIdent = this.processDisruption.reference.ident;

    const lineInTourFinder = <IntermodalAlternative>{};
    lineInTourFinder.lineId = searchParamIdent;
    lineInTourFinder.startTime = this.processDisruption.startTime;
    lineInTourFinder.state = "READY_FOR_EXECUTION";
    this.disruptionService.searchLineInIntermodalTrips(lineInTourFinder);

  }

  /**
   * this method is triggered by the cancellation button
   * It enables a combobox for the user to select the reason for cancelling  
   */
  public disruptionStateCancelButtonOnClick($event) {

    console.log(`ProcessDisruptionComponent.disruptionStateCancelButtonOnClick() called`);

    /**
     * ToDo: {{ 'DisruptionMgmtComponent.defaults.DisruptionStatesActive.CANCEL' | translate }} Translation einfügen
     */
    this.disruptionStateCancelButton.value("Abgebrochen");
    this.controlUiAndValue("DISRUPTION_CANCELLED")
  }

  /**
   * This method handles the selected cancel option from the user 
   * The selected option will be included in the stores state of the disruption
   * The state is added by a seperated method
   */
  public cancelOptionsComboBoxOnSelect($event) {

    console.log(`ProcessDisruptionComponent.forwardCancellationButtonClicked() called`);

    /**
     * {{ 'DisruptionMgmtComponent.defaults.DisruptionStatesActive.CANCEL' | translate }} Translation einfügen
     */
    this.disruptionStateCancelButton.value("Abgebrochen");
    this.controlUiAndValue("CANCEL_OPTIONS");
    var cancellationInfo: string;

    cancellationInfo = this.cancelOptionsComboBox.val();
    this.apiRequestAddState(this.processDisruption.ident, "CANCELLED", cancellationInfo);
  }

  /**
   * This method is triggered by user click on the DONE Button and adds the state DONE to the disruption
   * The method enables /disbales specific ui elements
   * The result path will be added to the disruption state
   * After all this is done every value of ui elements will be reseted for progressing next disruption
   * @param event DONE Button clicked
   */
  public disruptionStateDoneButtonOnClick(event: any): void {

    console.log(`ProcessDisruptionComponent.disruptionStateDoneButtonOnClick() called`);

    /**
     * ToDo: {{ 'DisruptionMgmtComponent.defaults.DisruptionStatesActive.DONE' | translate }} einfügen
     */
    this.disruptionStateDoneButton.value("Abgeschlossen");
    var doneInfo: string;
    doneInfo = this.resultPath;
    this.apiRequestAddState(this.processDisruption.ident, "DONE", doneInfo);

    this.controlUiAndValue("DISRUPTION_DONE")
    //this.controlUiAndValue();
  }

  /**
   * HArd reset Button which resets everything in the process component
   */
  public disruptionResetButtonOnClick(event: any): void {

    console.log(`ProcessDisruptionComponent.disruptionResetButtonOnClick() called`);

    this.controlUiAndValue();
  }

  // ToDo: Check sense of this method
  public onDisruptedIntermodalTourSelect(event: any): void {
    console.log(`ProcessDisruptionComponent.onDisruptedIntermodalTourSelect() called`);

  }

  /**
   * driverSolutionComboBoxOnSelect() initializes the solution option 
   * ASSIGN_ALTERNATIVE_DRIVER = all available alternative drivers can be looked up
   * ESCALATION= behavour not implemented but could involve a new role (manager role)
   */
  public driverSolutionComboBoxOnSelect(event: any): void {
    console.log(`ProcessDisruptionComponent.driverSolutionComboBoxOnSelect() called`);

    if (this.disruptionDriverComboBox.val() === "ASSIGN_ALTERNATIVE_DRIVER") {

      const driversFinder = <DriversFinder>{};
      this.disruptionService.searchDrivers("driverSolutionComboBoxOnSelect", driversFinder);

    } else if (this.disruptionDriverComboBox.val() === "ESCALATION") {

      window.alert(`Dear mate! ESCALATION IS NOT IMPLEMENTED`);
    }
  }

  /**
   * vehicleSolutionComboBoxOnSelect() initializes the solution options
   * ASSIGN_ALTERNATIVE_VEHICLE = all available alternative vehicles can be looked up
   * ESCALATION= behavour not implemented but could involve a new role (manager role)
   */
  public vehicleSolutionComboBoxOnSelect(event: any): void {
    console.log(`ProcessDisruptionComponent.vehicleSolutionComboBoxOnSelect() called`);
    if (this.disruptionVehicleComboBox.val() === "ASSIGN_ALTERNATIVE_VEHICLE") {

      const vehicleFinder = <VehicleFinder>{};
      this.disruptionService.searchVehicles("vehicleSolutionComboBoxOnSelect", vehicleFinder);

    } else if (this.disruptionVehicleComboBox.val() === "ESCALATION") {

      window.alert(`Dear mate! ESCALATION IS NOT IMPLEMENTED`);
    }
  }

  /**
   * lineSolutionComboBoxOnSelect() initializes the solution options
   * CALCULATE_ALTERNATIVE_ROUTE = all available alternative intermodal routes are calculated
   * For this instruction the commonIdent will be used to find all affected phases of the intermodal trip
   * ESCALATION= behavour not implemented but could involve a new role (manager role)
   */
  public lineSolutionComboBoxOnSelect(event: any): void {

    console.log(`ProcessDisruptionComponent.lineSolutionComboBoxOnSelect() called`);

    if (this.disruptionLineComboBox.val() === "CALCULATE_ALTERNATIVE_ROUTE") {

      this.jqxLoaderRouting.open();
      this.disruptionService.searchCommonIdentInIntermodalTrips(this.intermodalAlByCommonIdentFinder);

    } else if (this.disruptionLineComboBox.val() === "ESCALATION") {

      window.alert(`Dear mate! ESCALATION IS NOT IMPLEMENTED`);
    }
  }

  /**
   * onAlternativeDriverClicked() is triggered by click on a table row in the alternative driver table
   * It stores the driver details to update the affected trip later on
   * @param resultAlternativeDriver
   */
  public onAlternativeDriverClicked(event: any): void {

    console.log(`ProcessDisruptionComponent.onAlternativeDriverClicked() called`);

    this.showSendButton = true;
    this.enableSendButton = true;
    const args = event.args;
    var row = args.rowindex;
    this.newDriverDetails = this.driversDataSource.localdata[row];
    // console.log(`ProcessDisruptionComponent.onAlternativeDriverClicked(${JSON.stringify(this.newDriverDetails)}) called`);

    /**
     * The chosen alternative driver and the affected trip are gonna be stored in a kpi object and pushed into typed array
     * The parametes are handed over into the called method addKpiToDisruption()
     */
    let keyValueDriverIdent = [];
    let trips: Array<THaRouteKPIs> = [];
    let trip: THaRouteKPIs = {};

    keyValueDriverIdent.push(this.newDriverDetails.ident);
    trip.tourIdent = this.disruptedEntityTrip.ident;
    trip.cost = this.disruptedEntityTrip.commonalities.totalCosts;
    trip.duration = this.disruptedEntityTrip.commonalities.totalDuration;
    trip.emission = this.disruptedEntityTrip.routingSegment.emission.carbonDioxide;

    trips.push(trip);

    var kpiName = "kpi-alternative-driver-assigned";
    this.addKpiToDisruption(kpiName, keyValueDriverIdent, trips);
  }

  /**
   * onAlternativeDriverClicked() is triggered by click on a table row in the alternative driver table
   * It stores the driver details to update the affected trip later on
   */
  public onAlternativeVehicleClicked(event: any): void {
    console.log(`ProcessDisruptionComponent.onAlternativeVehicleClicked() called`);
    this.enableSendButton = true;
    const args = event.args;
    var row = args.rowindex;
    this.newVehicleDetails = this.vehiclesDataSource.localdata[row];
    console.log(`ProcessDisruptionComponent.onAlternativeVehicleClicked(${JSON.stringify(this.newVehicleDetails)}) called`);

    /**
      * The chosen alternative driver and the affected trip are gonna be stored in a kpi object and pushed into typed array
      * The parametes are handed over into the called method addKpiToDisruption()
      */
    let keyValueVehicleIdent = [];
    let trips: Array<THaRouteKPIs> = [];
    let trip: THaRouteKPIs = {};

    keyValueVehicleIdent.push(this.newVehicleDetails.licensePlate);
    trip.tourIdent = this.disruptedEntityTrip.ident;
    trip.cost = this.disruptedEntityTrip.commonalities.totalCosts;
    trip.duration = this.disruptedEntityTrip.commonalities.totalDuration;
    trip.emission = this.disruptedEntityTrip.routingSegment.emission.carbonDioxide;
    trips.push(trip);

    // console.log(`ProcessDisruptionComponent.onAlternativeVehicleClicked(..) => KPI Values Objects ${JSON.stringify(keyValueVehicleIdent)}`);

    var kpiName = "kpi-alternative-vehicle-assigned";
    this.addKpiToDisruption(kpiName, keyValueVehicleIdent, trips);
  }

  /**
   * Update disrupted trip for with either a new driver or vehicle by disruption service
   * In use case Line cancelled no update will be send instead the trip will be cancelled
   * and a new alternative trip will be created (All phases)
   * Enable and disbable different ui elements
   * ToDo: Erweiterung der KPI an driver and vehicle use case
   */
  public updateDisruptedTrip(event: any): void {
    console.log(`ProcessDisruptionComponent.updateDisruptedTrip() called`);
    this.enableDisruptedIntermodalTourTable = true;
    this.enableSendButton = false;
    this.showSendButton = false;

    if (this.processDisruption.type === "ILLNESS_REPORT") {

      this.disruptedEntityTrip.driverId = this.newDriverDetails.ident;
      this.disruptionService.putIntermodalAlternative(this.disruptedEntityTrip);

      this.controlUiAndValue("UPDATE_DISRUPTED_TRIP_DRIVER")

      this.newDriverFirstName = this.newDriverDetails.firstname;
      this.newDriverLastName = this.newDriverDetails.lastname;
      this.disruptedEntityTripState = this.disruptedEntityTrip.state;
      this.disruptedEntityTripStart = this.transformDate(this.disruptedEntityTrip.startTime, "DisruptionProcessComponent.DateFormat");
      this.disruptedEntityTripEnd = this.transformDate(this.disruptedEntityTrip.endTime, "DisruptionProcessComponent.DateFormat");

      var kpiBase: THaKpiBase = {};
      kpiBase.name = "kpi-intermodal-trips-updated";
      this.disruptionService.addKpiKeyToDisruption(this.processDisruption.ident, kpiBase);

    } else if (this.processDisruption.type === "VEHICLE_DEFECT" || this.processDisruption.type === "TRUCK_DEFECT") {

      this.disruptedEntityTrip.vehicleId = this.newVehicleDetails.licensePlate;
      this.disruptionService.putIntermodalAlternative(this.disruptedEntityTrip);

      this.controlUiAndValue("UPDATE_DISRUPTED_TRIP_VEHICLE")

      this.disruptedEntityTripDepot = this.newVehicleDetails.depot;
      this.disruptedEntityTripState = this.disruptedEntityTrip.state;
      this.disruptedEntityTripStart = this.transformDate(this.disruptedEntityTrip.startTime, "DisruptionProcessComponent.DateFormat");
      this.disruptedEntityTripEnd = this.transformDate(this.disruptedEntityTrip.endTime, "DisruptionProcessComponent.DateFormat");

      var kpiBase: THaKpiBase = {};
      kpiBase.name = "kpi-intermodal-trips-updated";
      this.disruptionService.addKpiKeyToDisruption(this.processDisruption.ident, kpiBase);

    } else if (this.processDisruption.type === "LINE_CANCELLED" || this.processDisruption.type === "TRAIN_CANCELLED") {

      this.refreshDisruptedTourTable();

      // Filter the correct date 
      var emptyArray = [];
      var dateArray = [];
      this.tripsOfDisruptedLine.forEach(element => {
        emptyArray.push(element.selected);
        dateArray.push(element.startTime < this.transformDate(this.processDisruption.endTime, "DisruptionGridComponent.DateFormat"));
      });

      // Check if all the checkboxes in the data table are checked
      if (emptyArray.includes(false)) {

        /**
         * Table of disrupted IM Trips will be (again) available 
         */
        this.enableIntermodalAlternativeTourTable = true;

        /**
         * Getting drivers and vehicles for post and pre haul to hand them over for the new intermodal trip
         */
        var driverPre = this.preHaul.driverId;
        var driverPost = this.postHaul.driverId;
        var vehiclePre = this.preHaul.vehicleId;
        var vehiclePost = this.postHaul.vehicleId;

        /**
         * In Addition Sending KPI key to created intermodal Alternatives
         */
        var kpiBase: THaKpiBase = {};
        kpiBase.name = "kpi-intermodal-trips-created";

        this.disruptionService.transformRoutingAlternativeToIntermodalTour(this.selectedIntermodalAlternativeRoute, driverPre, driverPost,
          vehiclePre, vehiclePost, this.processDisruption.ident, kpiBase);

        /**
         * Updates disrupted intermodal Tour to state CANCELLED => transformRoutingAlternativeToIntermodalTour() will provide a new one
         */
        var state = "CANCELLED";
        this.disruptionService.cancelDisruptedIntermodalTrips(state);
        this.controlUiAndValue("LINE_CANCELLED");

        /**
         * The selected intermodal alternative will be stored as an kpi in the disruption
         */
        let keyValueLineIdent = [];
        let trips: Array<THaRouteKPIs> = [];
        let trip: THaRouteKPIs = {};

        keyValueLineIdent.push(this.selectedIntermodalAlternativeRoute.route);

        trip.tourIdent = this.selectedIntermodalAlternativeRoute.route;
        trip.cost = this.selectedIntermodalAlternativeRoute.totalCost;
        trip.duration = this.selectedIntermodalAlternativeRoute.totalDuration;
        trip.emission = this.selectedIntermodalAlternativeRoute.co2;

        trips.push(trip);

        var kpiName = "kpi-alternative-route-assigned";
        this.addKpiToDisruption(kpiName, keyValueLineIdent, trips);

      } else {

        /**
         * Make disruption resolvable by enabling DONE Button
         */
        this.doneEnabled = true;
        this.showSolutionLineDropdown = false;
      }

    } else {

      console.error(`ProcessDisruptionComponent.updateDisruptedTrip() No Solution Selectes`);
    }
  }

  /**
   * THis method is triggered by an observable and loads all affected intermodal trips into the jqx data table
   */
  private refreshDisruptedTourTable() {

    console.log(`ProcessDisruptionComponent.refreshDisruptedTourTable() called `);

    this.disruptedTourRowIndex;
    this.tripsOfDisruptedLine[this.disruptedTourRowIndex].selected = true;

    this.disruptedIntermodalTourSource.localdata = this.tripsOfDisruptedLine;
    this.disruptedIntermodalTourDataAdapter = new jqx.dataAdapter(this.disruptedIntermodalTourSource);
  }

  /**
   * onDisruptedIntermodalTourDoubleClicked() is triggered by the a double click on a table row of disrupted trips
   * IN addition this method extracts the common ident which is latet used to look up all conencted intermodal phases
   */
  public onDisruptedIntermodalTourDoubleClicked(event) {

    console.log(`ProcessDisruptionComponent.onDisruptedIntermodalTourDoubleClicked() called `);
    
    // need to stay here otherwhise problem with enable and disable ui elements
    this.showSolutionLineDropdown = true;
    this.notifyTripSelected.open();
    // ToDO: Check why is here a close?
    this.jqxLoaderRouting.close();
    this.controlUiAndValue("DISRUPTED_INTERMODAL_TRIP_SELECTED")

    this.intermodalAlByCommonIdentFinder = <IntermodalAlternative>{};
    const intermodalAlCommon = <THaAlternativesCommon>{};
    const args = event.args;
    this.disruptedTourRowIndex = args.rowindex;

    this.disruptedIntermodalTour = this.disruptedIntermodalTourSource.localdata[this.disruptedTourRowIndex];
    var strSplit = this.disruptedIntermodalTour.ident.split("-");
    intermodalAlCommon.ident = strSplit[0];
    this.intermodalAlByCommonIdentFinder.commonalities = intermodalAlCommon;

    /**
     * The chosen disrupted IM trip and its KPIs are gonna be stored in a kpi object and pushed into typed array
     * The parametes are handed over into the called method addKpiToDisruption()
     */
    let keyValueLineIdent = [];
    keyValueLineIdent.push(this.disruptedIntermodalTour.ident);
    let tripKPIs: Array<THaRouteKPIs> = [];
    let tripKPI: THaRouteKPIs = {};

    tripKPI.tourIdent = this.disruptedIntermodalTour.ident;
    tripKPI.cost = this.disruptedIntermodalTour.costs;
    tripKPI.duration = this.disruptedIntermodalTour.duration;
    tripKPI.emission = this.disruptedIntermodalTour.co2;

    tripKPIs.push(tripKPI);
    // console.log(`ProcessDisruptionComponent.onDisruptedIntermodalTourDoubleClicked(..) => KPI Values Objects ${JSON.stringify(keyValueLineIdent)} and ${JSON.stringify(trips)}`);

    var kpiName = "kpi-disrupted-train-line-trip-selected";
    this.addKpiToDisruption(kpiName, keyValueLineIdent, tripKPIs);
  }

  /**
   * this method is triggered by the seöection of an intermodal alternative 
   * Then it enables/ disables some ui elements
   * Then the method it reads out the row data and declares it in a typed array IntermodalRoutingResponseRowModel
   * Further more it triggers a comparison chart on the analytics component 
   */
  public onIntermodalAlternativeCellDoubleClicked(event) {

    console.log(`ProcessDisruptionComponent.onIntermodalAlternativeCellDoubleClicked() clicked `);

    this.controlUiAndValue("INTERMODAL_ALTERNATIVE_SELECTED");

    this.selectedIntermodalAlternativeRoute = <IntermodalRoutingResponseRowModel>{};
    const args = event.args;
    var row = args.rowindex;
    this.selectedIntermodalAlternativeRoute = this.intermodalAlternativeSource.localdata[row];

    /**
     * Trigger Some Comparing chart
     * Hands over KPI parameters of selected disrupted tripo and alternative to a method in disruption Service 
     * and make the analytics component listen to it => Subscription
     */
    this.disruptionService.showIntermodalAlternativeResultChart(this.selectedIntermodalAlternativeRoute, this.disruptedIntermodalTour);

  }

  /**
   * This method is called by other methods and adds a state to the disruption
   * Then it stores the state values in an empty object which will be handed over into the method that calls the disruption service
   * @param ident the ident of the disruption 
   * @param newState the actual state
   * @param desc some information (not considered)
   */
  private apiRequestAddState(ident: string, newState: string, desc: string) {

    console.log(`ProcessDisruptionComponent.apiRequestAddState() called`);

    var thaDisruptionState = <THaDisruptionState>{};
    thaDisruptionState.state = newState;
    thaDisruptionState.description = desc;

    // Zwei Linien waren vertauscht
    this.processDisruption.currentState = thaDisruptionState;
    this.disruptionService.putDisruption(ident, thaDisruptionState);
  }

  /**
   * This method is called by other methods in the component and calls the disruption service to store a kpi into the disruption
   * It receives at least a kpi name and one or more idents from the calling method
   * In special cases which means a kpi is set in the context of some trips. The method receives RouteKPIs too
   */
  private addKpiToDisruption(kpiName: string, keyValueIdents: any[], trips?: Array<THaRouteKPIs>) {

    console.log(`ProcessDisruptionComponent.addKpiToDisruption() called`);

    var createKpiBase = <THaKpiBase>{};

    if (typeof trips !== 'undefined' || trips === this.processDisruption) {

      console.log(`ProcessDisruptionComponent.addKpiToDisruption(..) => with trips array`);

      var targetDisruption = this.processDisruption.ident;
      createKpiBase.name = kpiName;
      createKpiBase.idents = keyValueIdents;
      createKpiBase.routeKPIs = trips;

      this.disruptionService.addKpiKeyToDisruption(targetDisruption, createKpiBase);

    } else {

      console.log(`ProcessDisruptionComponent.addKpiToDisruption(..) => without trips array`);
      /**
        * Transform Array of Objects into Array of Strings
        * which means the object key ident will be cut out and just the values will stay
        */
      var valueIdents: Array<string>;
      valueIdents = keyValueIdents.map(function (keyValueIdent) {
        return keyValueIdent['ident'];
      });
      /**
       * Declare rest of the KPI Object
       */
      var targetDisruption = this.processDisruption.ident;
      createKpiBase.name = kpiName;
      createKpiBase.idents = valueIdents;

      this.disruptionService.addKpiKeyToDisruption(targetDisruption, createKpiBase);
    }
  }

  /**
   * controlUiAndValue() is triggered by several other methods in this component
   * it controls the behaviour of the ui
   * A target is used by some of the methods to request specific behaviour 
   * if no target is provided a almost full reset of the component will be executed
   * ToDo: Integrate this step by disruption catalog
   */
  private controlUiAndValue(target?: string): void {
    console.log(`ProcessDisruptionComponent.controlUiAndValue() called`);

    // debugger;
    if (target != null) {

      if (target === "LINE_HAS_TRIP_ASSIGNMENT") {

        this.entityInTripsFound = false;
        this.noEntityTripsFound = false;
        this.cancelEnabled = true;

      } else if (target === "LINE_CANCELLED") {

        this.disruptionLineComboBox.clearSelection();
        this.intermodalAlternativeDataTableRef.clear();
        this.intermodalAlternativeDataTableRef.clearselection();
        this.disruptedIntermodalTourDataTableRef.clear();
        this.disruptedIntermodalTourDataTableRef.clearselection();
        this.showSolutionLineDropdown = false;
        this.doneEnabled = false;
        this.enableSendButton = false;

      } else if (target === "DRIVER_HAS_TRIP_ASSIGNMENT") {

        this.entityInTripsFound = true;
        this.noEntityTripsFound = false;
        this.cancelEnabled = true;
        this.showSolutionDriverDropdown = true;

      } else if (target === "LINE_HAS_NO_TRIP_ASSIGNMENT") {
        this.entityInTripsFound = false;
        this.noEntityTripsFound = true;
        this.showNotripsFound = true;
        this.cancelEnabled = true;
        this.showSolutionLineDropdown = false;
        this.showdisruptedIntermodalTour = false;
        this.showIntermodalTourSearchButton = false;

      } else if (target === "INFORM_CUSTOMER") {
        this.noEntityTripsFound = false;
        this.doneEnabled = true;
        this.showInformCustomer = true;
        this.showSolutionLineDropdown = false;
        this.showdisruptedIntermodalTour = false;
        this.showIntermodalTourSearchButton = false;

      } else if (target === "DISRUPTION_CANCELLED") {

        this.inProcessEnabled = false;
        this.cancelEnabled = false;
        this.cancelInformationInputEnabled = false;
        this.showNotripsFound = false;
        this.doneEnabled = false;
        this.showCancelOptions = true;
        this.cancelInformationBtnEnabled = true;
        this.showSolutionDriverDropdown = false;
        this.showSolutionVehicleDropdown = false;
        this.showSolutionLineDropdown = false;
        this.showdisruptedIntermodalTour = false;
        this.showIntermodalTourSearchButton = false;

      } else if (target === "CANCEL_OPTIONS") {
        this.inProcessEnabled = false;
        this.cancelEnabled = false;
        this.cancelInformationInputEnabled = false;
        this.showCancelOptions = false;
        this.doneEnabled = true;
        this.cancelInformationBtnEnabled = false;

      } else if (target === "DISRUPTION_DONE") {
        this.cancelEnabled = false;
        this.doneEnabled = false;
        this.inProcessEnabled = false;

        /**
         * Reset table values
         */
        this.driversDataTableRef.clear();
        this.driversDataTableRef.clearselection();
        this.vehiclesDataTableRef.clear();
        this.vehiclesDataTableRef.clearselection();
        this.intermodalAlternativeDataTableRef.clear();
        this.intermodalAlternativeDataTableRef.clearselection();
        this.disruptedIntermodalTourDataTableRef.clear();
        this.disruptedIntermodalTourDataTableRef.clearselection();

      } else if (target === "INTERMODAL_ALTERNATIVE_SELECTED") {

        this.showSendButton = true;
        this.enableSendButton = true;
        this.enableIntermodalAlternativeTourTable = true;
      } else if (target === "DRIVER_HAS_NO_TRIP_ASSIGNMENT") {

        this.entityInTripsFound = false;
        this.showNotripsFound = true;
        this.noEntityTripsFound = true;
        this.cancelEnabled = true;

      } else if (target === "VEHICLE_HAS_NO_TRIP_ASSIGNMENT") {
        this.entityInTripsFound = false;
        this.noEntityTripsFound = true;
        this.showNotripsFound = true;
        this.cancelEnabled = true;

      } else if (target === "UPDATE_DISRUPTED_TRIP_DRIVER") {
        this.doneEnabled = true;
        this.cancelEnabled = false;
        this.inProcessEnabled = false;
        this.newDriverAlternativeTrip = true;
        this.showSolutionTripDriver = true;
        this.showSolutionDriverDropdown = false;
        this.entityInTripsFound = false;
        this.showSendButton = false;
        this.enableSendButton = false;

        console.log("DisruptionProcessComponent.controlUiAndValue() called => UPDATE_DISRUPTED_TRIP_DRIVER")

      } else if (target === "UPDATE_DISRUPTED_TRIP_VEHICLE") {
        this.doneEnabled = true;
        this.cancelEnabled = false;
        this.inProcessEnabled = false;
        this.newVehicleAlternativeTrip = true;
        this.showSolutionTripVehicle = true;
        this.showSolutionVehicleDropdown = false;
        this.entityInTripsFound = false;
        this.showSendButton = false;
        this.enableSendButton = false;

      } else if (target === "DISRUPTED_INTERMODAL_TRIP_SELECTED") {
        this.showIntermodalTourSearchButton = false;
        this.showSolutionLineDropdown = true;
        this.enableDisruptedIntermodalTourTable = false;
        this.enableIntermodalAlternativeTourTable = true;

      }

    } else {

      this.processDisruptionEnabled = false;
      // this.processDisruptionEnabled = true;
      this.entityInTripsFound = false;
      this.enableSendButton = false;
      this.cancelEnabled = true;
      this.doneEnabled = false;
      this.inProcessEnabled = true;
      this.searchIntermodalTripEnabled = false;
      this.enableDisruptedIntermodalTourTable = false;
      this.referenceBlockLineEnabled = false;
      this.showNotripsFound = false;
      this.showSendButton = false;

      if (this.processDisruption.type === "ILLNESS_REPORT") {
        this.newDriverAlternativeTrip = false;
        this.showSolutionDriverDropdown = false;
        this.showNotripsFound = false;
        this.disruptionDriverComboBox.clearSelection();
        this.driversDataTableRef.clear();
        this.disruptedEntityTrip[0].clear();

      } else if (this.processDisruption.type === "VEHICLE_DEFECT" || this.processDisruption.type === "TRUCK_DEFECT") {
        this.newVehicleAlternativeTrip = false;
        this.showSolutionVehicleDropdown = false;
        this.showNotripsFound = false;
        this.disruptionVehicleComboBox.clearSelection();
        this.vehiclesDataTableRef.clear();
        this.disruptedEntityTrip[0].clear();

      } else if (this.processDisruption.type === "LINE_CANCELLED" || this.processDisruption.type === "TRAIN_LINE_CANCELLED") {
        this.disruptedIntermodalTourDataAdapter.clear();
        this.disruptedIntermodalTourDataTableRef.clear();
        this.disruptionLineComboBox.clearSelection();
        this.enableDisruptedIntermodalTourTable = false;
        this.showSolutionLineDropdown = false;
        this.showNotripsFound = false;
        this.showIntermodalTourSearchButton = false;
        this.showdisruptedIntermodalTour = false;
        this.showSendButton = false;
        this.processDisruptionEnabled = false;
        this.referenceBlockLineEnabled = false;

      } else {

        var errorMsg = "Fehler";
        console.error(`ProcessDisruptionComponent.resetUiValue() ${errorMsg} `);
      }
    }
  }

  /**
   * Setting Routing options for a request to intermodal routing
   * Note: Excluded Terminal cannot be considered
   * the start time of the pre haul is equal as the request
   */
  private setRoutingOptions(preHaul: IntermodalAlternativeEntryTableRow) {

    console.log(`ProcessDisruptionComponent.setRoutingOptions() called`);
    // debugger;
    var startTime = preHaul.startOfExecution;
    this.routingOptions.startTime = startTime; // new Date();//"2013-08-19T11:00:00+02:00";
    this.routingOptions.maxCosts = 30000;
    this.routingOptions.accompanied = false;
    this.routingOptions.timeCostWeight = 75;
    this.routingOptions.numberOfAlternatives = 5;
    this.routingOptions.withWayList = false;
    this.routingOptions.maxDuration = 0;
    this.routingOptions.maxTransfers = 0;
    this.routingOptions.maxTerminalDistance = 0;
    this.routingOptions.planningHorizon = 0;

  }

  /**
   * Sample request for testing purposes
   */
  private createSampleRequest(): RoutingRequest {
    console.log(`ProcessDisruptionComponent.createSampleRequest() called`);

    var locations: Location[] = [];
    {
      let point = {} as PlainPoint;
      point.x = 9.225543;
      point.y = 45.500566;
      point.z = 0;

      let startLocation = {} as Location;

      startLocation.code = "";
      startLocation.name = "Milano Z.I.";
      startLocation.point = point;
      startLocation.country = "IT";
      startLocation.postalCode = "";
      startLocation.city = "Milano";
      startLocation.street = "";
      startLocation.houseNumber = "";

      locations.push(startLocation);
    }

    {
      let point = {} as PlainPoint;
      point.x = 8.467727;
      point.y = 49.019058;
      point.z = 0;

      let endLocation = {} as Location;

      endLocation.code = "";
      endLocation.name = "Karlsruhe Industriegebiet";
      endLocation.point = point;
      endLocation.country = "DE";
      endLocation.postalCode = "";
      endLocation.city = "Karlsruhe";
      endLocation.street = "";
      endLocation.houseNumber = "";

      locations.push(endLocation);
    }

    let routingRequest = {} as RoutingRequest;
    routingRequest.routingOptions = this.routingOptions;
    routingRequest.wrappedStopOffs = locations;

    return routingRequest;
  }

  /**
   * The routing request mainly consist of the routing options and a routing segment (start and end)
   * The start and end have been earliier extracted and are now used to define the routing start and endpoints
   */
  private createRoutingRequest(preHaul: IntermodalAlternativeEntryTableRow, postHaul: IntermodalAlternativeEntryTableRow): RoutingRequest {

    console.log(`ProcessDisruptionComponent.createRoutingRequest() called`);

    var locations: Location[] = [];
    {
      let point = {} as PlainPoint;
      point.x = preHaul.fromStation.point.x;
      point.y = preHaul.fromStation.point.y;
      point.z = 0;

      let startLocation = {} as Location;

      startLocation.code = "";
      startLocation.name = preHaul.fromStation.name;
      startLocation.point = point;
      startLocation.country = preHaul.fromStation.country;
      startLocation.postalCode = "";
      startLocation.city = preHaul.fromStation.city;
      startLocation.street = "";
      startLocation.houseNumber = "";

      locations.push(startLocation);
    }

    {
      let point = {} as PlainPoint;
      point.x = postHaul.toStation.point.x;
      point.y = postHaul.toStation.point.y;
      point.z = 0;

      let endLocation = {} as Location;

      endLocation.code = "";
      endLocation.name = postHaul.toStation.name;
      endLocation.point = point;
      endLocation.country = postHaul.toStation.country;
      endLocation.postalCode = "";
      endLocation.city = postHaul.toStation.city;
      endLocation.street = "";
      endLocation.houseNumber = "";

      locations.push(endLocation);
    }
    let routingRequest = {} as RoutingRequest;
    routingRequest.routingOptions = this.routingOptions;
    routingRequest.wrappedStopOffs = locations;

    return routingRequest;
  }

  /**
   * sendRoutingRequest() fires the request to disruption service where it will forward it to the WebAPI
   * Routing OPtions and Routing Request are called from inside sendRoutingRequest() 
   */
  private sendRoutingRequest(preHaul: IntermodalAlternativeEntryTableRow, postHaul: IntermodalAlternativeEntryTableRow) {

    console.log(`ProcessDisruptionComponent.sendRoutingRequest(..) called`);
    // this.fillRoutingOptions();
    this.setRoutingOptions(preHaul);
    // var routingRequest = this.createSampleRequest();
    var routingRequest = this.createRoutingRequest(preHaul, postHaul);
    if (routingRequest) {

      this.disruptionService.calculateIntermodalRoute(routingRequest);
    }

  }
}

