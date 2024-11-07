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
        this.on("actionEdited", (id, options) => {
            this.actions[id].options = options;
            this.actions[id].type = options.type;
            this.emit("show", "actionEdited", id, options);
        });
    }
    editAction(id, options) {
        this.emit("sync", "editAction", id, options);
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