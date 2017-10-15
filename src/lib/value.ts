import {IValue, IValueId, OZW} from "./openzwave-shared";
import * as deepEquals from "deep-equals";
import {FeatureMeta} from "hemtjanst/lib/feature";

export declare type IChange = {
    name: string,
    old: any,
    cur: any
};

export declare type UpdateCallback = (changes: IChange[]) => any;

export class ZVagValue implements IValue {
    node_id?: number;
    class_id?: number;
    instance?: number;
    index?: number;
    value_id?: string;
    type?: string;
    genre?: string;
    label?: string;
    units?: string;
    help?: string;
    read_only?: boolean;
    write_only?: boolean;
    min?: number;
    max?: number;
    is_polled?: boolean;
    value?: any;

    private updateCb: UpdateCallback[] = [];

    public getId(): IValueId {
        return {
            node_id: this.node_id,
            class_id: this.class_id,
            instance: this.instance,
            index: this.index
        }
    }

    public on(ev: 'update', cb: UpdateCallback) {
        this.updateCb.push(cb);
    }

    public set(ozw: OZW, value: string) {
        let val = undefined;
        switch(this.class_id) {
            case 37:
                val = (value==="1" ? 1 : 0);
                break;
            case 39:
                val = parseInt(value);
        }

        if (value !== undefined) {
            ozw.setValue(this.getId(), val);
        }

    }

    public update(value: IValue): IChange[] {
        if (value === undefined ||
            typeof value.value_id === "undefined" ||
            typeof value.instance === "undefined" ||
            typeof value.index === "undefined"
        ) {
            return;
        }
        let changes: IChange[] = [];
        for (let k in value) {
            if (value.hasOwnProperty(k) && value[k] !== undefined) {
                if (this[k] === undefined || !deepEquals(this[k], value[k])) {
                    changes.push({name: k, old: this[k], cur: value[k]});
                    this[k] = value[k];
                }
            }
        }
        if (changes.length > 0) {
            for (let cb of this.updateCb) {
                cb(changes);
            }
        }
        return changes;
    }

    public feature(): {name: string, meta: FeatureMeta} {
        switch(this.class_id) {
            case 37: return {name: "on", meta: {}};
            case 39: return {name: "brightness", meta: {}};
            //case 49: return {name: "powerLevel", meta: {}};

        }


        return null;
    }

}