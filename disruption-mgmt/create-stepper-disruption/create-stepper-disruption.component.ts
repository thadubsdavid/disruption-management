/**
 * Comment Header:
 * CreateStepperDisruptionComponent is responsible for creating disruptions for the disruption management system 
 * CreateStepperDisruptionComponent is presented by using a stepper approach which is powered by angular materials and jqx framework
 * The component starts by requiring several imports
 */

import { Component, OnInit, ViewChild, ElementRef, OnDestroy, } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { error } from 'util';

import { TableConfiguration, TableCfgHelperService } from '../../../../shared/services/table-cfg-helper.service';
import { DisruptionMgmtService } from '../disruption.service';
import { SidebarService } from '../../../../center/sidebar.service';

import { jqxInputComponent } from 'jqwidgets-ng/jqxinput';
import { jqxGridComponent } from 'jqwidgets-ng/jqxgrid';
import { jqxWindowComponent } from 'jqwidgets-ng/jqxwindow';
import { jqxDateTimeInputComponent } from 'jqwidgets-ng/jqxdatetimeinput';

import { DriverEntryTableRow } from '../models/driver-entry-model';
import { CatalogDriverResult } from '../models/catalog-driver-result';
import { CatalogVehicleResult } from '../models/catalog-vehicle-result';
import { VehicleEntryTableRow } from '../models/vehicle-entry-model';
import { THaDisruption, DriversFinder, THaKpiBase, THaVehicle, DisruptionEntryInfo } from '../../../../the-haulier-api/model/models';



@Component({
  selector: 'app-stepper-disruption',
  templateUrl: './create-stepper-disruption.component.html',
  styleUrls: ['./create-stepper-disruption.component.css']
})
export class CreateStepperDisruptionComponent implements OnInit {
  /**
   * ViewChild refering to HTML elments
   */
  @ViewChild('showCreateDisruption') showCreateDisruption: jqxWindowComponent;
  @ViewChild('disruptionTypesComboBox') disruptionTypesComboBox: any;
  @ViewChild('driversDataTableRef') driversDataTableRef: jqxGridComponent;
  @ViewChild('vehiclesDataTableRef') vehiclesDataTableRef: jqxGridComponent;
  @ViewChild('pickerStart') pickerStart: jqxDateTimeInputComponent;
  @ViewChild('pickerEnd') pickerEnd: jqxDateTimeInputComponent;
  @ViewChild('UISearchPersonInput') UISearchPersonInput: jqxInputComponent;
  @ViewChild('UISearchVehicleInput') UISearchVehicleInput: jqxInputComponent;
  @ViewChild('inputDisruptionDescription') inputDisruptionDescription: jqxInputComponent;

  isLinear = false;
  nodeValue = null;

  /**
   * Declare global objects and variables for this component
   */
  createKpiBase: THaKpiBase = {};
  disruptionTypeFormGroup: FormGroup;
  setDisruptionStartFormGroup: FormGroup;
  setDisruptionEndFormGroup: FormGroup;
  private disruptionStartTime: string;
  private disruptionEndTime: string;
  private disruptionDescription: string;
  private createDisruption: THaDisruption;
  public disruptionTypesAdapter = null;
  public disruptionTypesAdapterIndex = -1;
  public selectedRow;
  public disruptionType;

  /**
   * Turn on and off HTML elements
   */
  createDisruptionCollapsed: boolean = false;
  public enableUISearchPerson: boolean = false;
  public enableShowDriverDetails: boolean = false;
  public enableUISearchVehicles: boolean = false;
  public enableShowVehicleDetails: boolean = false;
  public enableShowVehiclesGrid: boolean = false;
  public enableUISetDisruptionStart: boolean = false;
  public enableUISetDisruptionEnd: boolean = false;
  public disruptionTypesComboBoxDisabled: boolean = false;
  public showDisruptionTypeDropdown: boolean = true;
  public enableDisruptionTypeDropdown: boolean = true;

