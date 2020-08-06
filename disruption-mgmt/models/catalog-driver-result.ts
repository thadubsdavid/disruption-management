import { THaDriver } from '../../../../the-haulier-api';
import { DriverEntryTableRow } from './driver-entry-model';

export class CatalogDriverResult {

  public error: boolean = false;
  public path: string = null;
  public drivers: Array<DriverEntryTableRow>;
  public requestId: string = "";
}