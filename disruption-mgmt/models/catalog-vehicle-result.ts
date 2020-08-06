import { THaVehiclesResp } from '../../../../the-haulier-api';
import { VehicleEntryTableRow } from './vehicle-entry-model';

export class CatalogVehicleResult {

  public error: boolean = false;
  public path: string = null;
  public vehicles: Array<VehicleEntryTableRow>;
  public requestId: string = "";
}
