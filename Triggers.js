const { EventEmitter } = require('events');
const db = require("./db");

function sanitizeName(name) {
    return name.replace(/[^a-zA-Z0-9 ]/g, ''); // Remove any characters that are not letters, numbers, or spaces
}

class Trigger {
    constructor(id, column, row, color, icon, name, actions) {
        this.id = id;
        this.column = column;
        this.row = row;
        this.color = color;
        this.icon = icon;
        this.name = name || "";
        this.actions = actions;
    }

    trigger() {
        triggers.triggerTrigger(this.id)
    }

    toJSON() {
        return {
            id: this.id,
            column: this.column,
            row: this.row,
            color: this.color,
            icon: this.icon,
            name: this.name,
            actions: this.actions
        }
    }
}

class Triggers extends EventEmitter {
    constructor() {
        super();
        this.triggers = {};

        this.on("triggerAdded", (trigger) => {
            console.log("trigger added")
            this.triggers[trigger.id] = new Trigger(trigger.id, trigger.column, trigger.row, trigger.color, trigger.icon, trigger.name, trigger.actions);
            this.emit("show", "addedTrigger", trigger, this.triggers[trigger.id].prev?.id);
        });
        this.on("triggerDeleted", (id) => {
            if (!this.triggers[id]) return;
            delete this.triggers[id];
            this.emit("show", "deletedTrigger", id);
        });
        this.on("triggerNamed", (id, newName)=>{
            if(!this.triggers[id]) return;
            this.triggers[id].name = newName;
            this.emit("show", "triggerNamed", id, newName);
        });
        this.on("actionCreated", (id, action)=> {
            if(!this.triggers[id]) return;
            this.triggers[id].actions.push(action.id);
            this.emit("show", "actionCreated", id, action.id);
        });
        this.on("setTriggers", (triggerList) => {
            triggerList.forEach(trigger => {
                this.triggers[trigger.id] = new Trigger(trigger.id, trigger.column, trigger.row, trigger.color, trigger.icon, trigger.name, trigger.actions);
            });
            this.emit("show", "setTriggers", triggerList);
        });
    }
    triggerTrigger(triggerID) {
        this.emit("sync", "triggerTrigger");
    }
    newTrigger() {
        this.emit("sync", "createNewTrigger");
    }
    deleteTrigger(id) {
        this.emit("sync", "deleteTrigger", id);
    }
    nameTrigger(id, newName) {
        this.emit("sync", "nameTrigger", id, newName);
    }
    createAction(id, options) {
        this.emit("sync", "createAction", id, options);
    }
    getTriggers() {
        return Object.entries(this.triggers).map(([id, trigger])=>{return trigger.toJSON});
    }
}

const triggers = new Triggers();

module.exports = { Triggers: triggers };