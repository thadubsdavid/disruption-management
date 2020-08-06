import { RoutingAlternative, RoutingSegment, PlainLineString, Emission, Station, Line, TransportMode } from '../../../../the-haulier-api/model/models';

export class RoutingResponseRowModel implements RoutingAlternative {

	public sequence: number = 0;
	public selected: boolean = true;

	public itinerary: RoutingSegment[];
	public polygon?: PlainLineString;
	public totalEmission?: Emission;

	public name?: string;
	public numberOfTransfers?: number;
	public startTime?: Date;
	public startTimeSpecified?: boolean;
	public totalCosts?: number;
	public totalDistance?: number;
	public totalDuration?: number;
	public totalHandlingTime?: number;
	public totalTravelTimeIM?: number;
	public totalTravelTimeRoad?: number;
	public totalWaitingTime?: number;

	/**
	 * Behind this section => calculated or formatted content
	 */
	// processed totalEmission
	public emission: number;

	// processed itinerary
	public routingSegmentRowModels: RoutingSegmentRowModel[];
}

export class RoutingSegmentRowModel {

	public sequence: number = 0;
	public selected: boolean = true;

	// Master
	public transportModeCode: string;
	public operatorCode: string;
	public lineCode?: string;
	public lineName?: string;

	// Detail(s)
	public segmentDetails: RoutingSegmentDetailRowModel[];
}

export class RoutingSegmentDetailRowModel {

	/**
	 * The type describes the sequence in the details grid
	 * 0 = Start
	 * 1 = End
	 */
	public type: number = 0;

	public sequenceRoutingSegment: number = 0;

	public stationCode: string;
	public stationCity: string;
	public stationCountry: string;
}

//  export class RoutingSegmentRowModel implements RoutingSegment {

// 	public sequence: number = 0;
// 	public selected: boolean = true;

// 	public emission?: Emission;
// 	public fromStation?: Station;
// 	public line?: Line;
// 	public toStation?: Station;
// 	public transportMode?: TransportMode;
// 	public accompanied?: boolean;
// 	public closingTime?: Date;
// 	public closingTimeSpecified?: boolean;
// 	public costs?: number;
// 	public distance?: number;
// 	public duration?: number;
// 	public handlingTime?: number;
// 	public readyForPickup?: Date;
// 	public readyForPickupSpecified?: boolean;
// 	public travelTime?: number;
// 	public waitingTime?: number;

// 	// processed emission
// 	public segmentEmission: number;
// }


