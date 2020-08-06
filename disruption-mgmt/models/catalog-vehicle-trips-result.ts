import { IntermodalAlternativeEntryTableRow } from './intermodal-alternative-entry-table-row';
import { IntermodalAlternative } from '../../../../the-haulier-api/model/models';

export class CatalogVehicleTripsResult {

  public error: boolean = false;
  public path: string = null;
  public intermodalAlternatives: Array<IntermodalAlternative>;
}
