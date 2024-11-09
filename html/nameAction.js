window.NameAction = function (action) {
    console.log("Name Action", action)
    const options = action.options;
    let name = `${action.id} - ${options.type}`;
    switch (options.type) {
        case ("trigger"): {
            name = `Trigger ${options.trigger.id}`
            break;
        }
        case ("display"): {
            name = `${({
                "cut": "Cut",
                "fade": "Fade",
                "slideUp": "Slide Up",
                "slideDown": "Slide Down",
                "slideLeft": "Slide Left",
                "slideRight": "Slide Right",
                "wipeUp": "Wipe Up",
                "wipeDown": "Wipe Down",
                "wipeLeft": "Wipe Left",
                "wipeRight": "Wipe Right",
                "dipToBlack": "Dip To Black",
                "dipToWhite": "Dip To White",
                "Iris": "Iris",
                "zoomIn": "Zoom In",
                "rippleFade": "Ripple Fade",
            })[options.display.transition]} To ${options.action === 'file' ?
                `File ${options.display.file}` :
                `Playlist ${options.playlist}`}`
            break;
        }
        case ("eos"): {
            switch (options.eos.action) {
                case ("nextCue"): {
                    name = "EOS Next Cue";
                    break;
                }
                case ("gotoCue"): {
                    name = "EOS Goto Cue " + options.eos.cue;
                    break;
                }
                case ("prevCue"): {
                    name = "EOS Prev CUe";
                    break;
                }
                case ("submaster"): {
                    name = "EOS Submaster";
                    break;
                }
                case ("recallPreset"): {
                    name = "EOS Recall Preset";
                    break;
                }
                case ("buttonPress"): {
                    name = "EOS Press Button";
                    break;
                }
                case ("OSC"): {
                    name = "EOS Custom OSC Message";
                    break;
                }
            }
        }
    }
}