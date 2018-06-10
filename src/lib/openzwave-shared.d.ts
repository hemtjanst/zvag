declare type IOzwOpts = {
    Logging?: boolean,
    ConsoleOutput?: boolean
}

declare type IHomeId = number;
declare type INodeId = number;
declare type IClassId = number;
declare type IInstance = number;
declare type IIndex = number;
declare type ISceneId = number;
declare type IValueId = {
    node_id: INodeId
    class_id: IClassId
    instance: IInstance
    index: IIndex
};

declare type INodeInfo = {
    manufacturer?: string
    manufacturerid?: string
    product?: string
    producttype?: string
    productid?: string
    type?: string
    name?: string
    loc?: string
    [n: string]: any
};

declare type IValue = {
    node_id?: INodeId
    class_id?: IClassId
    instance?: IInstance
    index?: IIndex
    value_id?: string
    type?: string
    genre?: string
    label?: string
    units?: string
    help?: string
    read_only?: boolean
    write_only?: boolean
    min?: number
    max?: number
    is_polled?: boolean
    value?: string|number
    [n: string]: any
};

export class OZW {
    [name:string]: any;

    constructor(opts?: IOzwOpts)

    /**
     * Connect to a device
     * @param {string} device Serial device. e.g., /dev/ttyUSB0
     */
    connect(device: string)

    /**
     * Disconnect from a device
     * @param {string} device
     */
    disconnect(device: string)

    /**
     * Set a value
     * @param {INodeId} node_id
     * @param {IClassId} class_id
     * @param {IInstance} instance
     * @param {IIndex} index
     * @param value
     */
    setValue(node_id: INodeId|IValueId, class_id: IClassId|any, instance?: IInstance, index?: IIndex, value?: any)


    /**
     * Turn a binary switch on
     * @param {number} node_id
     */
    setNodeOn(node_id: INodeId)

    /**
     * Turn a binary switch off
     * @param {INodeId} node_id
     */
    setNodeOff(node_id: INodeId)

    /**
     * Set level for a node, for example dimming of lights
     * @param {number} node_id
     * @param {number} level Dim percentage
     */
    setLevel(node_id: INodeId, level: number)

    /**
     * Set location string
     * @param {INodeId} node_id
     * @param {string} location
     */
    setNodeLocation(node_id: INodeId, location: string)

    /**
     * Set node name
     * @param {INodeId} node_id
     * @param {string} name
     */
    setNodeName(node_id: INodeId, name: string)


    /**
     * The OpenZWave driver has initialised and scanning has started.
     * Returns a unique homeid which identifies this particular ZWave network.
     * @param {"driver ready"} ev
     * @param {(homeid: number) => any} cb
     */
    on(ev: 'driver ready', cb: (homeid: IHomeId) => any)

    /**
     * The OpenZWave driver failed to initialise.
     * @param {"driver failed"} ev
     * @param {() => any} cb
     */
    on(ev: 'driver failed', cb: () => any)

    /**
     * The initial network scan has finished.
     * @param {"scan complete"} ev
     * @param {() => any} cb
     */
    on(ev: 'scan complete', cb: () => any)

    /**
     * A new node has been found on the network.
     * At this point you can allocate resources to hold information about this node.
     * @param {"node added"} ev
     * @param {(nodeid: iNodeId) => any} cb
     */
    on(ev: 'node added', cb: (nodeid: INodeId) => any)

    /**
     * A node with the provided id has been just been removed from the network.
     * You need to deallocate all resources for this nodeid.
     * @param {"node removed"} ev
     * @param {(nodeid: iNodeId) => any} cb
     */
    on(ev: 'node removed', cb: (nodeid: INodeId) => any)

    /**
     * Useful information about the node is returned as a plain JS object.
     * It includes elements like 'manufacturer', 'product', 'type' and 'name' amongst others.
     * @param {"node naming"} ev
     * @param {(nodeid: iNodeId, nodeinfo: iNodeInfo) => any} cb
     */
    on(ev: 'node naming', cb: (nodeid: INodeId, nodeinfo: INodeInfo) => any)

    /**
     * This corresponds to OpenZWave's EssentialNodeQueriesComplete notification,
     * which means that the node is now available for operation,
     * but don't expect all of its info structures (nodeinfo, see below) to be filled in.
     * @param {"node available"} ev
     * @param {(nodeid: iNodeId, nodeinfo: iNodeInfo) => any} cb
     */
    on(ev: 'node available', cb: (nodeid: INodeId, nodeinfo: INodeInfo) => any)

