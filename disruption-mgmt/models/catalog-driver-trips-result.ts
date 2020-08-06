import { IntermodalAlternativeEntryTableRow } from './intermodal-alternative-entry-table-row';
import { IntermodalAlternative } from '../../../../the-haulier-api/model/models';
// import { IntermodalAlternative } from 'src/app/the-haulier-api';

export class CatalogDriverTripsResult {


  public error: boolean = false;
  public path: string = null;
  // public intermodalAlternatives: Array<IntermodalAlternativeEntryTableRow>;
  public intermodalAlternatives: Array<IntermodalAlternative>;
  public tripsQuantity: string;
}
