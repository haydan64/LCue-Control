const { EventEmitter } = require('events');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./your-database-file.db');

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
