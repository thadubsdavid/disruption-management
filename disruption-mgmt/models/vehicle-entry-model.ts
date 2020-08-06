import { THaVehicle } from '../../../../the-haulier-api/model/models';

export class VehicleEntryTableRow {

  public licensePlate: string = null;
  public depot: string = null;
  public vehicleType: string = null;
  public sequence: number;
  public selected: boolean;
  public extId: string;


  constructor(sequence: number, selected: boolean, thaVehicle: THaVehicle) {

    this.licensePlate = thaVehicle.licensePlate;
    this.depot = thaVehicle.depot;
    this.vehicleType = thaVehicle.vehicleType;
    this.selected = selected;
    this.sequence = sequence;
  }

}
