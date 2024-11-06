const { EventEmitter } = require('events');
const db = require("./db");

function sanitizeName(name) {
    return name.replace(/[^a-zA-Z0-9 ]/g, ''); // Remove any characters that are not letters, numbers, or spaces
}

class Cues extends EventEmitter {
    constructor() {
        super();
        this.cues = {};
    }
}

const cues = new Cues();

module.exports = { Cues: cues };