import { THaDriver } from '../../../../the-haulier-api/model/models';

export class DriverResult {
  public ident: string;
  public firstname: string;
  public lastname: string;
  public email: string;
  public dateOfBirth: string;

  constructor(dateOfBirth: string, thaDriver: THaDriver) {

    this.ident = thaDriver.ident;
    this.firstname = thaDriver.firstname;
    this.lastname = thaDriver.lastname;
    this.email = thaDriver.email;
    this.dateOfBirth = dateOfBirth;
  }

}

