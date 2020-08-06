import { IntermodalAlternative, THaAlternativesCommon, RoutingSegment, PlainPoint, Emission, PlainLineString, Location } from './../../../../the-haulier-api/model/models';

export class IntermodalAlternativeEntryTableRow {

  public ident?: string;
  public sequence: number;
  public selected: boolean;
  public startTime: string;
  public endTime: string;
  public lineId?: string;
  public driverId?: string;
  public vehicleId?: string;
  public distance: number;
  public duration: number;
  public costs: number;
  //public ident: string;
  public fromStation?: Location;
  public toStation?: Location;
  public numberOfTransfers?: number;
  public totalTravelTimeIM?: number;
  public totalDistance?: number;
  public emissions?: number;
  public startOfExecution?: Date;
  public co2: number;
  // public fromStation?: PlainPointFrom[];
  // public toStation?: PlainPointTo[];

  /**
   * Testing purposes
   */
  public fromStation_x?: number;
  public fromStation_y?: number;
  public toStation_x?: number;
  public toStation_y?: number;
}

export class AlternativesCommon {

  public ident: string;
  public totalDuration: number;
  public totalCosts: number;
}
export class AlternativeRoutingSegment {

  public ident: string;
  public totalDuration: number;
  public totalCosts: number;
  public emission: AlternativeEmission;
}

export class AlternativeEmission {

  public co2: number;
}

export class PlainPointFrom {

  x?: number;
  y?: number;
}

export class PlainPointTo {

  x?: number;
  y?: number;
}
