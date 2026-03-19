/*
JSNES, based on Jamie Sanders' vNES
Copyright (C) 2010 Ben Firshman

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// Keyboard events are bound in the UI
JSNES.Keyboard = function() {
    var i;
    
    this.keys = {
        KEY_B: 0,
        KEY_A: 1,
        KEY_SELECT: 2,
        KEY_START: 3,
        KEY_UP: 4,
        KEY_DOWN: 5,
        KEY_LEFT: 6,
        KEY_RIGHT: 7
    };

    this.state1 = new Array(8);
    for (i = 0; i < this.state1.length; i++) {
        this.state1[i] = 0x40;
    }
    this.state2 = new Array(8);
    for (i = 0; i < this.state2.length; i++) {
        this.state2[i] = 0x40;
    }
};

JSNES.Keyboard.prototype = {
    setKey: function(key, value) {
        switch (key) {
            // Player1
            case 87: this.state1[this.keys.KEY_UP] = value; break;     // UP: W(87)
            case 83: this.state1[this.keys.KEY_DOWN] = value; break;   // DOWN: S(83)
            case 65: this.state1[this.keys.KEY_LEFT] = value; break;   // LEFT: A(65)
            case 68: this.state1[this.keys.KEY_RIGHT] = value; break;  // RIGHT: D(68)
            case 75: this.state1[this.keys.KEY_B] = value; break;      // B: K(75)
            case 74: this.state1[this.keys.KEY_A] = value; break;      // A: J(74)
            case 32: this.state1[this.keys.KEY_SELECT] = value; break; // SELECT: SPACE(32)
            case 13: this.state1[this.keys.KEY_START] = value; break;  // START: ENTER(13)
            // Player2
            case 38: this.state2[this.keys.KEY_UP] = value; break;     // UP: ↑(38)
            case 40: this.state2[this.keys.KEY_DOWN] = value; break;   // DOWN: ↓(40)
            case 37: this.state2[this.keys.KEY_LEFT] = value; break;   // LEFT: ←(37)
            case 39: this.state2[this.keys.KEY_RIGHT] = value; break;  // RIGHT: →(39)
            case 98: this.state2[this.keys.KEY_B] = value; break;     // B: Num2(98)
            case 97: this.state2[this.keys.KEY_A] = value; break;     // A: Num1(97)
            case 111: this.state2[this.keys.KEY_SELECT] = value; break; // SELECT: NumpadDivide(111)
            case 106: this.state2[this.keys.KEY_START] = value; break;  // START: NumpadMultiply(106)
            default: return true;
        }
        return false; // preventDefault
    },

    keyDown: function(evt) {
        if (!this.setKey(evt.keyCode, 0x41) && evt.preventDefault) {
            evt.preventDefault();
        }
    },
    
    keyUp: function(evt) {
        if (!this.setKey(evt.keyCode, 0x40) && evt.preventDefault) {
            evt.preventDefault();
        }
    },
    
    keyPress: function(evt) {
        evt.preventDefault();
    }
};
