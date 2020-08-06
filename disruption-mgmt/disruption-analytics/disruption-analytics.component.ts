/**
 * Comment Header:
 * DisruptionAnalyticsComponent is responsible for the diagram area in disruption management system
 * DisruptionAnalyticsComponent presents two diagrams one per default which shows a total share of disruptions by disruption types
 * The charts are powered by jqx framework
 * The component starts by requiring several imports
 */

import { Component, OnInit, ViewChild } from '@angular/core';

import { DisruptionMgmtService } from '../disruption.service';
import { DisruptionTypesShare } from '../models/disruption-types-share';
import { jqxChartComponent } from 'jqwidgets-ng/jqxchart';
import { IntermodalTripKPI } from '../models/intermodal-trip-kpi';

@Component({
  selector: 'app-disruption-analytics',
  templateUrl: './disruption-analytics.component.html',
  styleUrls: ['./disruption-analytics.component.css']
})

export class DisruptionAnalyticsComponent implements OnInit {
  @ViewChild('disruptionTypesPieChart') disruptionTypesPieChart: jqxChartComponent;
  @ViewChild('intermodalTripsBarChart') intermodalTripsBarChart: jqxChartComponent;

  /**
   * Declare global variables for chart Source, Data Adapters etc.
   */
  dataPieChart: any;
  pieChartSource: any;
  pieChartDataAdapter: any;
  barChartSource: any;
  barChartDataAdapter: any;
  dataBarChart: any;


  /**
   * Intermodal Alternative Trip vs Intermodal Disrupted Trip Chart Settings
   * Maximum value should be at least 20.000 because the duration number is very high!
   */
  padding: any = { left: 5, top: 5, right: 10, bottom: 5 };
  titlePadding: any = { left: 0, top: 0, right: 0, bottom: 10 };
  xAxis: any =
    {
      dataField: 'name',
      showGridLines: false,
    };

  seriesGroupBarChart: any[] =
    [
      {
        type: 'column',
        columnsGapPercent: 50,
        seriesGapPercent: 0,
        valueAxis:
        {
          unitInterval: 1000,
          minValue: 0,
          maxValue: 20000,
          displayValueAxis: false,
          description: 'Amount per unit',
          axisSize: 'auto',
        },
        series: [
          { dataField: 'emissionKPI', displayText: 'Emissions' },
          { dataField: 'durationKPI', displayText: 'Duration' },
          { dataField: 'costsKPI', displayText: 'Costs' }
        ]
      }
    ]

  /**
   * Pie Chart settings for share of disruption types 
   */
  seriesGroups: any[] =
    [
      {
        type: 'donut',
        showLabels: true,
        series:
          [
            {
              dataField: 'total',
              displayText: 'cliente',
              labelRadius: 120,
              initialAngle: 15,
              radius: 100,
              innerRadius: 40,
              centerOffset: 0,
              formatSettings: { sufix: '', decimalPlaces: 0 }
            }
          ]
      }
    ];
  legendLayout: any = { left: 700, top: 160, width: 300, height: 200, flow: 'vertical' };

  /**
   * Per default the Pie Chart will be shown in the disruption analytics component
   */
  showDisruptionTypesPieChart = true;
  showIntermodalAlternativeChart = false;

  constructor(private disruptionService: DisruptionMgmtService) {

    console.log(`DisruptionAnalyticsComponent.constructor(..)  called`);
    // this.dataPieChart = [{"cliente":"ILLNESS_REPORT","total":38},{"cliente":"VEHICLE_DEFECT","total":46},{"cliente":"TRAIN_CANCELLED","total":36}]

    /**
     * pieChartSource will be made available by json data from dataPieChart
     * cliente = disruption type => ToDO: Try to fix this name definiton (other name definitions do not work) 
     * total = amount of disruption by typ
     */
    this.pieChartSource =
    {
      datatype: 'json',
      datafields: [
        { name: 'cliente', type: 'string' },
        { name: 'total', type: 'number' }
      ],
      localdata: this.dataPieChart,
      async: false
    };

    /**
     * pieChartDataAdapter will be in charge for loading/ updating data into the pie chart 
     */
    this.pieChartDataAdapter = new jqx.dataAdapter(this.pieChartSource, {
      async: false, autoBind: true,
      loadError: (xhr: any, status: any, error: any) => {
        alert('Error loading "' + this.pieChartSource.url + '" : ' + error);
      }
    });

    /**
     * barChartSource will be made available by json data from dataBarChart
     */
    this.barChartSource =
    {
      datatype: "json",
      datafields: [
        { name: 'name' },
        { name: 'emissionKPI' },
        { name: 'durationKPI' },
        { name: 'costsKPI' }
      ],
      localdata: this.dataBarChart,
    };

    /**
     * barChartDataAdapter will be in charge for loading/ updating data into the bar chart 
     */
    this.barChartDataAdapter = new jqx.dataAdapter(this.barChartSource, {
      async: false, autoBind: true, loadError: function (xhr, status, error) {
        alert('Error loading "' + this.barChartSource.url + '" : ' + error);
      }
    });
  }

