import {INodeInfo, IValue} from "./openzwave-shared";
import {ZVagValue} from "./value";
import {DeviceType} from "hemtjanst/lib/device";

export class ZVagNode {

    id: number;
    info: INodeInfo;
    ready: boolean;
    values: {[id: string]: ZVagValue} = {};

    constructor(id: number, info: INodeInfo) {
        this.id = id;
        this.info = info||{};
        this.ready = false;
    }

    public onReady() {
        this.ready = true;
    }

    public getType(): DeviceType {

        let features = {};

        for (let value of this.getValues()) {
            let ft = value.feature();
            if (ft === null) {
                continue;
            }
            features[ft.name] = true;
        }

        // Overrides
        if (features['on'] && features['currentPower']) {
            return DeviceType.Outlet;
        }
        if (features['contactSensorState']) {
            return DeviceType.ContactSensor;
        }


        switch(this.info.type) {
            case "Power Strip":
            case "On/Off Power Switch":
                return DeviceType.Outlet;
            case "Door Lock Keypad": return DeviceType.LockManagement;
            case "Fan Switch": return DeviceType.Fan;
            case "Light Dimmer Switch": return DeviceType.Lightbulb;
            case "Smoke Alarm Sensor": return DeviceType.SmokeSensor;
            case "CO Alarm Sensor": return DeviceType.CarbonMonoxideSensor;
            case "CO2 Alarm Sensor": return DeviceType.CarbonDioxideSensor;
            case "Home Security Sensor": return DeviceType.ContactSensor;
            case "Air Temperature Sensor": return DeviceType.TemperatureSensor;
            case "Luminance Sensor": return DeviceType.LightSensor;
            case "Humidity Sensor": return DeviceType.HumiditySensor;
            default:
                console.log(`No DeviceType available for ${this.info.type}`);
                return null;

            /*<DeviceType key="0x0000" label="Unknown Type" />
  <DeviceType key="0x0100" label="Central Controller" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x56,0x22"/>
  <DeviceType key="0x0200" label="Display Simple" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86"/>
  <DeviceType key="0x0300" label="Door Lock Keypad" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x62,0x63,0x80"/>
  <DeviceType key="0x0400" label="Fan Switch" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x26"/>
  <DeviceType key="0x0500" label="Gateway" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x56,0x60,0x8E,0x84,0x22"/>
  <DeviceType key="0x0600" label="Light Dimmer Switch" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x26"/>
  <DeviceType key="0x0700" label="On/Off Power Switch" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x25"/>
  <DeviceType key="0x0800" label="Power Strip" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x60,0x8E,0x25"/>
  <DeviceType key="0x0900" label="Remote Control AV" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86"/>
  <DeviceType key="0x0a00" label="Remote Control Multi Purpose" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x84"/>
  <DeviceType key="0x0b00" label="Remote Control Simple" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x5b"/>
  <DeviceType key="0x0b01" label="Key Fob" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x5b"/>
  <DeviceType key="0x0c00" label="Sensor Notification" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30"/>
  <DeviceType key="0x0c01" label="Smoke Alarm Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30"/>
  <DeviceType key="0x0c02" label="CO Alarm Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30"/>
  <DeviceType key="0x0c03" label="CO2 Alarm Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30"/>
  <DeviceType key="0x0c04" label="Heat Alarm Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30"/>
  <DeviceType key="0x0c05" label="Water Alarm Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30"/>
  <DeviceType key="0x0c06" label="Access Control Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30"/>
  <DeviceType key="0x0c07" label="Home Security Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30"/>
  <DeviceType key="0x0c08" label="Power Management Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30"/>
  <DeviceType key="0x0c09" label="System Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30"/>
  <DeviceType key="0x0c0a" label="Emergency Alarm Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30"/>
  <DeviceType key="0x0c0b" label="Clock Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30"/>
  <DeviceType key="0x0cff" label="MultiDevice Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30"/>
  <DeviceType key="0x0d00" label="Multilevel Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0d01" label="Air Temperature Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0d02" label="General Purpose Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0d03" label="Luminance Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0d04" label="Power Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0d05" label="Humidity Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0d06" label="Velocity Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0d07" label="Direction Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0d08" label="Atmospheric Pressure Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0d09" label="Barometric Pressure Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0d0a" label="Solar Radiation Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0d0b" label="Dew Point Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0d0c" label="Rain Rate Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0d0d" label="Tide Level Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0d0e" label="Weight Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0d0f" label="Voltage Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0d10" label="Current Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0d11" label="CO2 Level Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0d12" label="Air Flow Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0d13" label="Tank Capacity Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0d14" label="Distance Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0d15" label="Angle Postition Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0d16" label="Rotation Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0d17" label="Water Temperature Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0d18" label="Soil Temperature Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0d19" label="Seismic Intensity Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0d1a" label="Seismic Magnitude Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0d1b" label="Ultraviolet Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0d1c" label="Electrical Resistivity Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0b1d" label="Electrical Conductivity Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0b1e" label="Loudness Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0b1f" label="Moisture Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0b20" label="Frequency Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0b21" label="Time Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0b22" label="Target Temperature Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0bff" label="MultiDevice Sensor" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x30,0x31"/>
  <DeviceType key="0x0e00" label="Set Top Box" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x56,0x60,0x8e,0x84,0x22"/>
  <DeviceType key="0x0f00" label="Siren" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86"/>
  <DeviceType key="0x1000" label="Sub Energy Meter" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x56,0x32"/>
  <DeviceType key="0x1100" label="Sub System Controller" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x60,0x84,0x22"/>
  <DeviceType key="0x1200" label="Thermostat HVAC" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x43,0x40"/>
  <DeviceType key="0x1300" label="Thermostat Setback" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x43"/>
  <DeviceType key="0x1400" label="TV" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x56,0x60,0x8e,0x84,0x22"/>
  <DeviceType key="0x1500" label="Valve open/close" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x26,0x25"/>
  <DeviceType key="0x1600" label="Wall Controller" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x5b"/>
  <DeviceType key="0x1700" label="Whole Home Meter Simple" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x56,0x32"/>
  <DeviceType key="0x1800" label="Window Covering No Position/Endpoint" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x26,0x25"/>
  <DeviceType key="0x1900" label="Window Covering Endpoint Aware" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x26,0x25"/>
  <DeviceType key="0x1a00" label="Window Covering Position/Endpoint Aware" command_classes="0x5a,0x5e,0x59,0x72,0x73,0x85,0x86,0x26,0x25"/>
*/
        }
    }

    public getValues(): ZVagValue[] {
        let ret: ZVagValue[] = [];
        for (let k in this.values) {
            if (!this.values.hasOwnProperty(k)) continue;
            ret.push(this.values[k]);
        }
        return ret;
    }

    public updateValue(value: IValue) {
        if (typeof this.values[value.value_id] === "undefined") {
            this.values[value.value_id] = new ZVagValue();
        }
        let changes = this.values[value.value_id].update(value);
        if (changes.length > 0 && this.ready) {

        }
    }

    public removeValue(id: string) {
        if (typeof this.values[id] !== "undefined") {
            delete this.values[id];
        }
    }

    public update(info: INodeInfo) {
        if (typeof info !== "undefined") {
            for (let k in info) {
                if (info.hasOwnProperty(k)) {
                    this.info[k] = info[k];
                }
            }
        }
    }

}
