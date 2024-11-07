const { EventEmitter } = require('events');

class Actions extends EventEmitter {
    constructor() {
        super();
        this.actions = {};
        this.on("setActions", (actions)=> {
            this.actions = {};
            actions.forEach((action)=> {
                this.actions[action.id] = action;
            })
        })
        this.on("addAction", (action)=>{
            this.actions[action.id] = action;
        });
    }
    triggerAction(action) {
        this.emit("sync", "triggerAction", action);
    }
    getActions() {
        return this.actions;
    }
}

const actions = new Actions();

module.exports = { Actions: actions };