  ngOnInit(): void {

    console.log(`DisruptionAnalyticsComponent.ngOnInit(..) called`);

    /**
     * ngOnInit starts with updating the observables by necessary data
     * ngOnInit calls getAllDisruptions() in order to trigger per default chart (disruptionTypes)
     * Bar chart will be only triggered by another action (calculatingIntermodalAlternatives)
     */
    this.createObservables();
    this.disruptionService.getAllDisruptions();
  }

  private createObservables() {

    console.log(`DisruptionAnalyticsComponent.createObservables(..) called`);

    this.disruptionService.updatePieChartTypeObject.subscribe((updateData) => { this.onRefreshPieChart(updateData); });
    console.log(`DisruptionAnalyticsComponent.createObservables(..) => updatePieChartTypeObject initialized`);

    this.disruptionService.updatePieChartStateObject.subscribe((updateData) => { this.onRefreshPieChart(updateData); });
    console.log(`DisruptionAnalyticsComponent.createObservables(..) => updatePieChartStateObject initialized`);

    this.disruptionService.updateIntermodalAlternativeResultChartObject.subscribe((intermodalAlternativeData) => { this.updateIntermodalAlternativeResults(intermodalAlternativeData) });
    console.log(`DisruptionAnalyticsComponent.createObservables(..) initialized intermodalAlternativeData.`);

  }

  /**
   * This chart will present a total share of the displayed disruptions by type in a pie chart
   * onRefreshPieChart method is triggered by an observable
   * onRefreshPieChart method loads relevant data into the chart by using the jqx data adapter
   * a refresh method at the end makes shure table is being refreshed
   */
  private onRefreshPieChart(updateData: DisruptionTypesShare[]): void {

    console.log(`DisruptionAnalyticsComponent.onRefreshPieChart(..) called`);

    this.dataPieChart = updateData;
    this.pieChartSource.localdata = this.dataPieChart;
    this.pieChartDataAdapter = new jqx.dataAdapter(this.pieChartSource);
    this.disruptionTypesPieChart.refresh();
    console.log(`DisruptionAnalyticsComponent.createObservables(..) => onRefreshPieChart ${JSON.stringify(this.dataPieChart)}`);
  }

  /**
   * This chart will show a strong comparison between alternative chart and disrupted chart by using the kpis emission, time, cost
   * updateIntermodalAlternativeResults method is triggered by an observable
   * updateIntermodalAlternativeResults method loads relevant data into the chart by using the jqx data adapter
   * a refresh method at the end makes shure table is being refreshed
   */
  private updateIntermodalAlternativeResults(intermodalAlternativeData: IntermodalTripKPI[]): void {

    console.log(`DisruptionAnalyticsComponent.updateIntermodalAlternativeResults(..) called`);

    this.showDisruptionTypesPieChart = false;
    this.showIntermodalAlternativeChart = true;

    this.dataBarChart = intermodalAlternativeData;
    this.barChartSource.localData = this.dataBarChart;
    this.barChartDataAdapter = new jqx.dataAdapter(this.barChartSource)

    this.intermodalTripsBarChart.refresh();
    console.log(`DisruptionAnalyticsComponent.createObservables(..) => onRefreshPieChart ${JSON.stringify(this.dataBarChart)}`);

  }



}