  /**
   * Source mapping table for drivers
   */
  private driversTableSource = {

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
  driversDataAdapter: any = new jqx.dataAdapter(this.driversTableSource);
  public driversTableConfiguration: TableConfiguration;
  public driversColumns: any[] = [];

  /**
   * Source mapping table for vehicles
   */
  private vehiclesTableSource = {

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
  vehiclesDataAdapter: any = new jqx.dataAdapter(this.vehiclesTableSource);
  public vehiclesTableConfiguration: TableConfiguration;
  public vehiclesColumns: any[] = [];

  /**
   * Constructor calls and establishes conenction to relevant services
   * @param sidebarService 
   * @param tableCfgHelperService 
   * @param formBuild 
   * @param disruptionService 
   * @param translateService 
   */
  constructor(private sidebarService: SidebarService, private tableCfgHelperService: TableCfgHelperService,
    private formBuild: FormBuilder, private disruptionService: DisruptionMgmtService, private translateService: TranslateService) {

    console.log(`CreateStepperDisruptionComponent.constructor(..) called`);
  }


  ngOnInit(): void {

    console.log(`CreateStepperDisruptionComponent.ngOnInit(..) called.`);
    this.createObservables();

    this.driversTableConfiguration = this.tableCfgHelperService.getTableConfig("Disruption", "DisruptionGridDriverComponent");
    if (this.driversTableConfiguration === null) {

      console.error(`DisruptionGridComponent.ngOnInit(..) TableConfiguration not valid`);
      return;
    }
    /**
     * Drivers Column receives table configuration
     */
    this.driversColumns = this.driversTableConfiguration.columns;

    this.vehiclesTableConfiguration = this.tableCfgHelperService.getTableConfig("Disruption", "DisruptionGridVehicleComponent");
    if (this.vehiclesTableConfiguration === null) {

      console.error(`DisruptionGridComponent.ngOnInit(..) TableConfiguration not valid`);
      return;
    }
    /**
     * Vehicles Column receives table configuration
     */
    this.vehiclesColumns = this.vehiclesTableConfiguration.columns;

    /**
     * HTML form groups for HTML stepper
     */
    this.disruptionTypeFormGroup = this.formBuild.group({
      firstCtrl: ['', Validators.required]
    });

    this.setDisruptionStartFormGroup = this.formBuild.group({
      thirdCtrl: ['', Validators.required]
    });

    this.setDisruptionEndFormGroup = this.formBuild.group({
      fourthCtrl: ['', Validators.required]
    });

    /**
     * Calling to initializing disruption catalog elements
     */
    this.initializeCatalog(true);
  }

  toggleCreateDisruptionCollapsed(event: any) {

    console.log(`CreateStepperDisruptionComponent.toggleCreateDisruptionCollapsed(..) called.`);
    this.createDisruptionCollapsed = !this.createDisruptionCollapsed;
  }

  private createObservables() {

    console.log(`CreateStepperDisruptionComponent.createObservables(..) called.`);
    if (this.disruptionService.containsSubscription("CreateStepperDisruptionComponent") === false) {

      this.sidebarService.sidebarClickedObservable.subscribe(config => {

        if (config.action === 'DisruptionGridComponent.AddNewDisruption') {

          this.sidebarShowCreateDisruptionDialog();
        }
      });
      console.log(`CreateStepperDisruptionComponent.createObservables(..) initialized sidebar.`);

      /**
       * Observable listens to subject in disruption service which forwards search results of vehicles
       */
      this.disruptionService.vehiclesFinderObservable.subscribe((resultVehicleSearch) => { this.processVehiclesFinderCatalog(resultVehicleSearch) });
      console.log(`CreateStepperDisruptionComponent.createObservables(..) initialized vehicles.`);

      /**
       * Observable listens to subject in disruption service which forwards search results of drivers
       */
      this.disruptionService.driversFinderObservable.subscribe((resultDriverSearch) => { this.resultDriverSearch(resultDriverSearch) });
      console.log(`CreateStepperDisruptionComponent.createObservables(..) initialized drivers.`);

      /**
      * Observable listens to subject in disruption service which forwards catalog elements
      */
      this.disruptionService.disruptionCatalogLoadedObservable.subscribe(loaded => { this.initializeCatalog(loaded) });
      console.log(`CreateStepperDisruptionComponent.createObservables(..) initialized catalog.`);
    }

  }

  /**
   * Assigning all found disruption types under role register to disruptionTypesAdapter
   * @param loaded 
   */
  private initializeCatalog(loaded: boolean) {

    console.log(`CreateStepperDisruptionComponent.initializeCatalog(..) called.`);
    this.disruptionTypesAdapter = this.disruptionService.getAllDisrutionTypes("REGISTER");
  }

  /**
  * This event is triggered by user selecting a disruption from the catalog in the combobox
  * Based on the chosen disruption type it gibes instructions to the component what to do next
  * @param event
  */
  public disruptionComboBoxOnSelect(event: any): void {

    console.log(`CreateStepperDisruptionComponent.disruptionComboBoxOnSelect() called`);

    if (event.args) {
      this.createDisruption = <THaDisruption>{};
      this.disruptionType = event.args.item;
      console.log(`CreateStepperDisruptionComponent.disruptionComboBoxOnSelect ${JSON.stringify(this.disruptionType.value)}`);
      if (this.disruptionType.value === "ILLNESS_REPORT") {

        /**
         * UI_SEARCH_PERSON activates
         */
        this.enableUISearchPerson = true;
        this.enableShowDriverDetails = true;
        this.enableUISearchVehicles = false;
        this.enableShowVehiclesGrid = false;
        this.enableShowVehicleDetails = false;
        this.createDisruption.type = this.disruptionType.value;
      }
      else if (this.disruptionType.value === "VEHICLE_DEFECT") {

        /**
         * UI_VEHICLE_DEFECT activates
         */
        this.enableUISearchPerson = false;
        this.enableShowDriverDetails = false;
        this.enableUISearchVehicles = true;
        this.enableShowVehiclesGrid = false;
        this.enableShowVehicleDetails = false;
        this.createDisruption.type = this.disruptionType.value;
      }
    }
  }

  /**
   * Method is triggered by observable driversFinderObservable
   * @param resultDriverSearch hands over the search results of disrupted driver coming from disruption Service
   */
  private resultDriverSearch(resultDriverSearch: CatalogDriverResult) {

    console.log(`CreateStepperDisruptionComponent.resultDriverSearch() called`);

    if (resultDriverSearch.requestId === "searchDriversButtonPressedEvent") {
      if (resultDriverSearch.path === "NO_DRIVER_FOUND") {

        // Clearing search input
       //  this.clearSearch();

        console.log(`CreateStepperDisruptionComponent.resultDriverSearch()  => No driver Found`)
      }
      else if (resultDriverSearch.path === "SINGLE_DRIVER_FOUND") {
        
        // enabling UI elements
        this.enableUISearchPerson = true;
        this.enableShowDriverDetails = true;

        /**
         * Single driver response will be transformed into the table 
         * And will automatically be selected.
         */
        this.driversTableSource.localdata = resultDriverSearch.drivers;
        this.driversDataAdapter = new jqx.dataAdapter(this.driversTableSource);

        var driver = resultDriverSearch.drivers[0];
        driver.selected = true;
        this.addDriverReference2Disruption(driver);

      }
      else if (resultDriverSearch.path === "MULTIPLE_DRIVER_FOUND") {

        // enabling UI elements
        this.enableUISearchPerson = true;
        this.enableShowDriverDetails = true;

        /**
         * Multiple driver response will be transformed into the table (no auto select)
         */
        this.driversTableSource.localdata = resultDriverSearch.drivers;
        this.driversDataAdapter = new jqx.dataAdapter(this.driversTableSource);
      }
    }
  }

  /**
   * Method triggers search for disrupted driver => hands over value of lastname (input) and a unique requestId
   * @param event from button next to search field
   */
  public searchDriversButtonPressedEvent(event: any) {

    console.log(`CreateStepperDisruptionComponent.searchDriversButtonPressedEvent(..) called`);

    let searchParam = this.UISearchPersonInput.val();
    console.log(`CreateStepperDisruptionComponent.searchDriversButtonPressedEvent By ID ${searchParam}`);

    /**
     * Configuring a driversFinder consisting of the last name value 
     * Call the disruption service which calls the Web API driverService
     */
    const driversFinder = <DriversFinder>{};
    driversFinder.lastname = searchParam;
    this.disruptionService.searchDrivers("searchDriversButtonPressedEvent", driversFinder);
  }

  /**
   * reads necessary data from the selected (disrupted) driver by user and hands it over to addDriverReference2Disruption()
   * @param event Checkbox in table
   */
  onDriverCellValueChanged(event: any): void {
    console.log(`CreateStepperDisruptionComponent.onDriverCellValueChanged() called `);

    const args = event.args;
    this.selectedRow = args.rowindex;
    var rowDetails = this.driversDataTableRef.getrowdata(this.selectedRow);
    this.addDriverReference2Disruption(rowDetails);

    console.log(`CreateStepperDisruptionComponent.onDriverCellValueChanged() value ${JSON.stringify(rowDetails)} `);

  }

  /**
   * reads necessary data from the selected (disrupted) vehicle by user and hands it over to addVehicleReference2Disruption()
   * @param event Checkbox in table
   */
  onVehicleCellValueChanged(event: any): void {
    console.log(`CreateStepperDisruptionComponent.onVehicleCellValueChanged() called `);

    const args = event.args;
    this.selectedRow = args.rowindex;
    let rowDetails = this.vehiclesTableSource.localdata[this.selectedRow];
    this.addVehicleReference2Disruption(rowDetails);

    console.log(`CreateStepperDisruptionComponent.onVehicleCellValueChanged() value ${JSON.stringify(rowDetails)} `);

  }

  /**
   * Method is triggered by observable vehiclesFinderObservable
   * @param resultVehicleSearch hands over the search results of disrupted vehicles coming from disruption Service
   */
  private processVehiclesFinderCatalog(resultVehicleSearch: CatalogVehicleResult) {
    console.log(`CreateStepperDisruptionComponent.processVehiclesFinderCatalog() called`);

    if (resultVehicleSearch.path === "NO_VEHICLE_FOUND") {
      console.log(`CreateStepperDisruptionComponent.processVehiclesFinderCatalog => NO_VEHICLE_DRIVER: ${resultVehicleSearch.vehicles}`);
      /**
       * ToDo: Sucheingabe zurücksetzen
       */
      // this.clearSearch();
    }
    else if (resultVehicleSearch.path === "SINGLE_VEHICLE_FOUND") {
      console.log(`CreateStepperDisruptionComponent.processVehiclesFinderCatalog => SINGLE_VEHICLE_FOUND: ${JSON.stringify(resultVehicleSearch.vehicles)}`);

      /**
       * Fahrzeug Daten eines Fahrzeugs in der UI-Tabelle anzeigen
       * Automatische Auswahl der Single Fahrzeug Response
       */
      this.enableShowVehicleDetails = true;
      this.enableShowVehiclesGrid = true;
      this.enableShowDriverDetails = false;
      this.enableUISearchPerson = false;
      this.enableUISearchVehicles = true;

      this.vehiclesTableSource.localdata = resultVehicleSearch.vehicles;
      this.vehiclesTableSource = new jqx.dataAdapter(this.vehiclesTableSource);

      /**
       * ToDo: Ergänzung von selected in THaVehicleResp o.Ä Workaround
       */
      var vehicle = resultVehicleSearch.vehicles[0];
      vehicle.selected = false;
      this.addVehicleReference2Disruption(vehicle);
    }
    else if (resultVehicleSearch.path === "MULTIPLE_VEHILCE_FOUND") {
      console.log(`CreateStepperDisruptionComponent.processVehiclesFinderCatalog => MULTIPLE_VEHICLE_FOUND: ${JSON.stringify(resultVehicleSearch.vehicles)}`);

      /**
       * Fahrzeuge Daten mehrere Fahrzeuge in der UI-Tabelle anzeigen
       * Select eines Fahrzeugs, Doppelklick, CheckBox oder Button
       */
      this.enableShowVehicleDetails = true;
      this.enableShowVehiclesGrid = true;
      this.enableUISearchPerson = false;
      this.enableUISearchVehicles = true;
      this.enableShowDriverDetails = false;

      this.vehiclesTableSource.localdata = resultVehicleSearch.vehicles;
      this.vehiclesTableSource = new jqx.dataAdapter(this.vehiclesTableSource);

    }
  }

  public searchVehiclesButtonPressedEvent(event: any) {

    const searchParam = this.UISearchVehicleInput.val();
    console.log(`CreateStepperDisruptionComponent.searchVehiclesButtonPressedEvent By ID ${searchParam}`);

    if (true) {

      this.searchVehiclesByFinder(searchParam);
    }
    else {

      console.error(`CreateStepperDisruptionComponent.searchVehiclesButtonPressedEvent`);
      // this.searchVehiclesByLicencePlate(searchParam);
    }
  }

  public searchVehiclesByFinder(searchParamLicencePlate: string) {

    console.log(`CreateStepperDisruptionComponent.searchVehiclesByFinder(..) called`);
    var thaVehicleFinder = <THaVehicle>{};
    thaVehicleFinder.licensePlate = searchParamLicencePlate;
    //this.disruptionService.searchVehiclesByFinder(thaVehicleFinder);
    this.disruptionService.searchVehicles("searchVehiclesByFinder", thaVehicleFinder);
  }

  /**
   * Not Implemented yet
   */
  public selectDriverFromGridEvent(event: any) {

    this.setUIValues("enableShowDriverDetails", true);
    // this.enableShowDriverDetails = true;
    // this.enableUISearchPerson = false;
  }

  public setDisruptionStartButtonPressedEvent(event: any) {

    this.enableShowDriverDetails = false;
    this.enableUISearchPerson = false;
    this.enableUISetDisruptionStart = true;
    this.enableUISetDisruptionEnd = false;
  }

  public setDisruptionEndButtonPressedEvent(event: any) {

    this.enableShowDriverDetails = false;
    this.enableUISearchPerson = false;
    this.enableUISetDisruptionStart = false;
    this.enableUISetDisruptionEnd = true;
  }

  /**
   * The start of disruption will be added to the creating disruption object
   */
  public setDisruptionStartTime() {

    console.log("CreateStepperDisruptionComponent.setDisruptionStartTime() called ");

    this.disruptionStartTime = this.pickerStart.val();
    this.createDisruption.startTime = new Date(this.disruptionStartTime);

  }

  /**
   * The end of disruption will be added to the creating disruption object
   */
  public setDisruptionEndTime() {

    console.log("CreateStepperDisruptionComponent.setDisruptionEndTime() called ");

    this.disruptionEndTime = this.pickerEnd.val();
    this.createDisruption.endTime = new Date(this.disruptionEndTime);

  }

/**
 * the creating disruption already has reference, duration now it will receive the kpi
 * And will be send to DisruptionService
 */
  public APISaveDisruptionButtonPressed() {

    console.log("CreateStepperDisruptionComponent.APISaveDisruptionButtonPressed() called ");

    /**
     * Calls a method to create kpi and assign it to disruption
     */
    this.createKpiValues();

    /**
     * call disruption service and hand over disruption
     */
    this.disruptionService.addNewDisruption(this.createDisruption);

    /**
     * triggers summary of created disruption
     */
    this.showCreateDisruption.close();
  }

  /**
   * Adds the kpi bases on the disruption type
   */
  private createKpiValues() {

    console.log("CreateStepperDisruptionComponent.createKpiValues() called ");

    var kpiArrayTemplate: Array<THaKpiBase> = [];
    var kpiValue: Array<string> = [];

    if (this.disruptionType.value === "ILLNESS_REPORT") {
      console.log(`CreateStepperDisruptionComponent.createKpiValues() ILLNESS_REPORT called`);

      this.createKpiBase.name = "kpi-illness-report-disruption-registered"; // KPI name added
      kpiValue.push(this.createDisruption.reference.ident); // push ident into init. array
      this.createKpiBase.idents = kpiValue; // assign init. array to kpi base object
      kpiArrayTemplate.push(this.createKpiBase); // all data pushed into typed array

      this.createDisruption.kpIs = kpiArrayTemplate; // add kpi to disruption object

    }
    else if (this.disruptionType.value === "VEHICLE_DEFECT") {
      console.log("CreateStepperDisruptionComponent.createKpiValues() VEHICLE_DEFECT called ");
 
      this.createKpiBase.name = "kpi-vehicle-defect-disruption-registered";  // KPI name added
      kpiValue.push(this.createDisruption.reference.ident); // push ident into init. array
      this.createKpiBase.idents = kpiValue; // assign init. array to kpi base object
      kpiArrayTemplate.push(this.createKpiBase); // all data pushed into typed array

      this.createDisruption.kpIs = kpiArrayTemplate; // add kpi to disruption object

    } else {
      console.error(`CreateStepperDisruptionComponent.APISaveDisruptionButtonPressed() ${error}`);

    }


  }

  private setUIValues(paramName: string, paramValue: boolean) {

    if (paramName === "enableShowDriverDetails") {

      this.enableShowDriverDetails = paramValue;
      this.disruptionTypesComboBoxDisabled = true;
    }
    else {

      this.enableShowDriverDetails = !paramValue;
    }

    this.enableUISearchPerson = !paramValue;
    this.enableUISetDisruptionStart = !paramValue;
    this.enableUISetDisruptionEnd = !paramValue;
  }

  /**
   * reset and clear all UI values that have been entered to enable registering a new disruption
   */
  private resetUIAndValues(): void {

    console.log("CreateStepperDisruptionComponent.resetUIValues() called ");

    this.disruptionTypesComboBox.clearSelection();
    this.pickerEnd.val("");
    this.pickerStart.val("");
    this.UISearchPersonInput.val("");
    this.UISearchVehicleInput.val("");
    this.driversDataTableRef.clear();
    this.vehiclesDataTableRef.clear();
    this.inputDisruptionDescription.val("");

    this.enableUISearchPerson = false;
    this.enableShowDriverDetails = false;
    this.enableUISearchVehicles = false;
    this.enableShowVehicleDetails = false;
    this.enableShowVehiclesGrid = false;
    this.enableUISetDisruptionStart = false;
    this.enableUISetDisruptionEnd = false;
    this.disruptionTypesComboBoxDisabled = false;
    this.showDisruptionTypeDropdown = true;
    this.enableDisruptionTypeDropdown = false;

  }

  /**
   * Driver reference is a nested object in the disruption object and stores information about the disrupted driver
   * After filling the entry info it will be assigned as reference to the global object disruption
   * @param driverRow 
   */
  private addDriverReference2Disruption(driverRow: DriverEntryTableRow) {

    console.log(`createStepperComponent.addDriverReference2Disruption(..) called`);

    var disruptionEntryInfo = <DisruptionEntryInfo>{};
    disruptionEntryInfo.type = "THaDriver";
    disruptionEntryInfo.ident = driverRow.ident;
    disruptionEntryInfo.desc = this.inputDisruptionDescription.val();
    this.createDisruption.reference = disruptionEntryInfo;

  }

  /**
   * Vehicle reference is a nested object in the disruption object and stores information about the disrupted vehicle
   * @param vehicleRow After filling the entry info it will be assigned as reference to the global object disruption
   */
  private addVehicleReference2Disruption(vehicleRow: VehicleEntryTableRow) {

    console.log(`createStepperComponent.addVehicleReference2Disruption(..) called`);

    var disruptionEntryInfo = <DisruptionEntryInfo>{};
    disruptionEntryInfo.type = "THaVehicle";
    disruptionEntryInfo.ident = vehicleRow.licensePlate;
    this.createDisruption.reference = disruptionEntryInfo;
  }

  /**
   * triggers register dialog and opens the window (by click on add button)
   */
  sidebarShowCreateDisruptionDialog() {

    console.log(`createStepperComponent.sidebarShowCreateDisruptionDialog(..) called`);
    this.showCreateDisruption.open();

  }

  /**
   * This method is called after creating the disruption 
   * in addition it calls a method to reseat and clear ui values
   * @param $event
   */
  onWindowClosed($event) {

    console.log(`createStepperComponent.onWindowClosed(..) called`);

    this.resetUIAndValues();
  }
}
