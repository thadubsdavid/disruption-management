import { THaDisruptionState, THaDisruption } from '../../../../the-haulier-api/model/models';

export class DisruptionEntryTableRow {

  public sequence: number;
  public selected: boolean;
  public type: string = null;
  public reference: string = null;
  public ident: string = null;
  public subType: string = null;
  public startTime: string = null;
  public endTime: string = null;
  public currentState: string = null;


  constructor() {

    // this.sequence = sequence;
    // this.select = select;
    // this.type = disruptionEntryInfo.type;
    // this.desc = disruptionEntryInfo.desc;
    // this.ident = disruptionEntryInfo.ident;
  }

}
