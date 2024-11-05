const { EventEmitter } = require('events');
const db = require("./db")

class Device extends EventEmitter {
    constructor(type, options) {
        this.type = type;
        this.options = options;
    }
}

class OSCDevice extends Device {
    constructor(type, options) {
        super(type, options);
    }
}

class EOSDevice extends OSCDevice {
    constructor(type, options) {
        super(type, options);
    }
}

class DMXDevice extends Device {
    constructor(type, options) {
        super(type, options);
    }
}

class MIDIDevice extends Device {
    constructor(type, options) {
        super(type, options);
    }
}

class WLEDDevice extends Device {
    constructor(type, options) {
        super(type, options);
    }
}

class Devices extends EventEmitter {
    constructor() {
        super();
        this.deviceList = {}; // Store devices here
        
        // Load displays from database
        this.loadDisplays();
    }

    loadDisplays(displays) {
        if(!displays) return;
        this.deviceList = {};
        Object.entries(displays).forEach((display)=>{
            const [id, type, options] = display;
            
        })
        
    }

    getList() {
        return this.deviceList;
    }

    updateDevice(deviceId, newData) {
        const device = this.deviceList[deviceId];
        if (device) {
            Object.assign(device, newData);
            this.emit('deviceUpdated', device);
        }
    }
}

const devices = new Devices();
module.exports = devices;
