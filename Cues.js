const { EventEmitter } = require('events');
const db = require("./db");

function sanitizeName(name) {
    return name.replace(/[^a-zA-Z0-9 ]/g, ''); // Remove any characters that are not letters, numbers, or spaces
}

class Cue {
    constructor(id, position, actions, name) {
        this.id = id;
        this.name = name || "";
        this.position = position;
        this.actions = actions;
        this.next = null;
        this.prev = null;
    }

    trigger() {
        cues.triggerCue(this.id)
    }

    addAction(triggerID) {
        this.actions.push(triggerID); // Update actions in db 
        db.run(`UPDATE cues SET actions = ? WHERE id = ?`,
            [this.actions.join(','), this.id],
            (err) => {
                if (err) { console.error(err.message); }
            }
        );
    }
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            position: this.position,
            actions: this.actions,
            next: this.next?.id || null,
            prev: this.prev?.id || null
        }
    }
}

class Cues extends EventEmitter {
    constructor() {
        super();
        this.cues = {};
        this.current = null;
        this.head = null;
        this.tail = null;

        this.on("cueAdded", (cue) => {
            console.log("cue added")
            this.cues[cue.id] = new Cue(cue.id, cue.position, cue.actions, cue.name);
            this.putCue(this.cues[cue.id], cue.position);
            this.emit("show", "addedCue", cue, this.cues[cue.id].prev?.id);
        });
        this.on("cueDeleted", (id) => {
            if (!this.cues[id]) return;

            const cue = this.cues[id];

            // Remove cue from the linked list
            if (cue.prev) {
                cue.prev.next = cue.next;
            } else {
                // This cue is the head
                this.head = cue.next;
            }

            if (cue.next) {
                cue.next.prev = cue.prev;
            } else {
                // This cue is the tail
                this.tail = cue.prev;
            }
            delete this.cues[id];
            this.emit("show", "deletedCue", id);
        });
        this.on("cueNamed", (id, newName)=>{
            if(!this.cues[id]) return;
            this.cues[id].name = newName;
            this.emit("show", "cueNamed", id, newName);
        })
        this.on("cueMoved", (id, newPosition) => {
            if(!this.cues[id]) return;
            const cue = this.cues[id];

            // Remove cue from the linked list
            if (cue.prev) {
                cue.prev.next = cue.next;
            } else {
                // This cue is the head
                this.head = cue.next;
            }

            if (cue.next) {
                cue.next.prev = cue.prev;
            } else {
                // This cue is the tail
                this.tail = cue.prev;
            }

            cue.next = null;
            cue.prev = null;
            cue.position = newPosition
            console.log(`Cue with ID ${id} moved to new position ${newPosition}.`);

            // Reinsert the cue in the linked list
            this.putCue(cue, newPosition);
            this.emit("show", "cueMoved", id, cue.prev?.id);
        });
        this.on("actionCreated", (id, action)=> {
            if(!this.cues[id]) return;
            this.cues[id].actions.push(action);
            this.emit("show", "actionCreated", id, action);
        });
        this.on("setCues", (cueList) => {
            cueList.forEach(cue => {
                this.cues[cue.id] = new Cue(cue.id, cue.position, cue.actions, cue.name);
                this.putCue(this.cues[cue.id], cue.position);
            });
        });
    }
    putCue(cue, position) {
        if (!this.head) {
            this.head = this.tail = cue;
            return;
        }

        if (this.tail.position < position) {
            this.tail.next = cue;
            cue.prev = this.tail;
            this.tail = cue;
            return;
        }

        if (this.head.position > position) {
            cue.next = this.head;
            this.head.prev = cue;
            this.head = cue;
            return;
        }

        let current = this.head;
        while (current) {
            if (current.position > position) {
                if (current.prev) {
                    current.prev.next = cue;
                    cue.prev = current.prev;
                    current.prev = cue;
                    cue.next = current;
                }
                return;
            }
            current = current.next;
        }
    }
    triggerCue(cueID) {
        this.emit("sync", "triggerCue");
    }
    newCue() {
        this.emit("sync", "createNewCue");
    }
    deleteCue(id) {
        this.emit("sync", "deleteCue", id)
    }
    nameCue(id, newName) {
        this.emit("sync", "nameCue", id, newName);
    }
    moveCue(id, newPosition) {
        let alreadyCue = false;
        this.getCues().forEach((cue) => {
            if (cue.position == newPosition) {
                alreadyCue = true;
            }
        });
        if (alreadyCue) {
            this.emit("show", "alreadyCueAtPos", id, newPosition);
        } else {
            this.emit("sync", "moveCue", id, newPosition);
        }
    }
    createAction(id, options) {
        this.emit("sync", "createAction", id, options);
    }
    getCues(asJSON) {
        let cues = [];
        let current = this.head;
        while (current) {
            cues.push(asJSON ? current.toJSON() : current);
            current = current.next;
        }
        return cues;
    }
}

const cues = new Cues();

module.exports = { Cues: cues };