/**
 * Comment Header:
 * DisruptionGridComponent is responsible to listen the disruptions details in a data table.
 * A user can select a disruption from the data table to process it in the ProcessDisruptionComponent
 * The component starts by requiring several imports
 */

import { Component, OnInit, ViewChild, Output, EventEmitter, Input } from '@angular/core';

import { jqxGridComponent } from 'jqwidgets-ng/jqxgrid';

import { DisruptionMgmtService } from '../disruption.service';
import { TableCfgHelperService, TableConfiguration, DataTableColumns } from '../../../../shared/services/table-cfg-helper.service';
import { SidebarService } from '../../../../center/sidebar.service';
import { THaDisruptionResp } from '../../../../the-haulier-api';


@Component({
  selector: 'app-disruption-grid',
  templateUrl: './disruption-grid.component.html',
  styleUrls: ['./disruption-grid.component.css']
})
export class DisruptionGridComponent implements OnInit {

  @ViewChild('disruptionEntryTable') disruptionEntryTable: jqxGridComponent;

  @Output() showProcess = new EventEmitter<any>();
  @Output() showAnalytics = new EventEmitter<any>();
  @Input() hidden: boolean;
  
  public disruptionRowDetails: THaDisruptionResp;

  /**
   * Defining the source for the disruption table which shows fundamental properties of each disruptions
   */
  private newSource = {

    localdata: [],
    datatype: "array",
    datafields: [
      { name: 'sequence', type: 'number' },
      { name: 'selected', type: 'boolean' },
      { name: 'type', type: 'string' },
      { name: 'ident', type: 'string' },
      { name: 'startTime', type: 'string' },
      { name: 'endTime', type: 'string' },
      { name: 'currentState', type: 'string' }
    ]
  };

  /**
   * DEclaring the dataAdapter which loads data into the table
   * A table configuration service provides necessary table settings
   */
  dataAdapter: any = new jqx.dataAdapter(this.newSource);
  public tableConfiguration: TableConfiguration;
  public columns: DataTableColumns[] = [];
  public rowValue: any[] = [];

  /**
   * The constructor triggers holds the updateDisruptionEntryObservable which will be informed by a subject in the disruptionService
   * about current disruptions
   * a sidebarService will be used to handle refresh of the table
   */
  constructor(private sidebarService: SidebarService, private disruptionService: DisruptionMgmtService, private tableCfgHelperService: TableCfgHelperService) {
   
    console.log(`DisruptionGridComponent constructor() called `);

    this.disruptionService.updateDisruptionEntryObservable.subscribe((updateData) => { this.onRefreshDisruptionEntryTable(updateData); });

    this.sidebarService.sidebarClickedObservable.subscribe(config => {

      if (config.action === 'DisruptionGridComponent.RefeshDisruptions') {
        console.log(`DisruptionGridComponent.constructor(..).RefreshSidebar Clicked`);
        this.processRefreshSidebarClicked();
      }
    });
  }

  /**
   * ngOnInit method calls the tableCfgHelperService to get table framework (this is handled/configured by the administrator/ user settings in DB)
   * Another statement configures the columns by using  this.tableConfiguration.columns and cellClassName
   */
  ngOnInit() {

    console.log(`DisruptionGridComponent.ngOnInit(..) called`);

    this.tableConfiguration = this.tableCfgHelperService.getTableConfig("Disruption", "DisruptionGridComponent");
    if (this.tableConfiguration === null) {

      console.error(`DisruptionGridComponent.ngOnInit(..) TableConfiguration not valid`);
      return;
    }
    this.tableConfiguration.columns.forEach(dataTableColumn => {

        dataTableColumn.cellClassName = this.cellClassDisruption;
    });
    this.columns = this.tableConfiguration.columns;

    this.refreshDisruptionEntryTable(false);
  }

  /**
   * cellClassDisruption handles the coloring or other configuration for the table
   */
  cellClassDisruption = (row: any, dataField: any, cellText: any, rowData: any): string => {

    /**
     * Changing the colors in the column according to state of disruption
     */
		let cellValue = rowData[dataField];
		switch (dataField) {
			case 'currentState':
				if (cellValue === "DONE") {
					return 'bg-disruption-done';
				}
				else if (cellValue === "NEW") {
					return 'bg-disruption-new';
				}
				else if (cellValue === "IN_PROCESS") {
					return 'bg-disruption-in_process';
				}
				else if (cellValue === "CANCELLED") {
					return 'bg-disruption-cancelled';
				}
		}
	}

  /**
   * onCellDoubleClicked method is responsible to load the selected disruption (double click) for disruption service 
   * In the disruption service this information will be used to get the whole disruption object and process it in the process component
   */
  onCellDoubleClicked(event) {

    console.log(`DisruptionGridComponent.onCellDoubleClicked(..) called`);

    var disruptionRowDetails = this.disruptionEntryTable.getrowdata(event.args.rowindex);
    console.log(`DisruptionGridComponent.onCellDoubleClicked(..) ROW_VALUE => ${JSON.stringify(disruptionRowDetails)} called`);

    this.disruptionService.setCurrentDisruption2Process(disruptionRowDetails.ident);
  }

  onCellValueChanged(event: any) {
    console.log(`DisruptionGridComponent.onCellValueChanged(..) called`);

    this.showAnalytics.emit();
  }

  onColumnReordered($event) {

    console.error(`DisruptionGridComponent.onColumnReordered(..) not implemented`);
  }

  onColumnResized($event) {

    console.error(`DisruptionGridComponent.onColumnResized(..) not implemented`);
    console.log(`DisruptionGridComponent.onColumnResized(..), new width=${$event.args.newwidth}`)
  }

  /**
   * Refresh Button in the sidebar has been clicked and initializes a refresh button
   */
  public processRefreshSidebarClicked() {

    console.log(`DisruptionGridComponent.processRefreshSidebarClicked(..) called`);

    this.disruptionService.getAllDisruptions();
  }

  /**
   * onRefreshDisruptionEntryTable is triggered by a observable and only calls the refreshDisruptionEntryTable method
   */
  private onRefreshDisruptionEntryTable(updateData: boolean) {

    console.log(`DisruptionGridComponent.onRefreshDisruptionEntryTable(..) called`);

    this.refreshDisruptionEntryTable(updateData);
  }

  /**
   * refreshDisruptionEntryTable method is responsible to load data into the disruption data table by using DisruptionEntryTableRow model
   * The data will be loaded into table by using the jqx data adapter 
   */
  private refreshDisruptionEntryTable(updateData: boolean) {

    console.log(`DisruptionGridComponent.refreshDisruptionEntryTable(..) called`);

    const disruptionEntryTableRows = this.disruptionService.getAllDisruptionEntries();
    if (disruptionEntryTableRows != null) {

      this.newSource.localdata = disruptionEntryTableRows;
      this.dataAdapter = new jqx.dataAdapter(this.newSource);
    }
  }
}
