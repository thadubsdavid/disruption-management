import { THaCatalogDisruption } from '../../../../the-haulier-api/model/models';

export class CatalogDisruption {


  public selected: boolean;
  public ident: string = null;
  // public disruptions: Array<THaCatalogDisruption>;
  public role: string = null;
  public actions: Array<string>;
  public type: string;

  constructor() { }
}
