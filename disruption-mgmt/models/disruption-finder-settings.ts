/**
 * @param currentDay 
 * @param currentWeek => default=true
 * @param currentMonth 
 */
export class DisruptionFinderSettings {

    public currentDay: boolean = false;
    public currentWeek: boolean = true;
    public currentMonth: boolean = false;

    public useDateTimeSettings: boolean = false;
    public startTime: Date = new Date();
    public endTime: Date = new Date();

    public constructor() {

    }

}