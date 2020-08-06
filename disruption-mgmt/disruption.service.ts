/**
 * Comment Header:
 * DisruptionMgmtService is a service which allows to share information among classes (components within the disruption mgmt. system)
 * DisruptionMgmtService as well controls the communication with the Web API to provide drivers, vehicles and trips data
 * The component starts by requiring several imports
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { Subject, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

import { SidebarService } from '../../../center/sidebar.service';

import { RolesAndRightsService } from '../../services/roles-and-rights.service';

import {
  Configuration, ConfigurationParameters, VehicleService,
  DisruptionService, DriverService, IntermodalService
} from '../../../the-haulier-api';

import {
  THDriver, THDriversResp, THaDisruptionResp, THaDisruptionCatalog,
  DisruptionsFinder, THaDisruption, DriversFinder, THaDriversResp, THaVehicle, THaVehiclesResp,
  THaDriver, IntermodalAlternative, IntermodalAlternativeResp, THaDisruptionState, THaKpiBase,
  RoutingRequest, CalculateRouteResp, PlainLineString, THaAlternativesCommon, THaRouteKPIs
} from '../../../the-haulier-api/model/models';

import { DisruptionEntryTableRow } from './models/disruption-entry-model';
import { DisruptionCatalog } from './models/disruption-catalog';
import { CatalogDriverResult } from './models/catalog-driver-result';
import { DriverEntryTableRow } from './models/driver-entry-model';
import { CatalogVehicleResult } from './models/catalog-vehicle-result';
import { VehicleEntryTableRow } from './models/vehicle-entry-model';
import { VehicleFinder } from './models/vehicleFinder';
import { CatalogDriverTripsResult } from './models/catalog-driver-trips-result';
import { CatalogVehicleTripsResult } from './models/catalog-vehicle-trips-result';
import { CatalogLineTripsResult } from './models/catalog-line-trips-result';
import { IntermodalAlternativeEntryTableRow } from './models/intermodal-alternative-entry-table-row';
import { IntermodalRoutingResponseRowModel, RoutingSegmentRowModel, RoutingSegmentDetailRowModel } from './models/intermodal-routing-response-row-model';
import { DisruptionFinderSettings } from './models/disruption-finder-settings';
import { DisruptionTypesShare } from './models/disruption-types-share';
import { DisruptionStatesShare } from './models/disruption-states-share';
import { DisruptionStatesEntry } from './models/disruption-states-entry';
import { IntermodalTripEntry } from './models/intermodal-trip-entry';
import { IntermodalTripKPI } from './models/intermodal-trip-kpi';

@Injectable()
export class DisruptionMgmtService {

  /**
   * This pattern is used to inform components that an API request returns a result.
   */
  private driversFinderSubject: Subject<CatalogDriverResult> = new Subject();
  public driversFinderObservable: Observable<CatalogDriverResult> = this.driversFinderSubject.asObservable();

  /**
   * This pattern is used to inform components that an API request returns a result.
   */
  private vehiclesFinderSubject: Subject<CatalogVehicleResult> = new Subject();
  public vehiclesFinderObservable: Observable<CatalogVehicleResult> = this.vehiclesFinderSubject.asObservable();

  /**
   * Disruption catalog will be initialized
   */
  private disruptionCatalog: THaDisruptionCatalog = null;
  private disruptionCatalogLoadedSubject: Subject<boolean> = new Subject();
  public disruptionCatalogLoadedObservable: Observable<boolean> = this.disruptionCatalogLoadedSubject.asObservable();

  /**
   * Disruption Observable and Subject for process role
   */
  public enableProcessDisruptionSubject: Subject<THaDisruption> = new Subject();
  public enableProcessDisruptionObservable: Observable<THaDisruption> = this.enableProcessDisruptionSubject.asObservable();
  /// public enableDisruptionHistoryObservable: Observable<THaDisruption> = this.enableProcessDisruptionSubject.asObservable();

  /**
   * Intermodal Driver Finder Subject
   */
  private intermodalAlternativeFinderByDriverSubject: Subject<CatalogDriverTripsResult> = new Subject();
  public intermodaleAlternativeFinderByDriverObservable: Observable<CatalogDriverTripsResult> = this.intermodalAlternativeFinderByDriverSubject.asObservable();

  /**
   * Intermodal Vehicle Finder Subject
   */
  private intermodalAlternativeFinderByVehicleSubject: Subject<CatalogVehicleTripsResult> = new Subject();
  public intermodaleAlternativeFinderByVehicleObservable: Observable<CatalogVehicleTripsResult> = this.intermodalAlternativeFinderByVehicleSubject.asObservable();

  /**
   * Intermodal ALternative Response
   */
  // private intermodalAlternativeResponseSubject: Subject<IntermodalAlternativeResp> = new Subject();
  // public intermodaleAlternativeResponseObservable: Observable<IntermodalAlternativeResp> = this.intermodalAlternativeResponseSubject.asObservable();
  /**
   * Intermodal Tours Response
   */
  private intermodalAlternativeFinderByNetLineSubject: Subject<CatalogLineTripsResult> = new Subject();
  public intermodalAlternativeFinderByNetLineObservable: Observable<CatalogLineTripsResult> = this.intermodalAlternativeFinderByNetLineSubject.asObservable();

  /**
   * Intermodal Alternatives Response
   */
  private updateRoutingResponseTableSubject: Subject<IntermodalRoutingResponseRowModel[]> = new Subject();
  public updateRoutingResponseTableObservable: Observable<IntermodalRoutingResponseRowModel[]> = this.updateRoutingResponseTableSubject.asObservable();

  /**
   * Finder for Pre-/Post-/ Main- Haul
   */
  private intermodalTourFinderByCommonIdentSubject: Subject<CatalogLineTripsResult> = new Subject();
  public intermodalTourFinderByCommonIdentObservable: Observable<CatalogLineTripsResult> = this.intermodalTourFinderByCommonIdentSubject.asObservable();

  /**
 * Finder for Pre-/Post-/ Main- Haul for KPI Analysis
 */
  private intermodalTourFinderByCommonIdentForKPISubject: Subject<IntermodalTripEntry[]> = new Subject();
  public intermodalTourFinderByCommonIdentForKPIObject: Observable<IntermodalTripEntry[]> = this.intermodalTourFinderByCommonIdentForKPISubject.asObservable();

  /**
   * This method calls a graphical Chart in analytics component
   */
  private updateIntermodalAlternativeResultChartSubject: Subject<Array<IntermodalTripKPI>> = new Subject();
  public updateIntermodalAlternativeResultChartObject: Observable<Array<IntermodalTripKPI>> = this.updateIntermodalAlternativeResultChartSubject.asObservable();

  /**
 * This method calls a graphical Chart in analytics component
 */
  private updatePieChartTypeSubject: Subject<Array<DisruptionTypesShare>> = new Subject();
  public updatePieChartTypeObject: Observable<Array<DisruptionTypesShare>> = this.updatePieChartTypeSubject.asObservable();

  /**
   * This method calls a graphical Chart in analytics component
   */
  private updatePieChartStateSubject: Subject<Array<DisruptionTypesShare>> = new Subject();
  public updatePieChartStateObject: Observable<Array<DisruptionTypesShare>> = this.updatePieChartStateSubject.asObservable();

  /**
   * This method calls a graphical Chart in analytics component
   */
  private disruptionHistorySubject: Subject<DisruptionStatesEntry[]> = new Subject();
  public disruptionHistoryObject: Observable<DisruptionStatesEntry[]> = this.disruptionHistorySubject.asObservable();

  /**
  * Finder for Process Stepper Disruption
  */
  private disruptionStatesSubject: Subject<any> = new Subject();
  public disruptionStatesObservable: Observable<any> = this.disruptionStatesSubject.asObservable();

  /**
   * Values for Delta Calculation
   */
  public disruptedIntermodalTripTotalDuration: number;
  public disruptedIntermodalTripTotalCost: number;
  public disruptedIntermodalTripTotalEmission: number;
  public disruptedIntermodalTripStart: Date;

  public alternativeIntermodalTripTotalDuration: number;
  public alternativeIntermodalTripTotalCost: number;
  public alternativeIntermodalTripTotalEmission: number;
  public alternativeIntermodalTripStart: Date;

  /**
   * Declare several global variables
   */
  private configuration: Configuration = null;
  private subscribedComponents: string[] = [];

  public drivers: THDriver[] = [];
  public driver: THaDriver;
  public singleDriverEntry: THDriversResp;

  public vehicles: THaVehicle[] = [];
  public singleVehicleEntry: THaVehiclesResp;

  public resultTrip: IntermodalAlternative[] = [];
  public disruptionStates: string[] = [];

  private disruptionEntryTableRows: DisruptionEntryTableRow[] = [];
  private currentSelectedDisruption2Process: THaDisruption = null;

  private thaDisruptions: THaDisruption[] = [];

  public disruptionCatalogs: THaDisruptionCatalog;
  public disruptionCatalogDisruptionTypes: DisruptionCatalog[] = [];
  public disruptionCatalogTypes: [] = [];

  private updateDisruptionEntrySubject = new Subject<boolean>();
  public updateDisruptionEntryObservable: Observable<boolean> = this.updateDisruptionEntrySubject.asObservable();

  private routingResponseTableRows: IntermodalRoutingResponseRowModel[] = null;
  private calculateRouteResp: CalculateRouteResp = null;

  private randomIdent: string;
  private randomCommonIdent: string;

  private disruptionFinderSettings: DisruptionFinderSettings;
  affectedIntermodalTripsByCommonIdent: Array<IntermodalAlternative>;
  disruptedIntermodalTrips: Array<IntermodalAlternative> = [];
  private disruptedIntermodalTripEntryRows = [];

  /**
   * The DisruptionsMgmtService Constructor passes HttpClient and RolesAndRights as parameters into the variables provided for this purpose.
   * An object is created from the ConfigurationParameters interface with initially empty parameters such as authorization data (login, token, path).
   * The basePath parameter is assigned the domain of the API (Haulier).
   * The parameter apiKeys is assigned the authorization mechanism Bearer.
   * Because this is a tenant based WebApp the corresponding token is taken from the Roles and Rights Service
   * The parameters from configurationParameters are passed to the private property configuration of the disruptionMgmtService
   * Then the initialization method initializeData is called
   * @param httpClient
   * @param rolesAndRightsService
   * @param datePipe
   * @param translateService
   * @param sidebarService
   */
  constructor(private httpClient: HttpClient, private rolesAndRightsService: RolesAndRightsService,
    private datePipe: DatePipe, private translateService: TranslateService, private sidebarService: SidebarService) {

    console.log('DisruptionMgmtService.constructor(..) called');

    const configurationParameters = <ConfigurationParameters>{};
    configurationParameters.basePath = environment.theHaulier_url;

    configurationParameters.apiKeys = { "Authorization": "Bearer " + this.rolesAndRightsService.getJWTToken() };
    this.configuration = new Configuration(configurationParameters);

    this.initialitzeData();
  }

  /**
   * Handling the sidebar service which is used for the resfresh button and add button
   */
  public containsSubscription(component: string): boolean {

    console.log(`SidebarService.containsSubscription(..) called`);
    if (this.subscribedComponents.includes(component)) {

      return true;
    }

    this.subscribedComponents.push(component);
    return false;
  }

  public removeSubscription(component: string): boolean {

    return false;
  }

  /**
   * Intitialize a WebAPI call to get disruption catalog and inform the observable
   */
  public initialitzeData() {

    console.log(`DisruptionMgmtService.initialitzeData(..) called`);
    this.disruptionFinderSettings = new DisruptionFinderSettings();

    const apiDisruptionService = new DisruptionService(this.httpClient, environment.theHaulier_url, this.configuration);
    apiDisruptionService.getDisriptionCatalog().subscribe((thaDisruptionResp: THaDisruptionResp) => {

      if (thaDisruptionResp.error === false) {

        this.disruptionCatalog = thaDisruptionResp.disruptionCatalog;
        this.disruptionCatalogLoadedSubject.next(true);
      } else {

        console.error(`DisruptionMgmtService.initialitzeDisruptionCatalogData() => getAllCatalogItems(..) failed. Error = ${thaDisruptionResp.errorMsg}`);
      }
    });

    this.getAllDisruptions();
    this.getAllStates();
  }

  /**
   * getAllStates() request the defined states from the WebAPI
   */
  public getAllStates() {

    console.log(`DisruptionMgmtService.getAllStates() => API.getAllStates(..) called.`);
    const apiDisruptionService = new DisruptionService(this.httpClient, environment.theHaulier_url, this.configuration);
    apiDisruptionService.getAllDisruptionStates().subscribe((thaDisruptionResp: THaDisruptionResp) => {

      if (thaDisruptionResp.error === false) {

        this.disruptionStates = thaDisruptionResp.states;

        this.disruptionStatesSubject.next(this.disruptionStates);
        console.log(`DisruptionMgmtService.getAllStates() => API.getAllStates(..), States=${this.disruptionStates}`);
      } else {

        console.error(`DisruptionMgmtService.getAllStates() => API.getAllDisruptionStates(..) failed. Error = ${thaDisruptionResp.errorMsg}`);
      }
    });
  }

  /**
   * getAllDisruptions() request all existing disruptions from the WebAPI
   * Disruption will be transformed by transformDisruptionEntries() into array for data table in frontend
   * Disruptions will be used to fill data into the pie chart by calling transformDisruptionTypesChart()
   * @param disruptionsFinder
   */
  public getAllDisruptions() {

    console.log(`DisruptionMgmtService.getAllDisruptions() => API.getAllDisruptions(..) called.`);
    var disruptionsFinder = <DisruptionsFinder>{};
    if (this.disruptionFinderSettings.currentDay === true) {

    }
    else if (this.disruptionFinderSettings.currentWeek === true) {

      var currentDate = new Date();
      var dateArray = this.startAndEndOfWeek(currentDate);
      disruptionsFinder.startTime = dateArray.startDate;
      disruptionsFinder.endTime = dateArray.endDate;
    }
    else if (this.disruptionFinderSettings.currentMonth === true) {
      console.error(`DisruptionMgmtService.getAllDisruptions() => DisruptionsFinderSettings(..) failed. Error = `);

    }

    const apiDisruptionService = new DisruptionService(this.httpClient, environment.theHaulier_url, this.configuration);
    apiDisruptionService.getAllDisruptions(disruptionsFinder).subscribe((thaDisruptionResp: THaDisruptionResp) => {

      if (thaDisruptionResp.error === false) {

        this.thaDisruptions = thaDisruptionResp.disruptions;
        this.transformDisruptionEntries(thaDisruptionResp);
        this.transformDisruptionTypesChart(thaDisruptionResp);
        // not implemented
        this.transformDisruptionStatesChart(thaDisruptionResp);

      } else {

        console.error(`DisruptionMgmtService.getAllDisruptions() => API.getAllDisruptions(..) failed. Error = ${thaDisruptionResp.errorMsg}`);
      }
    });
  }

  /**
   * loadSpecifiedDisruption() is used to load a specific disruption which has been selected from the data table
   * @param ident
   */
  public loadSpecifiedDisruption(ident: string) {

    console.log(`DisruptionMgmtService.loadSpecifiedDisruption(..) called`);

    const apiDisruptionService = new DisruptionService(this.httpClient, environment.theHaulier_url, this.configuration);
    var disruptionsFinder = <DisruptionsFinder>{};
    disruptionsFinder.ident = ident;
    apiDisruptionService.getAllDisruptions(disruptionsFinder).subscribe((thaDisruptionResp: THaDisruptionResp) => {

      if (thaDisruptionResp.error === false && thaDisruptionResp.disruptions != null && thaDisruptionResp.disruptions.length === 1) {

        this.currentSelectedDisruption2Process = thaDisruptionResp.disruptions[0];
        this.enableProcessDisruptionSubject.next(this.currentSelectedDisruption2Process);
      } else {

        console.error(`DisruptionMgmtService.loadSpecifiedDisruption() => failed. Error = ${thaDisruptionResp.errorMsg}`);
      }
    });
  }

  /**
   * getAllDisruptionEntries() is triggered by disruption grid component
   * Delivers the disruption for the disruption data table
   */
  public getAllDisruptionEntries(): DisruptionEntryTableRow[] {

    return this.disruptionEntryTableRows;
  }

  /**
   * loadDisruptionHistoryTable() is called by the DisruptionHistoryComponent
   * The method declares a local variable with the value of the current processing disruption and read out the state history 
   * The state history is loaded into a typed array (table row) and informs the specified observable
   */
  public loadDisruptionHistoryTable() {

    console.log(`DisruptionMgmtService.loadDisruptionHistoryTable(..) called`);

    var selectedDisruption: THaDisruption = {};
    selectedDisruption = this.getCurrentDisruption2Process();
    // selectedDisruptionHistory = selectedDisruption.stateHistory;
    var selectedDisruptionHistoryEntryTable = new Array<DisruptionStatesEntry>();

    var sequence = 1;
    selectedDisruption.stateHistory.forEach(state => {
      var disruptionStateRow = new DisruptionStatesEntry();

      disruptionStateRow.sequence = sequence++;
      disruptionStateRow.disruptionState = state.state;
      disruptionStateRow.timeStamp = this.transformDate(state.timestamp, "DisruptionProcessComponent.DateFormat");
      disruptionStateRow.desc = state.description;

      selectedDisruptionHistoryEntryTable.push(disruptionStateRow);
    });
    this.disruptionHistorySubject.next(selectedDisruptionHistoryEntryTable);
  }

  /**
   * loadIntermodalTripsTable() is triggered by the history component
   * This methods handles the process to get the disrupted intermodal trips into the history component and display them in a table row
   * Therefore the intermodal trips ID in the kpis will be used
   * For each kpi the intermodal trip will be looked up (State CANCELLED) 
   */
  public loadIntermodalTripsTable() {

    console.log(`DisruptionMgmtService.loadDisruptionIntermodalTripsTable(..) called`);
    // debugger;
    var selectedDisruption: THaDisruption = {};
    var kpiBaseArray = new Array<THaKpiBase>();
    selectedDisruption = this.getCurrentDisruption2Process();
    var kpiBaseArray = selectedDisruption.kpIs;

    var createdIntermodalTripsByDisruption = new Array<IntermodalAlternative>();
    var disruptedIntermodalTripsByDisruption = new Array<IntermodalAlternative>();
    var kpiBaseIdentsToSearchCreatedIntermodalTrips = [];
    var kpiBaseIdentsToSearchDisruptedIntermodalTrips = [];
    var selectedDisruptionIntermodalCreatedTrips = new Array<IntermodalTripEntry>();
    var disruptedIntermodalAlternatives = new Array<IntermodalAlternative>();

    // debugger;
    kpiBaseArray.forEach(kpi => {

      /**
       * These kpis show the store which are affected by the disruption
       */
      if (kpi.name === "kpi-disrupted-train-line-trips-found" || kpi.name === "kpi-disrupted-vehicle-trips-found" || kpi.name === "kpi-disrupted-driver-trips-found") {

        //debugger;
        /**
         * This method searches for every ident in the kpis the disrupted intermodal trips
         * Demo: Take the TRAIN_CANCELLED 3.05.2020 7:49 Disruption this one definitly has some
         */
        var i: number;
        for (i = 0; i < kpi.idents.length; i++) {
          //debugger;
          var intermodalAlternativeFinder: IntermodalAlternative = {};
          var intermodalCommon: THaAlternativesCommon = {};
          var kpiIdent = kpi.idents[i];
          intermodalCommon.ident = kpiIdent;
          intermodalAlternativeFinder.state = "CANCELLED";
          intermodalAlternativeFinder.commonalities = intermodalCommon;
          this.searchCommonIdentInIntermodalTripForKPI(intermodalAlternativeFinder, kpi.name);

        }
        // console.log(`DisruptionMgmtService.loadDisruptionIntermodalTripsTable(..) ${JSON.stringify(disruptedIntermodalAlternatives)}`)

      } else if (kpi.name === "kpi-intermodal-trips-created") {
        kpiBaseIdentsToSearchCreatedIntermodalTrips = kpi.idents;

      } else {
        console.error(`DisruptionMgmtService.loadDisruptionIntermodalTripsTable(..) => No KPIs found`);
      }
    });
    console.log(`DisruptionMgmtService.loadDisruptionIntermodalTripsTable(..) => Entry Rows ${JSON.stringify(this.disruptedIntermodalTripEntryRows)}`);
  }


  /**
   * searchCommonIdentInIntermodalTripForKPI() is triggered byloadIntermodalTripsTable()
   * This method is a special and second method to find for each intermodal trip in history component the common idents
   */
  public searchCommonIdentInIntermodalTripForKPI(intermodalAlByCommonIdentFinder: IntermodalAlternative, path?: string) {

    console.log(`DisruptionMgmtService.searchCommonIdentInIntermodalTripForKPI() called`);
    // debugger;
    var resultDisruptedTrip = Array<IntermodalTripEntry>();

    const apiSearchTrips = new IntermodalService(this.httpClient, environment.theHaulier_url, this.configuration);
    apiSearchTrips.getIntermodalAlternatives(intermodalAlByCommonIdentFinder).subscribe((response: IntermodalAlternativeResp) => {

      let tripFound = response.intermodalAlternatives;
      if (response.error === false && path === "kpi-disrupted-train-line-trips-found") {
        // console.debug(`DisruptionMgmtService.searchCommonIdentInIntermodalTrips() => TOUR BY COMMON_IDENT FOUND ${JSON.stringify(response.intermodalAlternatives)}`);
        // debugger;
        this.disruptedIntermodalTrips = response.intermodalAlternatives;
        let sequence = 1;

        console.debug(`DisruptionMgmtService.searchCommonIdentInIntermodalTripForKPI() Trips.Count=${tripFound.length}`);
        tripFound.forEach(tripElement => {

          const intermodalTour = new IntermodalTripEntry();

          intermodalTour.sequence = sequence++;
          intermodalTour.tripIdent = tripElement.ident;
          intermodalTour.lineId = tripElement.lineId;
          intermodalTour.vehicleId = tripElement.driverId;
          intermodalTour.driverId = tripElement.vehicleId;
          intermodalTour.tripDuration = tripElement.commonalities.totalDuration;
          intermodalTour.tripCost = tripElement.commonalities.totalCosts;
          intermodalTour.tripEmission = tripElement.routingSegment.emission.carbonDioxide;
          intermodalTour.tripStart = this.transformDate(tripElement.startTime, "DisruptionGridComponent.DateFormat");
          intermodalTour.tripEnd = this.transformDate(tripElement.endTime, "DisruptionGridComponent.DateFormat");
          intermodalTour.tripState = tripElement.state;

          resultDisruptedTrip.push(intermodalTour);
        });
        this.intermodalTourFinderByCommonIdentForKPISubject.next(resultDisruptedTrip);

      } else {
        console.error(`DisruptionMgmtService.searchCommonIdentInIntermodalTripForKPI(..) No Trips Found ${response.errorMsg}`);
      }

    });
  }

  /**
   * getAllDisrutionTypes() ist trigger by the create stepper component
   * It requests all disruption types and provides them in a combobox layout
   * @param role
   */
  public getAllDisrutionTypes(role: string): Array<string> {

    console.log(`DisruptionMgmtService.getAllDisrutionTypes(..) called`);
    var disruptionTypes: any[] = [];

    if (this.disruptionCatalog != null && this.disruptionCatalog.disruptions != null && this.disruptionCatalog.disruptions.length > 0) {

      this.disruptionCatalog.disruptions.forEach(disruptionItem => {

        if (disruptionItem.role === role) {

          var label = this.translateService.instant("DisruptionMgmtComponent.defaults.DisruptionTypes" + '.' + disruptionItem.type);
          var comboBoxItem = { value: disruptionItem.type, label: label };
          disruptionTypes.push(comboBoxItem);

          console.log(`DisruptionMgmtService.getAllDisrutionTypes(${role}, ${disruptionItem.type})`);
        }
      });

      return disruptionTypes;
    }

    return null;
    // console.log(`DisruptionMgmtService.transformDisruptionCatalogItems(..) SUCCESS => ${JSON.stringify(this.catalogDisruptionTypes)}`);
  }

  /**
   * getAllDisruptionAssignments() requests catalog assignments from the webAPI
   * and provides them for the process disruption component
   * @param type
   */
  public getAllDisruptionAssignments(type: string): Array<string> {

    console.log(`DisruptionMgmtService.getAllDisruptionAssignments(..) called`);
    var disruptionAssignments: any[] = [];

    if (this.disruptionCatalog != null && this.disruptionCatalog.assignments != null && this.disruptionCatalog.assignments.length > 0) {

      this.disruptionCatalog.assignments.forEach(disruptionItem => {

        if (disruptionItem.type === type) {

          var label = this.translateService.instant("DisruptionMgmtComponent.DisruptionAssignments" + '.' + disruptionItem.type);
          var comboBoxItem = { value: disruptionItem.type, label: label };
          disruptionAssignments.push(comboBoxItem);

          //disruptionTypes.push(disruptionItem.type);
          console.log(`DisruptionMgmtService.getAllDisrutionAssignments(${disruptionItem.type})`);

        }
      });

      return disruptionAssignments;
    }

    return null;
    // console.log(`DisruptionMgmtService.transformDisruptionCatalogItems(..) SUCCESS => ${JSON.stringify(this.catalogDisruptionTypes)}`);
  }

  /**
   * getAllDisrutionSolutions() requests catalog paths from the webAPI
   * and provides them for the process disruption component
   * @param path
   */
  public getAllDisrutionSolutions(path: string): Array<string> {

    console.log(`DisruptionMgmtService.getAllDisrutionSolutions(..) called`);
    var disruptionSolutions: any[] = [];

    //var disruptionTypes = new Array<string>();
    if (this.disruptionCatalog != null && this.disruptionCatalog.solutions != null && this.disruptionCatalog.solutions.length > 0) {

      this.disruptionCatalog.solutions.forEach(disruptionItem => {

        if (disruptionItem.path === path) {

          var label = this.translateService.instant("DisruptionMgmtComponent.DisruptionSolutions" + '.' + disruptionItem.path);
          var comboBoxItem = { value: disruptionItem.path, label: label };
          disruptionSolutions.push(comboBoxItem);

          //disruptionTypes.push(disruptionItem.type);
          console.log(`DisruptionMgmtService.getAllDisrutionSolutions(${disruptionItem.path})`);

        }
      });

      return disruptionSolutions;
    }

    return null;
    // console.log(`DisruptionMgmtService.transformDisruptionCatalogItems(..) SUCCESS => ${JSON.stringify(this.catalogDisruptionTypes)}`);
  }

  /**
   * transformDisruptionTypesChart() transforms the disruptions into pie chart to display the disruptions share by types
   * For this it uses the model DisruptionTypesShare
   */
  private transformDisruptionTypesChart(thaDisruptionResp: THaDisruptionResp) {

    console.log(`DisruptionMgmtService.transformDisruptionTypesChart(..) called`);

    if (thaDisruptionResp.disruptions != null && thaDisruptionResp.disruptions.length > 0) {

      var disruptionTypesTotal = [];
      var disruptionStatesTotal = [];
      var disruptionsTotal = 0;
      var numOfIllness = 0;
      var numOfVehicleDefect = 0;
      var numOfTrainCancelled = 0;
      var disruptionTypesShare = new DisruptionTypesShare();
      var arrayOfDisruptionTypesShare = Array<DisruptionTypesShare>();

      thaDisruptionResp.disruptions.forEach(disruptionType => {
        disruptionsTotal++;
        disruptionTypesTotal.push(disruptionType.type);
        disruptionStatesTotal.push(disruptionType.currentState.state);
      });

      /**
       * This loop counts up the number of the disruptions for each type
       */
      for (var i = 0; i < disruptionTypesTotal.length; i++) {
        if (disruptionTypesTotal[i] === "ILLNESS_REPORT") {
          numOfIllness++;
        } else if (disruptionTypesTotal[i] === "VEHICLE_DEFECT") {
          numOfVehicleDefect++;
        } else if (disruptionTypesTotal[i] === "TRAIN_CANCELLED") {
          numOfTrainCancelled++;
        } else if (disruptionStatesTotal[i] === "CANCELLED") {
          numOfTrainCancelled++;
        }
      }

      /**
       * This loop maps the counted dirsuption for each type into the object which is used by the chart
       */
      var disruptionTypes = ["ILLNESS_REPORT", "VEHICLE_DEFECT", "TRAIN_CANCELLED"];

      for (var j = 0; j < disruptionTypes.length; j++) {
        var disruptionTypesShare = new DisruptionTypesShare();

        if (disruptionTypes[j] === "ILLNESS_REPORT") {
          disruptionTypesShare.cliente = "ILLNESS_REPORT";
          disruptionTypesShare.total = numOfIllness;
          arrayOfDisruptionTypesShare.push(disruptionTypesShare);

        } else if (disruptionTypes[j] === "VEHICLE_DEFECT") {
          disruptionTypesShare.cliente = "VEHICLE_DEFECT";
          disruptionTypesShare.total = numOfVehicleDefect;
          arrayOfDisruptionTypesShare.push(disruptionTypesShare);

        } else if (disruptionTypes[j] === "TRAIN_CANCELLED") {
          disruptionTypesShare.cliente = "TRAIN_CANCELLED";
          disruptionTypesShare.total = numOfTrainCancelled;
          arrayOfDisruptionTypesShare.push(disruptionTypesShare);
        } else {
          console.log(`DisruptionMgmtService.transformDisruptionTypesChart(..) => element not found`);
        }
      }
      this.updatePieChartTypeSubject.next(arrayOfDisruptionTypesShare);
    }
  }

  // not implemented => shall do sth similar to the method for types
  private transformDisruptionStatesChart(thaDisruptionResp: THaDisruptionResp) {
    console.log(`DisruptionMgmtService.transformDisruptionStatesChart(..) called`);

    if (thaDisruptionResp.disruptions != null && thaDisruptionResp.disruptions.length > 0) {

      var disruptionStatesTotal = [];
      var disruptionsTotal = 0;
      var numOfNew = 0;
      var numOfCancelled = 0;
      var numOfDone = 0;
      var numOfInProcess = 0;
      var disruptionStatesShare = new DisruptionStatesShare();
      var arrayOfDisruptionStatesShare = Array<DisruptionStatesShare>();

      thaDisruptionResp.disruptions.forEach(disruptionType => {
        disruptionsTotal++;
        disruptionStatesTotal.push(disruptionType.currentState.state);

        //  console.log(`DisruptionMgmtService.transformDisruptionStatesChart(..) => ${JSON.stringify(disruptionStatesTotal)} `);
      });


      for (var j = 0; j < disruptionStatesTotal.length; j++) {
        if (disruptionStatesTotal[j] === "NEW") {
          numOfNew++;
        } else if (disruptionStatesTotal[j] === "DONE") {
          numOfDone++;
        } else if (disruptionStatesTotal[j] === "IN_PROCESS") {
          numOfInProcess++;
        } else if (disruptionStatesTotal[j] === "CANCELLED") {
          numOfCancelled++;
        }
      }
      //  console.log(`DisruptionMgmtService.transformDisruptionStatesChart(..) => ${JSON.stringify(numOfDone)} + ${numOfCancelled}`);
      var disruptionStates = ["NEW", "DONE", "IN_PROCESS", "CANCELLED"];

      for (var j = 0; j < disruptionStates.length; j++) {
        var disruptionStatesShare = new DisruptionStatesShare();

        if (disruptionStates[j] === "NEW") {
          disruptionStatesShare.cliente = "NEW";
          disruptionStatesShare.total = numOfNew;
          arrayOfDisruptionStatesShare.push(disruptionStatesShare);

        } else if (disruptionStates[j] === "DONE") {
          disruptionStatesShare.cliente = "DONE";
          disruptionStatesShare.total = numOfDone;
          arrayOfDisruptionStatesShare.push(disruptionStatesShare);

        } else if (disruptionStates[j] === "IN_PROCESS") {
          disruptionStatesShare.cliente = "IN_PROCESS";
          disruptionStatesShare.total = numOfInProcess;
          arrayOfDisruptionStatesShare.push(disruptionStatesShare);
        } else if (disruptionStates[j] === "CANCELLED") {
          disruptionStatesShare.cliente = "CANCELLED";
          disruptionStatesShare.total = numOfCancelled;
          arrayOfDisruptionStatesShare.push(disruptionStatesShare);
        } 
        
        else {
          console.log(`DisruptionMgmtService.transformDisruptionStatesChart(..) => element not found`);
        }
      }
      this.updatePieChartTypeSubject.next(arrayOfDisruptionStatesShare);
    }
  }

  /**
   * Contains the response from the previous request getAllDisruptionEntries() values (faults/disruptions) a new object is created.
   * The parameters of the created object are filled with data from the request.
   * The for loop iterates through each received object and fills an array which is used for the created table
   */
  private transformDisruptionEntries(thaDisruptionResp: THaDisruptionResp) {

    console.log(`DisruptionMgmtService.transformDisruptions(..) called`);

    /**
     * Deletes entries by refresh action 
     */
    if (this.disruptionEntryTableRows.length > 0) {

      this.disruptionEntryTableRows = [];
    }

    if (thaDisruptionResp.disruptions != null && thaDisruptionResp.disruptions.length > 0) {

      let count = 1;
      thaDisruptionResp.disruptions.forEach(disruptionElement => {

        const disruptionEntryTableRow = new DisruptionEntryTableRow();
        disruptionEntryTableRow.sequence = count++;
        disruptionEntryTableRow.selected = false;
        disruptionEntryTableRow.type = disruptionElement.type;
        disruptionEntryTableRow.ident = disruptionElement.ident;
        disruptionEntryTableRow.startTime = this.transformDate(disruptionElement.startTime, "DisruptionGridComponent.DateFormat");
        disruptionEntryTableRow.endTime = this.transformDate(disruptionElement.endTime, "DisruptionGridComponent.DateFormat");
        disruptionEntryTableRow.currentState = disruptionElement.currentState.state;

        this.disruptionEntryTableRows.push(disruptionEntryTableRow);
      });

      this.updateDisruptionEntrySubject.next(true);
    }
    else {

      console.error(`DisruptionMgmtService.transformDisruptions(..) no data to transform received`);
    }

    return this.disruptionEntryTableRows;
  }

  /**
   * Method sends request to Web API service DriverService in order to get related drivers by finder param
   * @param requestId responsible for instruction
   * @param driversFinder responsible handing over input value from user
   */
  public searchDrivers(requestId: string, driversFinder: DriversFinder) {

    console.log(`DisruptionMgmtService.searchDrivers(${requestId}) called`);

    /**
     * new data object for catalog model
     * which receives the param request id and drivers
     * drivers is an typed array for table presentation of search results
     */
    let result = new CatalogDriverResult();
    result.requestId = requestId;
    result.drivers = new Array<DriverEntryTableRow>();

    const apiDriverService = new DriverService(this.httpClient, environment.theHaulier_url, this.configuration);
    apiDriverService.getDrivers(driversFinder).subscribe((response: THaDriversResp) => {

      if (response.error === false) {

        let driversFound = response.drivers;
        if (driversFound == null || driversFound.length === 0) {

          // catalog receives the path for no search results
          result.path = "NO_DRIVER_FOUND";
          console.log(`DisruptionMgmtService.searchDrivers() => NO DRIVER FOUND`);
          this.driversFinderSubject.next(result);
        }
        else if (driversFound.length === 1) {

          this.singleDriverEntry = null;
          // catalog receives the path for one successful search results
          result.path = "SINGLE_DRIVER_FOUND";

          var dateOfBirth = this.transformDate(driversFound[0].dateOfBirth, "DisruptionMgmtComponent.DateFormatBirthday")
          const driverRespTableRow = new DriverEntryTableRow(1, false, dateOfBirth, driversFound[0]);
          result.drivers.push(driverRespTableRow);
          this.driversFinderSubject.next(result);
        }
        else if (driversFound.length > 1) {

          // catalog receives the path for multiple successful search results
          result.path = "MULTIPLE_DRIVER_FOUND";
          let index = 1;
          driversFound.forEach(driverElement => {

            /**
             * transforming date into sth. good to read
             * push each driver into drivers attribute in the result object and hand it over to subject
             */
            var dateOfBirth = this.transformDate(driverElement.dateOfBirth, "DisruptionMgmtComponent.DateFormatBirthday")
            const driverRespTableRow = new DriverEntryTableRow(index++, false, dateOfBirth, driverElement);
            result.drivers.push(driverRespTableRow);
            // this.randomDriver = result.drivers[Math.floor(Math.random() * result.drivers.length)];
          });

          console.log(`DisruptionMgmtService.searchDrivers() => MULTIPLE >DRIVERS FOUND ${JSON.stringify(result.drivers)}`);

          // informs the driversFinderSubject about the updated results data
          this.driversFinderSubject.next(result);
        }
      }
      else {

        console.error(`DisruptionMgmtService.searchDrivers() => failed. Error = ${response.errorMsg}`);
      }
    });
  }

  /**
   *
   * Method sends request to Web API service VehicleService in order to get related drivers by finder param
   * @param requestId responsible for instructions
   * @param vehicleFinder responsible handing over input value from user
   */
  public searchVehicles(requestId: string, vehicleFinder: VehicleFinder) {

    console.log(`DisruptionMgmtService.searchVehicles(..) called`);

    /**
     * new data object for catalog model
     * which receives the param request id and vehicles
     * vehicles is an typed array for table presentation of search results
     */
    let result = new CatalogVehicleResult();
    result.requestId = requestId;
    const vehicleEntryTableRow = new Array<VehicleEntryTableRow>(); // DOES NOT WORK: const result.vehicles = new Array<VehicleEntryTableRow>();

    const apiVehicleService = new VehicleService(this.httpClient, environment.theHaulier_url, this.configuration);
    apiVehicleService.findVehiclesByFinder(vehicleFinder).subscribe((response: THaVehiclesResp) => {

      if (response.error === false) {

        let vehiclesFound = response.vehicles;
        if (vehiclesFound == null || vehiclesFound.length === 0) {

          result.path = "NO_VEHICLE_FOUND";
          // result.error = true;
          console.log(`DisruptionMgmtService.searchVehicles() => NO VEHICLE FOUND`);
          this.vehiclesFinderSubject.next(result);
        }
        else if (vehiclesFound.length === 1) {

          result.path = "SINGLE_VEHICLE_FOUND";
          result.vehicles = [];
          console.log(`DisruptionMgmtService.searchVehicles() => SINGLE VEHICLE FOUND`);

          /**
           * the model of VehicleEntryTableRow presents the table
           */
          const vehicleRespTableRow = new VehicleEntryTableRow(1, false, vehiclesFound[0]);
          vehicleRespTableRow.sequence = 1;
          vehicleRespTableRow.selected = false;
          vehicleRespTableRow.extId = vehiclesFound[0].ident;
          vehicleRespTableRow.licensePlate = vehiclesFound[0].licensePlate;
          vehicleRespTableRow.depot = vehiclesFound[0].depot;
          vehicleRespTableRow.vehicleType = vehiclesFound[0].vehicleType;

          result.vehicles.push(vehicleRespTableRow); // DOES NOT WORK: result.vehicles.push(vehicleRespTableRow);
          console.log(`DisruptionMgmtService.searchVehicles() => SINGLE VEHICLE FOUND ${JSON.stringify(vehicleEntryTableRow)}`);
          this.vehiclesFinderSubject.next(result);

        }
        else if (vehiclesFound.length > 1) {

          result.path = "MULTIPLE_VEHICLE_FOUND";
          result.vehicles = [];
          console.log(`DisruptionMgmtService.searchVehicles()  => Multiple VEHICLE FOUND`);

          let index = 1;
          vehiclesFound.forEach(vehicleElement => {

            /**
            * the model of VehicleEntryTableRow presents the table
            */
            const vehicleRespTableRow = new VehicleEntryTableRow(1, false, vehicleElement);
            vehicleRespTableRow.sequence = index++;
            vehicleRespTableRow.selected = false;
            vehicleRespTableRow.extId = vehicleElement.ident;
            vehicleRespTableRow.licensePlate = vehicleElement.licensePlate;
            vehicleRespTableRow.depot = vehicleElement.depot;
            vehicleRespTableRow.vehicleType = vehicleElement.vehicleType;

            result.vehicles.push(vehicleRespTableRow);
          });

          console.log(`DisruptionMgmtService.searchVehicles() => SINGLE VEHICLE FOUND ${JSON.stringify(result.vehicles)}`);
          // informs the vehiclesFinderSubject about the updated results data
          this.vehiclesFinderSubject.next(result);
        }
      } else {

        console.error(`DisruptionMgmtService.searchDrivers() => failed. Error = ${response.errorMsg}`);
      }
    });
  }

  // ToDo: Check for redundancy
  public searchVehiclesByFinderxxxx(thaVehicle: THaVehicle) {

    console.log(`DisruptionMgmtService.searchVehiclesByFinder(..) called`);

    const result = new CatalogVehicleResult();
    const vehicleEntryTableRow = new Array<VehicleEntryTableRow>(); // DOES NOT WORK: const result.vehicles = new Array<VehicleEntryTableRow>();

    const apiVehicleService = new VehicleService(this.httpClient, environment.theHaulier_url, this.configuration);
    apiVehicleService.findVehiclesByFinder(thaVehicle).subscribe((response: THaVehiclesResp) => {

      if (response.error === false) {

        let vehiclesFound = response.vehicles;
        if (vehiclesFound == null || vehiclesFound.length === 0) {

          result.path = "NO_VEHICLE_FOUND";
          // result.error = true;
          console.log(`DisruptionMgmtService.searchVehicles() => NO VEHICLE FOUND`);
          this.vehiclesFinderSubject.next(result);
        }
        else if (vehiclesFound.length === 1) {

          result.path = "SINGLE_VEHICLE_FOUND";
          result.vehicles = [];
          console.log(`DisruptionMgmtService.searchVehicles() => SINGLE VEHICLE FOUND`);

          const vehicleRespTableRow = new VehicleEntryTableRow(1, false, vehiclesFound[0]);
          vehicleRespTableRow.sequence = 1;
          vehicleRespTableRow.selected = false;
          vehicleRespTableRow.extId = vehiclesFound[0].ident;
          vehicleRespTableRow.licensePlate = vehiclesFound[0].licensePlate;
          vehicleRespTableRow.depot = vehiclesFound[0].depot;
          vehicleRespTableRow.vehicleType = vehiclesFound[0].vehicleType;

          result.vehicles.push(vehicleRespTableRow); // DOES NOT WORK: result.vehicles.push(vehicleRespTableRow);
          console.log(`DisruptionMgmtService.searchVehicles() => SINGLE VEHICLE FOUND ${JSON.stringify(vehicleEntryTableRow)}`);
          this.vehiclesFinderSubject.next(result);

        }
        else if (vehiclesFound.length > 1) {

          result.path = "MULTIPLE_VEHICLE_FOUND";
          result.vehicles = [];
          console.log(`DisruptionMgmtService.searchVehicles()  => Multiple VEHICLE FOUND`);

          let index = 1;
          vehiclesFound.forEach(vehicleElement => {

            const vehicleRespTableRow = new VehicleEntryTableRow(1, false, vehicleElement);
            vehicleRespTableRow.sequence = index++;
            vehicleRespTableRow.selected = false;
            vehicleRespTableRow.extId = vehicleElement.ident;
            vehicleRespTableRow.licensePlate = vehicleElement.licensePlate;
            vehicleRespTableRow.depot = vehicleElement.depot;
            vehicleRespTableRow.vehicleType = vehicleElement.vehicleType;

            result.vehicles.push(vehicleRespTableRow);
          });
          this.vehiclesFinderSubject.next(result);
        }
      }
      else {

        /**
         * Fehler außerhalb des StörungsManagements definieren.
         */
        console.error(`DisruptionMgmtService.searchVehiclesByFinder() => failed. Error = ${response.errorMsg}`);
      }
    });
  }

  /**
	 * ToDo: Check for redundancy
	 * @param error
	 */
  processGetAllDriversError(error) {

    console.error(`DisruptionMgmtService.processGetAllDriversError(..) => getAllDrivers(..) failed with ${error}`);
  }

	/**
   * This method clones drivers so a total objectand not a reference  will be handed over  to observable
	 */
  cloneDrivers(): Array<THDriver> {

    if (this.drivers) {

      var temp = JSON.stringify(this.drivers);
      var cloned = JSON.parse(temp);
      return cloned;
    }

    return null;
  }

  /**
   * Stores the created disruption by calling Web API service  DisruptionService
   * @param disruption
   */
  public addNewDisruption(disruption: THaDisruption) {

    console.log(`DisruptionMgmtService.addNewDisruption(..) called`);
    const apiDisruptionService = new DisruptionService(this.httpClient, environment.theHaulier_url, this.configuration);
    apiDisruptionService.postAddDisruption(disruption).subscribe((thaDisruptionResp: THaDisruptionResp) => {

      if (thaDisruptionResp.error === false) {

        console.log(`DisruptionMgmtService.addNewDisruption() => SUCCESS = ${JSON.stringify(thaDisruptionResp.disruptions[0])}`);
      }
      else {

        console.error(`DisruptionMgmtService.addNewDisruption() => failed. Error = ${thaDisruptionResp.errorMsg}`);
      }
    });
  }

  /**
   * This method is called by a method in the process disruption component
   * This method calls the disruption service 
   * and receives the ident of the target disruption as well as the disruption state
   * These values are handed over into the post method
   */
  public putDisruption(ident: string, newDisruptionState: THaDisruptionState) {

    console.log(`DisruptionMgmtService.putDisruption(..) called`);
    const apiDisruptionService = new DisruptionService(this.httpClient, environment.theHaulier_url, this.configuration);
    apiDisruptionService.postAddState(ident, newDisruptionState).subscribe((thaDisruptionResp: THaDisruptionResp) => {

      if (thaDisruptionResp.error === false) {

        console.log(`DisruptionMgmtService.putDisruption() => SUCCESS = ${thaDisruptionResp}`);
      }
      else {

        console.error(`DisruptionMgmtService.putDisruption() => failed. Error = ${thaDisruptionResp.errorMsg}`);
      }
    });
  }

  /**
   * Method which is used by other methods to translate the date into something more nice
   * The translation is handled by another external service/ node module
   */
  private transformDate(date, component: string) {

    return this.datePipe.transform(date, this.translateService.instant(component));
  }

  // ToDo: check for redundance
  processOpenCreateDisruptionDialog() {

    console.error(`DisruptionMgmtService.processOpenCreateDisruptionDialog() called`)
  }

  /**
   * setCurrentDisruption2Process() set the chosen disruption from the grid as the current processing disruption
   * Furthermore it calls loadSpecifiedDisruption() to get all information about the disruption
   * @param disruptionRowDetails
   */
  public setCurrentDisruption2Process(selectedDisruptionIdent: string) {

    console.log(`DisruptionMgmtService.setCurrentDisruption2Process() called`);

    var thaDisruptionsExtract = this.thaDisruptions.filter(item => item.ident === selectedDisruptionIdent);
    if (thaDisruptionsExtract != null && thaDisruptionsExtract.length === 1) {

      this.currentSelectedDisruption2Process = thaDisruptionsExtract[0];
      this.loadSpecifiedDisruption(selectedDisruptionIdent);
    }
    else {

      console.error(`DisruptionMgmtService.setCurrentDisruption2Process(${selectedDisruptionIdent}) is not a valid ID.`)
    }
  }

  /**
   * getCurrentDisruption2Process() return direct the processing disruption to the method who call this method
   */
  public getCurrentDisruption2Process(): THaDisruption {

    console.log(`DisruptionMgmtService.getCurrentDisruption2Process(${this.currentSelectedDisruption2Process}) called.`)

    return this.currentSelectedDisruption2Process;
  }

  /**
   * searchDriverInIntermodalTrips() looks up the driver in the intermodal trips in the timespan of the current disruption
   * Therefore it will receive a IntermodalAlternative Object with the specified driver and time in it
   * This method has three instructions:
   * DRIVER_HAS_NO_TRIP_ASSIGNMENT: Driver has no current trips planned
   * DRIVER_HAS_TRIP_ASSIGNMENT: Driver actually has a trip assignment
   * The trip assignment goes into the subject which informs the observable
   */
  public searchDriverInIntermodalTrips(driverInTourFinder: IntermodalAlternative) {

    console.log(`disruptionMgmtService.searchIntermodalTrips() called`);

    const resultTrip = new CatalogDriverTripsResult;
    resultTrip.intermodalAlternatives = new Array<IntermodalAlternative>();

    const apiSearchTrips = new IntermodalService(this.httpClient, environment.theHaulier_url, this.configuration);
    apiSearchTrips.getIntermodalAlternatives(driverInTourFinder).subscribe((response: IntermodalAlternativeResp) => {

      if (response.error === false) {

        let tripsFound = response.intermodalAlternatives;
        if (tripsFound == null || tripsFound.length === 0) {

          resultTrip.path = "DRIVER_HAS_NO_TRIP_ASSIGNMENT";
          resultTrip.intermodalAlternatives = [];
          resultTrip.tripsQuantity = "0";

          this.intermodalAlternativeFinderByDriverSubject.next(resultTrip);
          console.log(`DisruptionMgmtService.searchDriverInIntermodalTrips() => NO TRIP BY DRIVER FOUND ${JSON.stringify(tripsFound)}`);

        } else if (tripsFound.length >= 1) {

          resultTrip.path = "DRIVER_HAS_TRIP_ASSIGNMENT";
          resultTrip.intermodalAlternatives = tripsFound;
          resultTrip.tripsQuantity = response.intermodalAlternatives.length.toString();

          /**
           * ToDo: Wording von Subject anpassen
           */
          this.intermodalAlternativeFinderByDriverSubject.next(resultTrip);
          console.log(`DisruptionMgmtService.searchDriverInIntermodalTrips() => TRIP BY DRIVER FOUND ${JSON.stringify(resultTrip.tripsQuantity)}`);
        }
      }
      else {
        console.error(`DisruptionMgmtService.searchDriverInIntermodalTrips(..) No Trip Found ${response.errorMsg}`);
      }
    });

  }

  /**
   * searchVehicleInIntermodalTrips() looks up the vehicle in the intermodal trips in the timespan of the current disruption
   * Therefore it will receive a IntermodalAlternative Object with the specified vehicle and time in it
   * This method has three instructions:
   * VEHICLE_HAS_NO_TRIP_ASSIGNMENT: Vehicle has no current trips planned
   * VEHICLE_HAS_TRIP_ASSIGNMENT: Vehicle actually has a trip assignment
   * The trip assignment goes into the subject which informs the observable
   */
  public searchVehicleInIntermodalTrips(vehicleInTourFinder: IntermodalAlternative) {

    console.log(`disruptionMgmtService.searchVehicleInIntermodalTrips() called`);
    const resultTrip = new CatalogVehicleTripsResult;

    resultTrip.intermodalAlternatives = new Array<IntermodalAlternative>();

    const apiSearchTrips = new IntermodalService(this.httpClient, environment.theHaulier_url, this.configuration);
    apiSearchTrips.getIntermodalAlternatives(vehicleInTourFinder).subscribe((response: IntermodalAlternativeResp) => {

      if (response.error === false) {

        let tripFound = response.intermodalAlternatives;
        console.log(`DisruptionMgmtService.searchVehicleInIntermodalTrips() => TRIP BY VEHICLE FOUND ${JSON.stringify(tripFound)}`);

        if (tripFound == null || tripFound.length === 0) {

          resultTrip.path = "VEHICLE_HAS_NO_TRIP_ASSIGNMENT";
          resultTrip.intermodalAlternatives = tripFound;

          this.intermodalAlternativeFinderByVehicleSubject.next(resultTrip);
          console.log(`DisruptionMgmtService.searchVehicleInIntermodalTrips() => NO TRIP BY VEHICLE FOUND ${JSON.stringify(tripFound)}`);

        } else if (tripFound.length >= 1) {

          resultTrip.path = "VEHICLE_HAS_TRIP_ASSIGNMENT";
          resultTrip.intermodalAlternatives = tripFound;

          this.intermodalAlternativeFinderByVehicleSubject.next(resultTrip);
          console.log(`DisruptionMgmtService.searchVehicleInIntermodalTrips() => TRIP BY VEHICLE FOUND ${JSON.stringify(resultTrip)}`);
        }
      }
      else {
        console.error(`DisruptionMgmtService.searchVehicleInIntermodalTrips(..) No Vehicle Found ${response.errorMsg}`);
      }
    });
  }

  /**
   * Method which requests all disrupted Trip by the selected disruption
   * Finder will be send within the request to IntermodalService
   * A typed array will be used to build a data table
   */
  public searchLineInIntermodalTrips(intermodalAlternativFinder: IntermodalAlternative) {

    console.log(`DisruptionMgmtService.searchLineInIntermodalTrips() called`);
    var resultTrip = new CatalogLineTripsResult;
    resultTrip.intermodalAlternativeEntryTableRows = new Array<IntermodalAlternativeEntryTableRow>();

    const apiSearchTrips = new IntermodalService(this.httpClient, environment.theHaulier_url, this.configuration);
    apiSearchTrips.getIntermodalAlternatives(intermodalAlternativFinder).subscribe((response: IntermodalAlternativeResp) => {

      if (response.error === false) {

        let tripFound = response.intermodalAlternatives;
        if (tripFound == null || tripFound.length === 0) {

          resultTrip.path = "LINE_HAS_NO_TRIP_ASSIGNMENT";
          this.intermodalAlternativeFinderByNetLineSubject.next(resultTrip);
        } else if (tripFound.length >= 1) {

          resultTrip.path = "LINE_HAS_TRIP_ASSIGNMENT";

          let sequence = 1;

          tripFound.forEach(tripElement => {

            const tripsRespTableRow = new IntermodalAlternativeEntryTableRow();
            tripsRespTableRow.sequence = sequence++;
            tripsRespTableRow.selected = false;
            tripsRespTableRow.startTime = this.transformDate(tripElement.commonalities.startOfExecution, "DisruptionGridComponent.DateFormat");
            tripsRespTableRow.endTime = this.transformDate(tripElement.endTime, "DisruptionGridComponent.DateFormat");
            tripsRespTableRow.lineId = tripElement.lineId;
            tripsRespTableRow.distance = tripElement.routingSegment.emission.carbonDioxide;
            tripsRespTableRow.duration = tripElement.commonalities.totalDuration;
            tripsRespTableRow.costs = tripElement.commonalities.totalCosts;
            tripsRespTableRow.numberOfTransfers = tripElement.commonalities.numberOfTransfers;
            tripsRespTableRow.totalTravelTimeIM = tripElement.commonalities.totalTravelTimeIM;
            tripsRespTableRow.totalDistance = tripElement.commonalities.totalDistance;
            tripsRespTableRow.co2 = tripElement.routingSegment.emission.carbonDioxide;
            tripsRespTableRow.ident = tripElement.ident;
            // console.log(`DisruptionMgmtService.searchLineInIntermodalTrips() => EACH TRIP BY LINE FOUND ${JSON.stringify(tripsRespTableRow)}`);

            resultTrip.intermodalAlternativeEntryTableRows.push(tripsRespTableRow);
          });

          /**
           * Iterates through response to get values and declare them in global variables 
           * Then will be used in another method to calculate the disruptedTrip/alternativeTrip deltas
           */
          var i;
          for (i = 0; i < tripFound.length; i++) {

            if (tripFound[i].routingSegment.transportMode.code === "TM_TTN_RAIL") {
              this.disruptedIntermodalTripTotalDuration = tripFound[i].commonalities.totalDuration;
              this.disruptedIntermodalTripTotalCost = tripFound[i].commonalities.totalCosts;
              this.disruptedIntermodalTripTotalEmission = tripFound[i].routingSegment.emission.carbonDioxide;
              this.disruptedIntermodalTripStart = tripFound[i].commonalities.startOfExecution;

              console.log(`DisruptionMgmtService.searchLineInIntermodalTrips() =>  ${JSON.stringify(this.disruptedIntermodalTripTotalEmission)}`);
            } else {
              console.log(`DisruptionMgmtService.searchLineInIntermodalTrips() =>  ${JSON.stringify(tripFound[i].routingSegment.transportMode.code)}`);
            }

          }
          /**
           * This subject will inform an observable in the process disruption component
           */
          this.intermodalAlternativeFinderByNetLineSubject.next(resultTrip);
        }
      } else {
        console.error(`DisruptionMgmtService.searchLineInIntermodalTrips(..) No Line Found ${response.errorMsg}`);
      }
    });
  }

  /**
   * searchCommonIdentInIntermodalTrips() is triggered by the process disruption component
   * Will only be applied in the use case of line cancelled 
   * It searches by providing the common ident in a finder object in order to get all other phases (pre, main(n-times) and haul)
   */
  public searchCommonIdentInIntermodalTrips(intermodalAlByCommonIdentFinder: IntermodalAlternative) {

    console.log(`DisruptionMgmtService.searchCommonIdentInIntermodalTrips() called`);

    var resultDisruptedTrip = new CatalogLineTripsResult;
    resultDisruptedTrip.intermodalAlternativeEntryTableRows = new Array<IntermodalAlternativeEntryTableRow>();

    const apiSearchTrips = new IntermodalService(this.httpClient, environment.theHaulier_url, this.configuration);
    apiSearchTrips.getIntermodalAlternatives(intermodalAlByCommonIdentFinder).subscribe((response: IntermodalAlternativeResp) => {

      if (response.error === false) {

        let tripFound = response.intermodalAlternatives;

        let sequence = 1;
        console.debug(`DisruptionMgmtService.searchCommonIdentInIntermodalTrips() Trips.Count=${tripFound.length}`);
        tripFound.forEach(tripElement => {

          const intermodalTour = new IntermodalAlternativeEntryTableRow();

          intermodalTour.sequence = sequence++;
          intermodalTour.ident = tripElement.ident;
          intermodalTour.numberOfTransfers = tripElement.commonalities.numberOfTransfers;
          intermodalTour.driverId = tripElement.driverId;
          intermodalTour.vehicleId = tripElement.vehicleId;
          intermodalTour.lineId = tripElement.vehicleId;
          intermodalTour.startOfExecution = tripElement.commonalities.startOfExecution;
          intermodalTour.fromStation = tripElement.routingSegment.fromStation.stopOff;
          intermodalTour.toStation = tripElement.routingSegment.toStation.stopOff;

          resultDisruptedTrip.intermodalAlternativeEntryTableRows.push(intermodalTour);
        });

        this.intermodalTourFinderByCommonIdentSubject.next(resultDisruptedTrip);
        this.affectedIntermodalTripsByCommonIdent = response.intermodalAlternatives;

      } else {
        console.error(`DisruptionMgmtService.searchCommonIdentInIntermodalTrips(..) No Trips Found ${response.errorMsg}`);
      }

    });
  }

  /**
   * cancelDisruptedIntermodalTrips() sets the selected failed tour to the status CANCELLED
   * The method is triggered by the updateDisruptedTrip() in process disruption component
   */
  public cancelDisruptedIntermodalTrips(state: string) {
    console.log(`DisruptionMgmtService.cancelDisruptedIntermodalTrips(..) called`);

    // debugger;
    var i;
    for (i = 0; i < this.affectedIntermodalTripsByCommonIdent.length; i++) {

      this.affectedIntermodalTripsByCommonIdent[i].state = state;

      const apiIntermodalService = new IntermodalService(this.httpClient, environment.theHaulier_url, this.configuration);
      apiIntermodalService.putIntermodalAlternative(this.affectedIntermodalTripsByCommonIdent[i]).subscribe((response: IntermodalAlternativeResp) => {
        if (response.error === false) {

          console.log(`DisruptionMgmtService.setIntermodalAlternative() called ${response}`);
          //   this.intermodalAlternativeResponseSubject.next(response);
        } else {
          console.error(`DisruptionMgmtService.setIntermodalAlternative() called ${response.errorMsg}`);
        }
      });
    }

  }

  /**
   * addKpiKeyToDisruption() is triggered by the create or process component
   * This method receives a ident of the target disrutpion and the kpi object
   * The KpI object is added to the target disruption by calling the WebAPI
   */
  public addKpiKeyToDisruption(ident: string, kpiBase: THaKpiBase) {

    console.log(`DisruptionMgmtService.addKpiKeyToDisruption(..) called`);

    const apiDisruptionService = new DisruptionService(this.httpClient, environment.theHaulier_url, this.configuration);
    apiDisruptionService.addKPI(ident, kpiBase).subscribe((thaDisruptionResp: THaDisruptionResp) => {

      if (thaDisruptionResp.error === false) {

        console.log(`DisruptionMgmtService.addKpiKeyToDisruption() => SUCCESS 2 = ${JSON.stringify(thaDisruptionResp.disruptions)}`);
      }
      else {

        console.error(`DisruptionMgmtService.addKpiKeyToDisruption() => failed. Error = ${thaDisruptionResp.errorMsg}`);
      }
    });
    // }
  }

  /**
   * putIntermodalAlternative() requires the whole intermodalAlternative object to be handed over 
   * The method calls the WebAPI to update an intermodal trip for example its state
   */
  public putIntermodalAlternative(setIntermodalAlternative: IntermodalAlternative) {
    //debugger;
    console.log(`DisruptionMgmtService.putIntermodalAlternative() called`);

    const apiIntermodalService = new IntermodalService(this.httpClient, environment.theHaulier_url, this.configuration);
    apiIntermodalService.putIntermodalAlternative(setIntermodalAlternative).subscribe((response: IntermodalAlternativeResp) => {
      if (response.error === false) {

        console.log(`DisruptionMgmtService.setIntermodalAlternative() called ${response}`);
        // this.intermodalAlternativeResponseSubject.next(response);
      } else {
        console.error(`DisruptionMgmtService.setIntermodalAlternative() called ${response.errorMsg}`);
      }
    });
  }

  /**
   * addNewIntermodalAlternative() is triggered by process disruption component
   * This methods sends a new created intermodal trip to the WebAPI which will be stored in the DB for later access
   */
  public addNewIntermodalAlternative(addNewIntermodalAlternative: IntermodalAlternative) {

    console.log(`DisruptionMgmtService.addNewIntermodalAlternative() called`);

    const apiIntermodalService = new IntermodalService(this.httpClient, environment.theHaulier_url, this.configuration);
    apiIntermodalService.storeIntermodalAlternative(addNewIntermodalAlternative).subscribe((response: IntermodalAlternativeResp) => {
      if (response.error === false) {

        console.log(`DisruptionMgmtService.addNewIntermodalAlternative(..) Ident=${response.intermodalAlternatives[0].ident} stored`)

      } else {

        console.error(`DisruptionMgmtService.addNewIntermodalAlternative() called ${response.errorMsg}`);
      }
    });
  }

  /**
   * calculateIntermodalRoute() is triggered by the process disruption component
   * The method call the Web API eg. the xIntermodal Service in order to get all routing alterantives by the delivered routing request
   * The Response will be transformed in the later called method
   */
  public calculateIntermodalRoute(routingRequest: RoutingRequest) {
    // debugger;
    console.log(`DisruptionMgmtService.calculateIntermodalRoute() called`);
    const apiIntermodalService = new IntermodalService(this.httpClient, environment.theHaulier_url, this.configuration);
    apiIntermodalService.calculateRoute(routingRequest).subscribe((response: CalculateRouteResp) => {

      if (response.error === false) {

        // console.log(`DisruptionMgmtService.calculateIntermodalRoute() ${JSON.stringify(response)}`);
        this.calculateRouteResp = response;
        this.transformCalculatedRouteData(response);
      } else {

        console.error(`DisruptionMgmtService.calculateIntermodalRoute() ${response.errorMsg}`);
      }
    });
  }

  /**
   * transformCalculatedRouteData() transforms the intermodal routing response
   * The transformation is done to present the data in a data table and compare values between alternative and the disrupted trip
   * Generally speaking the xIntermodal provides 1-4 intermodal Alternatives to transform
   */
  public transformCalculatedRouteData(calculateRouteResp: CalculateRouteResp) {

    console.log(`DisruptionMgmtService.transformCalculatedRouteData() called`);

    // initializing the table row for each alternative
    this.routingResponseTableRows = null;
    this.routingResponseTableRows = [];
    var sequenceRoute = 0;

    /**
     * Looping through each alternatives (1-4)
     * In the first place general data will be extracted and assigned
     */
    calculateRouteResp.routingResponse.wrappedRoutes.forEach(routingAlternative => {

      let routingResponseRowModel = {} as IntermodalRoutingResponseRowModel;

      routingResponseRowModel.sequence = sequenceRoute++;
      routingResponseRowModel.route = routingAlternative.name;
      routingResponseRowModel.numberOfTransfers = routingAlternative.numberOfTransfers;

      if (routingAlternative.startTimeSpecified) {

        routingResponseRowModel.start = routingAlternative.startTime;
      }
      routingResponseRowModel.totalCost = routingAlternative.totalCosts;
      routingResponseRowModel.totalDistance = routingAlternative.totalDistance;
      routingResponseRowModel.totalDuration = routingAlternative.totalDuration;
      routingResponseRowModel.totalHandlingTime = routingAlternative.totalHandlingTime;
      routingResponseRowModel.totalTravelTimeIM = routingAlternative.totalTravelTimeIM;
      routingResponseRowModel.totalTravelTimeRoad = routingAlternative.totalTravelTimeRoad;
      routingResponseRowModel.totalWaitingTime = routingAlternative.totalWaitingTime;
      routingResponseRowModel.co2 = routingAlternative.totalEmission.carbonDioxide;

      /**
       * Store the first-pair of critical Delta values
       * these are handed over on a method after by the end of each loop
       */
      this.alternativeIntermodalTripTotalCost = routingAlternative.totalCosts;
      this.alternativeIntermodalTripTotalDuration = routingAlternative.totalDuration;
      this.alternativeIntermodalTripStart = routingAlternative.startTime;
      this.alternativeIntermodalTripTotalEmission = routingAlternative.totalEmission.carbonDioxide;

      if (routingAlternative.polygon != null && routingAlternative.polygon.wrappedPoints != null) {

        routingResponseRowModel.polygon = {} as PlainLineString;
        routingResponseRowModel.polygon.wrappedPoints = routingAlternative.polygon.wrappedPoints;
      }

      // looping through the routing segment to get more specific location data like from and to station
      routingResponseRowModel.routingSegmentRowModels = [];
      var sequenceSegment = 0;
      routingAlternative.wrappedItinerary.forEach(routingSegment => {

        // In case of main haul we can extract a little bit more like than just transport mode such as operator and line codes
        var routingSegmentRowModel = new RoutingSegmentRowModel();
        routingSegmentRowModel.sequence = sequenceSegment++;
        if (routingSegment.line != null) {

          routingSegmentRowModel.lineCode = routingSegment.line.code;
          routingSegmentRowModel.lineName = routingSegment.line.name;
          routingSegmentRowModel.operatorCode = routingSegment.line.operator.code;
          routingSegmentRowModel.transportModeCode = routingSegment.line.transportMode.code;
        } else {

          routingSegmentRowModel.transportModeCode = routingSegment.transportMode.code;
        }

        routingSegmentRowModel.segmentDetails = [];
        if (routingSegment.fromStation != null) {

          if (routingSegment.fromStation.stopOff != null) {

            var routingSegmentDetailRowModel = new RoutingSegmentDetailRowModel();
            routingSegmentDetailRowModel.type = 0;
            routingSegmentDetailRowModel.sequenceRoutingSegment = routingResponseRowModel.sequence;
            routingSegmentDetailRowModel.stationCode = routingSegment.fromStation.stopOff.code;
            routingSegmentDetailRowModel.stationCity = routingSegment.fromStation.stopOff.city;
            routingSegmentDetailRowModel.stationCountry = routingSegment.fromStation.stopOff.country;

            routingSegmentRowModel.segmentDetails.push(routingSegmentDetailRowModel);
          } else {

            console.error(`DisruptionMgmtService.transformCalculatedRouteData() fromStation.stopOff === null`);
          }
        } else {

          console.error(`DisruptionMgmtService.transformCalculatedRouteData() fromStation === null`);
        }

        if (routingSegment.toStation != null) {

          if (routingSegment.toStation.stopOff != null) {

            var routingSegmentDetailRowModel = new RoutingSegmentDetailRowModel();
            routingSegmentDetailRowModel.type = 1;
            routingSegmentDetailRowModel.sequenceRoutingSegment = routingResponseRowModel.sequence;
            routingSegmentDetailRowModel.stationCode = routingSegment.toStation.stopOff.code;
            routingSegmentDetailRowModel.stationCity = routingSegment.toStation.stopOff.city;
            routingSegmentDetailRowModel.stationCountry = routingSegment.toStation.stopOff.country;

            routingSegmentRowModel.segmentDetails.push(routingSegmentDetailRowModel);
          } else {

            console.error(`DisruptionMgmtService.transformCalculatedRouteData() toStation.stopOff === null`);
          }
        } else {

          console.error(`DisruptionMgmtService.transformCalculatedRouteData() toStation === null`);
        }

        routingResponseRowModel.routingSegmentRowModels.push(routingSegmentRowModel);

      });

      /**
       * Generating Deltas betweeen intermodal trip and alternative routes
       */
      routingResponseRowModel.deltaCost = this.generateCostDelta(this.alternativeIntermodalTripTotalCost, this.disruptedIntermodalTripTotalCost);
      routingResponseRowModel.deltaEmission = this.generateEmissionDelta(this.disruptedIntermodalTripTotalEmission, this.alternativeIntermodalTripTotalEmission);
      routingResponseRowModel.deltaDuration = this.generateDurationDelta(this.disruptedIntermodalTripTotalDuration, this.alternativeIntermodalTripTotalDuration, this.disruptedIntermodalTripStart, this.alternativeIntermodalTripStart);
      // console.log(`DisruptionMgmtService.transformCalculatedRouteData(${JSON.stringify(routingResponseRowModel)})`)
      this.routingResponseTableRows.push(routingResponseRowModel);
    });

    this.updateRoutingResponseTableSubject.next(this.routingResponseTableRows);
  }

  /**
   * transformRoutingAlternativeToIntermodalTour() transforms a routing alternative into intermodal trip with multiple phases
   * the method receives drivers and vehicles same as the data of the selected intermodal alternative
   */
  public transformRoutingAlternativeToIntermodalTour(selectedIntermodalAlternativeRow: IntermodalRoutingResponseRowModel, driverPre?: string,
    driverPost?: string, vehiclePre?: string, vehiclePost?: string, processDisruptionIdent?: string, kpiBaseName?: THaKpiBase) {

    console.log(`DisruptionMgmtService.transformRoutingAlternativeToIntermodalTour() called`);

    // all data of selected intermodal alternative is gonna be filtered
    var selectedIntermodalAlternative = this.calculateRouteResp.routingResponse.wrappedRoutes.filter(row => row.name === selectedIntermodalAlternativeRow.route);

    if (selectedIntermodalAlternative != null && selectedIntermodalAlternative.length === 1) {

      // a random unique ident will be generated for each phase
      var commonIdent = this.generateRandomIdent(6);

      // for loop iterates through each phase (wrapped route) and transforms it into a IntermodalAlternative
      var alternativesToStoreArray = [];
      var storeRequestCounter: number;
      var wrappedRoutesCount = selectedIntermodalAlternative[0].wrappedItinerary.length;
      for (var i = 0; i < wrappedRoutesCount; i++) {

        var kpiBaseSingleAlternative: THaKpiBase = {};
        var routeKPI: THaRouteKPIs = {};
        var routeKPIs: Array<THaRouteKPIs> = [];
        var kpiBaseIdent: Array<string> = [];

        // a random unique common ident will be generated for all phases
        var uniqueTourIdent = this.generateRandomIdent(4);
        var storeSingleAlternative: IntermodalAlternative = {};
        storeSingleAlternative.ident = commonIdent + "-" + uniqueTourIdent + "-" + (i + 1);
        storeSingleAlternative.state = "READY_FOR_EXECUTION";
        storeSingleAlternative.startTime = selectedIntermodalAlternativeRow.start;
        storeSingleAlternative.endTime = selectedIntermodalAlternativeRow.endTime;

        // The commonalities betweeen the phases are created
        var thaAlternativesCommon: THaAlternativesCommon = {};
        thaAlternativesCommon.ident = commonIdent;
        thaAlternativesCommon.startOfExecution = selectedIntermodalAlternativeRow.start;
        thaAlternativesCommon.totalDistance = selectedIntermodalAlternativeRow.totalDistance;
        thaAlternativesCommon.totalDuration = selectedIntermodalAlternativeRow.totalDuration;
        thaAlternativesCommon.totalCosts = selectedIntermodalAlternativeRow.totalCost;
        thaAlternativesCommon.totalHandlingTime = selectedIntermodalAlternativeRow.totalHandlingTime;
        thaAlternativesCommon.totalTravelTimeIM = selectedIntermodalAlternativeRow.totalTravelTimeIM;
        thaAlternativesCommon.totalTravelTimeRoad = selectedIntermodalAlternativeRow.totalTravelTimeRoad;
        thaAlternativesCommon.numberOfTransfers = selectedIntermodalAlternativeRow.numberOfTransfers;
        // thaAlternativesCommon.emissions[0].carbonDioxide = selectedIntermodalAlternativeRow.co2; ToDo: Repair 
        thaAlternativesCommon.name = selectedIntermodalAlternativeRow.route;
        storeSingleAlternative.commonalities = thaAlternativesCommon;

        // storeSingleAlternative.routingSegment.emission.carbonDioxide = selectedIntermodalAlternativeRow.co2;
        storeSingleAlternative.routingSegment = selectedIntermodalAlternative[0].wrappedItinerary[i];

        //  debugger;
        // Declaring KPI data for KPI Base 
        var alternativeIdent = storeSingleAlternative.ident;
        kpiBaseIdent.push(alternativeIdent)
        kpiBaseSingleAlternative.idents = kpiBaseIdent;
        kpiBaseSingleAlternative.name = kpiBaseName.name;

        // Declaring KPI data for KPI base => this shows later what alterantive has been created
        routeKPI.duration = storeSingleAlternative.commonalities.totalDuration;
        // routeKPI.emission = storeSingleAlternative.commonalities.emissions[0].carbonDioxide; ToDo: Repair
        routeKPI.cost = storeSingleAlternative.commonalities.totalCosts;
        routeKPI.tourIdent = storeSingleAlternative.ident;
        routeKPIs.push(routeKPI);
        kpiBaseSingleAlternative.routeKPIs = routeKPIs;

        // for routing segment of type road (interpreted as pre and post haul) a driver and a vehicle are added
        if (selectedIntermodalAlternativeRow.routingSegmentRowModels[i].transportModeCode === "TM_ROAD") {

          if (i === 0) {

            storeSingleAlternative.driverId = driverPre;
            storeSingleAlternative.vehicleId = vehiclePre;
          }
          else {

            storeSingleAlternative.driverId = driverPost;
            storeSingleAlternative.vehicleId = vehiclePost;
          }
        }
        // for a deep sea and a rail typed routing segment only the line code will be added
        else if (selectedIntermodalAlternativeRow.routingSegmentRowModels[i].transportModeCode === "TM_TTN_RAIL") {

          storeSingleAlternative.lineId = selectedIntermodalAlternativeRow.routingSegmentRowModels[i].lineCode;
        }
        else if (selectedIntermodalAlternativeRow[i].routingSegmentRowModels.transportModeCode === "TM_TTN_DEEPSEA") {

          storeSingleAlternative.lineId = selectedIntermodalAlternativeRow.routingSegmentRowModels[i].lineCode;
        }

        // send the intermodal alternative to the WebAPI 
        this.addNewIntermodalAlternative(storeSingleAlternative);
        //debugger;

        // store a kpi key to the disruption with the new intermodal alternatives
        this.addKpiKeyToDisruption(this.currentSelectedDisruption2Process.ident, kpiBaseSingleAlternative);
      }
    } else {

      console.error(`DisruptionMgmtService.transformRoutingAlternativeToIntermodalTour() => NO ALTERNATIVE SELECTED`);
    }
  }

  /**
   * Generates random Ident for common ident and unique ident of the intermodal trips
   * With these idents the phases are indepentend to each other and can be linked to each other as needed
   */
  private generateRandomIdent(length: number) {
    console.log(`DisruptionMgmtService.generateRandomIdent() called`);
    /**
     * Create Random Ident
     */
    var randomIdent = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      randomIdent += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return randomIdent;
  }

  /**
   * This method calculates the delta of emission between the disrupted IM trip and the caclulated intermodal alternative
   */
  private generateEmissionDelta(emissionDisruptedTrip: number, emissionAlternativeTrip: number) {
    console.log(`DisruptionMgmtService.generateEmissionDelta() called`);

    var deltaEmission: number;

    deltaEmission = emissionAlternativeTrip - emissionDisruptedTrip;

    return deltaEmission;
  }

  /**
   * This method calculates the delta of cost between the disrupted IM trip and the caclulated intermodal alternative
   */
  private generateCostDelta(costAlternativeTrip: number, costDisruptedTrip: number) {
    console.log(`DisruptionMgmtService.generateCostDelta() called`);

    var deltaCost: number;

    deltaCost = costAlternativeTrip - costDisruptedTrip;

    return deltaCost;
  }

  /**
   * This method calculates the delta of duration between the disrupted IM trip and the caclulated intermodal alternative
   */
  private generateDurationDelta(durationDisruptedTrip: number, durationAlternativeTrip: number, startAlternativeTrip: Date, startDisruptedTrip: Date) {
    console.log(`DisruptionMgmtService.generateDurationDelta() called`);

    var deltaDurationTotal: number;
    var deltaDurationByTripDuration: number;
    var deltaDurationByTripStart: number;

    /**
     * Berechnen der Differenz (Delta) der Tourdauer zwischen ausgefallener Tour und alternativer Tour
     */
    deltaDurationTotal = durationAlternativeTrip - durationDisruptedTrip;

    /** ToDo:
     * Berechnen der Differenz (Delta) einer Zeitverschiebung von der ausgefallenen intermodalen Tour bis zur neuen intermodalen Tour
     */
    //   function calcDeltaByDate(dt1, dt2) {
    //     var diff = (dt2 - dt1) / 1000;
    //     diff /= (60 * 60);
    //     return Math.abs(Math.round(diff));
    //   }
    //   debugger;
    //   var dt1 = this.transformDate(startDisruptedTrip, "DisruptionGridComponent.DateFormat");
    //  //  var dt2 = this.transformDate(startAlternativeTrip, "DisruptionGridComponent.DateFormat");
    //   var dt2 = startAlternativeTrip;
    //   var dt1 = this.transformDate(startDisruptedTrip, "DisruptionGridComponent.DateFormat");
    //   var splittedDt1 = Date.parse(dt1);

    //   var dt1Date = new Date(dt1);
    //   //  var dt2Date = new Date(dt2);

    //   console.log(dt1Date)
    //   // deltaDurationByTripStart = calcDeltaByDate(dt1, dt2);

    // deltaDurationTotal = deltaDurationByTripDuration + deltaDurationByTripStart;

    return deltaDurationTotal;
  }

  /**
   * This method is triggered by the process disruption component
   * It defines an array for the data to display in the chart
   * After the array has been filled with data the subject will inform the observable in the Analytics Component
   */
  public showIntermodalAlternativeResultChart(selectedIntermodalAlternativeRoute: IntermodalRoutingResponseRowModel, disruptedIntermodalTour: IntermodalAlternativeEntryTableRow) {
    console.log(`DisruptionMgmtService.showIntermodalAlternativeResultChart() called`);
    //  debugger;
    if (selectedIntermodalAlternativeRoute !== null || disruptedIntermodalTour !== null) {

      var selectedIntermodalAlternativeRouteArray = new Array<IntermodalRoutingResponseRowModel>();
      selectedIntermodalAlternativeRouteArray.push(selectedIntermodalAlternativeRoute);
      var disruptedIntermodalTourArray = new Array<IntermodalAlternativeEntryTableRow>();
      disruptedIntermodalTourArray.push(disruptedIntermodalTour);
      var compareTripsMetrics = Array<IntermodalTripKPI>();

      /**
       * ToDo: Translation Service for name parameter
       */
      selectedIntermodalAlternativeRouteArray.forEach(element => {
        // debugger;
        var intermodalAlternativeTripKPI = new IntermodalTripKPI();
        intermodalAlternativeTripKPI.name = "Intermodal Alternative Trip";
        intermodalAlternativeTripKPI.emissionKPI = Math.round(element.co2);
        intermodalAlternativeTripKPI.durationKPI = element.totalDuration;
        intermodalAlternativeTripKPI.costsKPI = element.totalCost;

        compareTripsMetrics.push(intermodalAlternativeTripKPI)
      })

      disruptedIntermodalTourArray.forEach(element => {
        var intermodalDisruptedTripKPI = new IntermodalTripKPI();
        intermodalDisruptedTripKPI.name = "Intermodal Disrupted Trip";
        intermodalDisruptedTripKPI.emissionKPI = Math.round(element.co2);
        intermodalDisruptedTripKPI.durationKPI = element.duration;
        intermodalDisruptedTripKPI.costsKPI = element.costs;

        compareTripsMetrics.push(intermodalDisruptedTripKPI)
      })

      this.updateIntermodalAlternativeResultChartSubject.next(compareTripsMetrics);

    } else {
      console.log(`DisruptionMgmtService.showIntermodalAlternativeResultChart() => NO PARAMETERS RECEIVED`);

    }
  }

  /**
   * startAndEndOfWeek() is used to range the presented disruptions in the data table
   * This method does not return the week, but from Saturday before until next Friday in relation to the date.
   * @param date
   */
  private startAndEndOfWeek(date: Date) {

    //var date = new Date();
    var day = date.getDay();
    //var date = today.getDate() - day;

    // Grabbing Start/End Dates
    var StartDate = new Date(date);
    StartDate.setHours(0, 0, 0, 0);
    StartDate.setDate(date.getDate() - day + 1 - 1);

    var EndDate = new Date(date);
    EndDate.setHours(0, 0, 0, 0);
    EndDate.setDate(date.getDate() - day + 8);
    return {
      startDate: StartDate,
      endDate: EndDate
    };
  }
}


