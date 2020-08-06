import { THaDisruptionCatalog } from '../../../../the-haulier-api/model/models';

export class DisruptionCatalog {

  public sequence: number;
  public selected: boolean;
  public type: string;
  public disruptions: Array<string>;
  public solutions: Array<string>;
  public assignments: Array<string>;
}