    /**
     * This corresponds to OpenZWave's NodeQueriesComplete notification.
     * The node is now ready for operation, and information about the node is available in the nodeinfo object
     * @param {"node ready"} ev
     * @param {(nodeid: iNodeId, nodeinfo: iNodeInfo) => any} cb
     */
    on(ev: 'node ready', cb: (nodeid: INodeId, nodeinfo: INodeInfo) => any)

    /**
     * Polling for a node has been enabled
     * @param {"polling enabled"} ev
     * @param {(nodeid: iNodeId) => any} cb
     */
    on(ev: 'polling enabled', cb: (nodeid: INodeId) => any)

    /**
     * Polling for a node has been disabled
     * @param {"polling disabled"} ev
     * @param {(nodeid: iNodeId) => any} cb
     */
    on(ev: 'polling disabled', cb: (nodeid: INodeId) => any)

    /**
     * This is fired when a scene event is received by the controller.
     * @param {"scene event"} ev
     * @param {(nodeid: iNodeId, sceneId: iSceneId) => any} cb
     */
    on(ev: 'scene event', cb: (nodeid: INodeId, sceneId: ISceneId) => any)

    /**
     * This event gets called when a Basic set command is received by the controller.
     * This might indicate that the node has changed (eg due to manual operation using the local button or switch) or
     * that a sensor device was triggered. As an example, an Aeon Labs Water sensor will fire this event and data would
     * be 255 when water is detected and 0 when it isn't.
     * @param {"node event"} ev
     * @param {(nodeid: iNodeId, data: any) => any} cb
     */
    on(ev: 'node event', cb: (nodeid: INodeId, data: any) => any)

    /**
     * A new ValueID has been discovered. ValueIDs are associated with a particular node, and are the parts of the
     * device you can monitor or control. Please see the official OpenZWave docs on ValueIDs for more details.
     * @param {"value added"} ev
     * @param {(nodeid: iNodeId, commandclass: iClassId, valueId: iValue) => any} cb
     */
    on(ev: 'value added', cb: (nodeid: INodeId, commandclass: IClassId, value: IValue) => any)

    /**
     * A value has changed. Use this to keep track of value state across the network. When values are first discovered,
     * the module enables polling on those values so that we will receive change messages. Prior to the 'node ready'
     * event, there may be 'value changed' events even when no values were actually changed.
     * @param {"value changed"} ev
     * @param {(nodeid: iNodeId, commandclass: iClassId, valueId: iValue) => any} cb
     */
    on(ev: 'value changed', cb: (nodeid: INodeId, commandclass: IClassId, value: IValue) => any)

    /**
     * A node value has been updated from the Z-Wave network. Unlike 'value changed' which implies an actual change of
     * state, this one simply means that the value has been refreshed from the device.
     * @param {"value refreshed"} ev
     * @param {(nodeid: iNodeId, commandclass: iClassId, valueId: iValueId) => any} cb
     */
    on(ev: 'value refreshed', cb: (nodeid: INodeId, commandclass: IClassId, value: IValue) => any)

    /**
     * A value has been removed. Your program should then remove any references to that ValueID.
     * @param {"value removed"} ev
     * @param {(nodeid: iNodeId, commandclass: iClassId, valueId: iValueId) => any} cb
     */
    on(ev: 'value removed', cb: (nodeid: INodeId, commandclass: IClassId, valueId: IValueId) => any)

    /**
     * The ZWave Controller is reporting the result of the currently active command.
     * Check out official OpenZWave documentation on ControllerState and ControllerError
     * so for instance, controller state #7 (remember: 0-based arrays) is ControllerState_Completed which is the
     * result you should expect from successful controller command completion. A help string is also passed for
     * display purposes.
     * @param {"controller command"} ev
     * @param {(nodeid: iNodeId, ctrlState: any, ctrlError: any, helpmsg: string) => any} cb
     */
    on(ev: 'controller command', cb: (nodeid: INodeId, ctrlState: any, ctrlError: any, helpmsg: string) => any)

    /**
     * Fallback
     */
    on(ev: string, cb: any)
}
