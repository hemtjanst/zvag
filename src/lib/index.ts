/// <reference path="./openzwave-shared.d.ts"/>
import {IHomeId, INodeInfo, IValue, IValueId, OZW} from './openzwave-shared';
import {Client} from "hemtjanst/lib/hemtjanst";
import {Device, DeviceType} from "hemtjanst/lib/device";
import {ZVagNode} from "./node";
import {ZVagValue, IChange} from "./value";

import * as dbgModule from "debug";
import {FeatureMeta} from "hemtjanst/lib/feature";
import {utils} from "hemtjanst/lib/utils";
let debug = dbgModule("zvag");

export type ZVagOpts = {
    name?: string
    clientId?: string
};

export class ZVag {

    private zwave: OZW;
    private ht: Client;
    private nodes: ZVagNode[] = [];
    private devices: {[name: string]: Device} = {};
    private opts: ZVagOpts;

    constructor(zwave: OZW, hemtjanst: Client, opts?: ZVagOpts) {
        this.zwave = zwave;
        this.ht = hemtjanst;
        this.opts = opts || {};
        if (!this.opts.name) {
            this.opts.name = "zwave";
        }

        for (let cmd of ["node added", "node naming", "node available"]) {
            zwave.on(cmd, (id: number, info: INodeInfo) => {
                this.updateNode(id, info);
            });
        }

        for (let cmd of ["value added", "value changed", "value refreshed"]) {
            zwave.on(cmd, (node: number, cls: number, value: IValue) => {
                if (typeof this.nodes[node] === "undefined") {
                    this.updateNode(node);
                }
                this.nodes[node].updateValue(value);
            });
        }

        zwave.on("node ready", (id, info) => {
            debug(`Node ${id} is ready`);
            this.updateNode(id, info);
            this.nodes[id].onReady();
            this.createDevices();
        });
    }

    private updateNode(id: number, info?: INodeInfo) {
        if (!this.nodes[id]) {
            this.nodes[id] = new ZVagNode(id, info);
        } else {
            this.nodes[id].update(info);
        }
    }

    private mapValue(item, value): string {
        if (item.class_id == 113 && item.index == 9) {
            value = (value == 23 ? '0' : '1');
        }
        return value;
    }


    private createDevices() {

        for (let i in this.nodes) {
            if (this.nodes[i] && this.nodes[i].ready) {
                let node = this.nodes[i];
                let name = this.opts.name + i;
                let type = node.getType();
                if (type === null) {
                    continue;
                }
                let typeStr = utils.typeName(type, DeviceType);
                let topic = typeStr+"/"+name;

                if (typeof this.devices[topic] !== "undefined") {
                    continue;
                }

                let dev = new Device(topic, {
                    name: node.info.name || name,
                    type: type,
                    manufacturer: node.info.manufacturer,
                    model: node.info.product,
                    serialNumber: "Z-Wave Node " + i,
                    lastWillID: this.opts.clientId,
                });

                let features = {};
                let featureMeta = {};
                let featureCnt = 0;

                for (let value of node.getValues()) {
                    let ft = value.feature();
                    if (ft) {
                        debug(`Found feature ${ft.name} in ${topic}`);
                        if (features.hasOwnProperty(ft.name)) {
                            features[ft.name].push(value);
                        } else {
                            features[ft.name] = [value];
                            featureCnt++;
                        }
                        featureMeta[ft.name] = ft.meta;
                    }
                }

                if (type == DeviceType.Outlet && !features['outletInUse']) {
                    features['outletInUse'] = [];
                    featureMeta['outletInUse'] = {};
                }

                if (featureCnt > 0) {
                    for (let ft in features) {
                        if (!features.hasOwnProperty(ft)) continue;
                        let ftName = ft;
                        let meta: FeatureMeta = featureMeta[ft];
                        dev.addFeature(ftName, meta);
                        for (let k in features[ft]) {
                            let value: ZVagValue = features[ft][k];
                            if (value) {
                                dev.onSet(ftName, (d, f, v) => {
                                    debug(`Setting ${topic}/${f} to ${v}`);
                                    value.set(this.zwave, v);
                                });
                            }
                        }
                    }

                    this.ht.AddDevice(dev);
                    this.devices[topic] = dev;

                    for (let ft in features) {
                        if (!features.hasOwnProperty(ft)) continue;
                        for (let k in features[ft]) {
                            let value: ZVagValue = features[ft][k];
                            let ftName = ft;
                            if (value) {
                                value.on('update', (changes: IChange[]) => {
                                    for (let ch of changes) {
                                        if (ch.name !== "value") continue;
                                        let nv = this.mapValue(value, ch.cur);
                                        dev.update(ftName, nv);
                                        debug(`Updating ${topic}/${ftName} from ${ch.old} to ${ch.cur} (${nv})`);
                                    }
                                });
                                let nv = this.mapValue(value, value.value);
                                dev.update(ftName, nv);
                                debug(`Setting ${topic}/${ftName} to ${value.value} (${nv})`);
                            } else if (ft.toLowerCase() == "outletinuse") {
                                dev.update(ftName, 1);
                            }
                        }
                    }
                }


            }
        }

    }

}
