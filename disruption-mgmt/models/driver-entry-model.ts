import { THaDriver } from '../../../../the-haulier-api/model/models';

export class DriverEntryTableRow {

  public sequence: number;
  public selected: boolean;
  public ident: string = null;
  public firstname: string = null;
  public lastname: string = null;
  public email: string = null;
  public dateOfBirth: string = null;

  constructor(sequence: number, selected: boolean, dateOfBirth:string, thaDriver: THaDriver) {

    this.sequence = sequence;
    this.selected = selected;
    this.ident = thaDriver.ident;
    this.firstname = thaDriver.firstname;
    this.lastname = thaDriver.lastname;
    this.email = thaDriver.email;
    this.dateOfBirth = dateOfBirth;
  }
}
