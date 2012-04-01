(function (global) {

    /**
     * // frames and timingFn are optional
     * var set = createKeyframeSet(from, to, frames, timingFn);
     * var css = createKeyframeCSS(set);
     *
     * var set = createKeyframeSet(
     *   {left: 200, top: 100},
     *   {left: 500, top: 500},
     * );
     * var css = createKeyframeCSS(set);
     *
     * var set = createKeyframeSet(
     *   {left: 200, top: 100},
     *   {left: 500, top: 500},
     *   500, // optional number of frames
     *   Timing.Elastic.EaseInOut // optional timing function
     * );
     * var css = createKeyframeCSS(set);
     */

    var parseKeyframe = function (frame)
    {
        var parsed = {};
        for (var property in frame){
            parsed[property] = parseCSSValue(frame[property])
        }
        return parsed;
    };

    var createKeyframe = function (from, to, progress, timingFn)
    {
        var keyframe = {};
        for (var property in to){
            var percent = timingFn(progress);
            var fromKey = from[property];
            var toKey = to[property];
            var amount = interpolate(fromKey.amount, toKey.amount, percent);
            var units = (toKey.units || '');
            var simple = amount + units;
            keyframe[property] = toKey.fn ? toKey.fn+'('+simple+')' : simple;
        }

        return keyframe;
    };

    var parseCSSValue = function (value)
    {
        var regexSimple = /^([\-\d\.]+)([a-z%]+)?$/i;
        var regexHasFn = /^(\w+)\((.*)\)$/i;
        // regexHasFn = /(\w+)\(([^\)]+)\)/i; // capture function args
        var processSimpleCSS = function (value, result)
        {
            if (!result) result = {};
            var parts = value.toString().match(regexSimple)
            result.amount = parseFloat(parts && parts[1]);
            result.units = parts && parts[2];

            return result;
        };

        var parsed = {};
        if (regexSimple.test(value)){
            processSimpleCSS(value, parsed)
        }
        else if (regexHasFn.test(value)){
            parts = value.toString().match(regexHasFn);
            parsed.fn = parts && parts[1]
            processSimpleCSS(parts[2], parsed);
        }

        return parsed;
    };

    var interpolate = function (from, to, percent, timingFn)
    {
        if (!from) from = 0;
        if (!to) to = 0;
        if (timingFn) percent = timingFn(percent);

        return (from + (to - from) * percent).toFixed(6);
    };


    function KeyframeSet(from, to, frames, timingFn)
    {
        if (! frames) frames = 100;
        if (! timingFn) timingFn = function (pos) { return pos; };

        this.keyframes = {};

        var parsed = {from: {}, to: {}};
        for (var property in to){
            parsed.from[property] = parseCSSValue(from[property])
            parsed.to[property] = parseCSSValue(to[property])
        }

        var progress = 0, increment = 1/frames;
        for(; progress <= 1; progress += increment) {
            this.keyframes[progress] = createKeyframe(parsed.from, parsed.to, progress, timingFn);
        }

        if (! ('1' in this.keyframes)){
            this.keyframes['1'] = createKeyframe(parsed.from, parsed.to, 1, timingFn)
        }

    };

    KeyframeSet.prototype.toCSS = KeyframeSet.prototype.toString = function (name)
    {
        if (!name) name = 'animation_'+(+new Date)
        var rules = [];

        for (var selector in this.keyframes)
        {
            var frame = this.keyframes[selector];
            var rule = selector*100+'% {';

            for (var prop in frame){
                rule += prop+': '+frame[prop]+';';
            }
            rule += "}";
            rules.push(rule);
        }

        return '@-webkit-keyframes '+name+' { '+rules.join(' ')+ " }";
    };

    var Timing = KeyframeSet.Timing = {
        Linear: {},
        Quadratic: {},
        Cubic: {},
        Quartic: {},
        Quintic: {},
        Sinusoidal: {},
        Exponential: {},
        Circular: {},
        Elastic: {},
        Back: {},
        Bounce: {},
        Swing: {}
    };

    // From https://raw.github.com/sole/tween.js/0cc68f1c7c4a4a8ce4dd0c89cbeb31d464bace0d/src/Tween.js
    /**
     * @author sole / http://soledadpenades.com
     * @author mr.doob / http://mrdoob.com
     * @author Robert Eisele / http://www.xarg.org
     * @author Philippe / http://philippe.elsass.me
     * @author Robert Penner / http://www.robertpenner.com/easing_terms_of_use.html
     */
    Timing.Linear.EaseNone = function (pos) {
        return pos;
    };

    Timing.Quadratic.EaseIn = function (pos) {
        return pos * pos;
    };

    Timing.Quadratic.EaseOut = function (pos) {
        return - pos * ( pos - 2 );
    };

    Timing.Quadratic.EaseInOut = function (pos) {
        if ( ( pos *= 2 ) < 1 ) return 0.5 * pos * pos;
        return - 0.5 * ( --pos * ( pos - 2 ) - 1 );
    };

    Timing.Cubic.EaseIn = function (pos) {
        return pos * pos * pos;
    };

    Timing.Cubic.EaseOut = function (pos) {
        return --pos * pos * pos + 1;
    };

    Timing.Cubic.EaseInOut = function (pos) {
        if ( ( pos *= 2 ) < 1 ) return 0.5 * pos * pos * pos;
        return 0.5 * ( ( pos -= 2 ) * pos * pos + 2 );
    };

    Timing.Quartic.EaseIn = function (pos) {
        return pos * pos * pos * pos;
    };

    Timing.Quartic.EaseOut = function (pos) {
        return - ( --pos * pos * pos * pos - 1 );
    }

    Timing.Quartic.EaseInOut = function (pos) {
        if ( ( pos *= 2 ) < 1) return 0.5 * pos * pos * pos * pos;
        return - 0.5 * ( ( pos -= 2 ) * pos * pos * pos - 2 );
    };

    Timing.Quintic.EaseIn = function (pos) {
        return pos * pos * pos * pos * pos;
    };

    Timing.Quintic.EaseOut = function (pos) {
        return ( pos = pos - 1 ) * pos * pos * pos * pos + 1;
    };

    Timing.Quintic.EaseInOut = function (pos) {
        if ( ( pos *= 2 ) < 1 ) return 0.5 * pos * pos * pos * pos * pos;
        return 0.5 * ( ( pos -= 2 ) * pos * pos * pos * pos + 2 );
    };

    Timing.Sinusoidal.EaseIn = function (pos) {
        return - Math.cos( pos * Math.PI / 2 ) + 1;
    };

    Timing.Sinusoidal.EaseOut = function (pos) {
        return Math.sin( pos * Math.PI / 2 );
    };

    Timing.Sinusoidal.EaseInOut = function (pos) {
        return - 0.5 * ( Math.cos( Math.PI * pos ) - 1 );
    };

    Timing.Exponential.EaseIn = function (pos) {
        return pos == 0 ? 0 : Math.pow( 2, 10 * ( pos - 1 ) );
    };

    Timing.Exponential.EaseOut = function (pos) {
        return pos == 1 ? 1 : - Math.pow( 2, - 10 * pos ) + 1;
    };

    Timing.Exponential.EaseInOut = function (pos) {
        if ( pos == 0 ) return 0;
        if ( pos == 1 ) return 1;
        if ( ( pos *= 2 ) < 1 ) return 0.5 * Math.pow( 2, 10 * ( pos - 1 ) );
        return 0.5 * ( - Math.pow( 2, - 10 * ( pos - 1 ) ) + 2 );
    };

    Timing.Circular.EaseIn = function (pos) {
        return - ( Math.sqrt( 1 - pos * pos ) - 1);
    };

    Timing.Circular.EaseOut = function (pos) {
        return Math.sqrt( 1 - --pos * pos );
    };

    Timing.Circular.EaseInOut = function (pos) {
        if ( ( pos /= 0.5 ) < 1) return - 0.5 * ( Math.sqrt( 1 - pos * pos) - 1);
        return 0.5 * ( Math.sqrt( 1 - ( pos -= 2) * pos) + 1);
    };

    Timing.Elastic.EaseIn = function(pos) {
        var s, a = 0.1, p = 0.4;
        if ( pos == 0 ) return 0; if ( pos == 1 ) return 1; if ( !p ) p = 0.3;
        if ( !a || a < 1 ) { a = 1; s = p / 4; }
        else s = p / ( 2 * Math.PI ) * Math.asin( 1 / a );
        return - ( a * Math.pow( 2, 10 * ( pos -= 1 ) ) * Math.sin( ( pos - s ) * ( 2 * Math.PI ) / p ) );
    };

    Timing.Elastic.EaseOut = function(pos) {
        var s, a = 0.1, p = 0.4;
        if ( pos == 0 ) return 0; if ( pos == 1 ) return 1; if ( !p ) p = 0.3;
        if ( !a || a < 1 ) { a = 1; s = p / 4; }
        else s = p / ( 2 * Math.PI ) * Math.asin( 1 / a );
        return ( a * Math.pow( 2, - 10 * pos) * Math.sin( ( pos - s ) * ( 2 * Math.PI ) / p ) + 1 );
    };

    Timing.Elastic.EaseInOut = function(pos) {
        var s, a = 0.1, p = 0.4;
        if ( pos == 0 ) return 0; if ( pos == 1 ) return 1; if ( !p ) p = 0.3;
        if ( !a || a < 1 ) { a = 1; s = p / 4; }
        else s = p / ( 2 * Math.PI ) * Math.asin( 1 / a );
        if ( ( pos *= 2 ) < 1 ) return - 0.5 * ( a * Math.pow( 2, 10 * ( pos -= 1 ) ) * Math.sin( ( pos - s ) * ( 2 * Math.PI ) / p ) );
        return a * Math.pow( 2, -10 * ( pos -= 1 ) ) * Math.sin( ( pos - s ) * ( 2 * Math.PI ) / p ) * 0.5 + 1;
    };

    Timing.Back.EaseIn = function(pos) {
        var s = 1.70158;
        return pos * pos * ( ( s + 1 ) * pos - s );
    };

    Timing.Back.EaseOut = function(pos) {
        var s = 1.70158;
        return ( pos = pos - 1 ) * pos * ( ( s + 1 ) * pos + s ) + 1;
    };

    Timing.Back.EaseInOut = function(pos) {
        var s = 1.70158 * 1.525;
        if ( ( pos *= 2 ) < 1 ) return 0.5 * ( pos * pos * ( ( s + 1 ) * pos - s ) );
        return 0.5 * ( ( pos -= 2 ) * pos * ( ( s + 1 ) * pos + s ) + 2 );
    };

    Timing.Bounce.EaseIn = function(pos) {
        return 1 - Timing.Bounce.EaseOut( 1 - pos );
    };

    Timing.Bounce.EaseOut = function(pos){
        if ( ( pos /= 1 ) < ( 1 / 2.75 ) ) {
            return 7.5625 * pos * pos;
        } else if ( pos < ( 2 / 2.75 ) ) {
            return 7.5625 * ( pos -= ( 1.5 / 2.75 ) ) * pos + 0.75;
        } else if ( pos < ( 2.5 / 2.75 ) ) {
            return 7.5625 * ( pos -= ( 2.25 / 2.75 ) ) * pos + 0.9375;
        } else {
            return 7.5625 * ( pos -= ( 2.625 / 2.75 ) ) * pos + 0.984375;
        }
    };

    Timing.Bounce.EaseInOut = function(pos) {
        if ( pos < 0.5 ) return Timing.Bounce.EaseIn( pos * 2 ) * 0.5;
        return Timing.Bounce.EaseOut( pos * 2 - 1 ) * 0.5 + 0.5;
    };

    // From https://raw.github.com/jeremyckahn/shifty/master/src/shifty.formulas.js
    /**
       Shifty Easing Formulas
       Adapted for Shifty by Jeremy Kahn - jeremyckahn@gmail.com
       v0.1.0

       ================================
       All equations are adapted from Thomas Fuchs' Scripty2: https://raw.github.com/madrobby/scripty2/master/src/effects/transitions/penner.js
       Based on Easing Equations (c) 2003 Robert Penner, all rights reserved. (http://www.robertpenner.com/)
       This work is subject to the terms in http://www.robertpenner.com/easing_terms_of_use.html
       ================================

       For instructions on how to use Shifty, please consult the README: https://github.com/jeremyckahn/shifty/blob/master/README.md

       MIT Lincense.  This code free to use, modify, distribute and enjoy.

    */
    Timing.Bounce.Past = function(pos) {
        if (pos < (1/2.75)) {
            return (7.5625*pos*pos);
        } else if (pos < (2/2.75)) {
            return 2 - (7.5625*(pos-=(1.5/2.75))*pos + .75);
        } else if (pos < (2.5/2.75)) {
            return 2 - (7.5625*(pos-=(2.25/2.75))*pos + .9375);
        } else {
            return 2 - (7.5625*(pos-=(2.625/2.75))*pos + .984375);
        }
    };

    Timing.Swing.FromTo = function(pos) {
        var s = 1.70158;
        return ((pos/=0.5) < 1) ? 0.5*(pos*pos*(((s*=(1.525))+1)*pos - s)) :
            0.5*((pos-=2)*pos*(((s*=(1.525))+1)*pos + s) + 2);
    };

    Timing.Swing.From = function(pos) {
        var s = 1.70158;
        return pos*pos*((s+1)*pos - s);
    };

    Timing.Swing.To = function(pos) {
        var s = 1.70158;
        return (pos-=1)*pos*((s+1)*pos + s) + 1;
    };


    /*!
     * expose.js
     *
     * @author Oleg Slobodskoi
     * @website https://github.com/kof/expose.js
     * @licence Dual licensed under the MIT or GPL Version 2 licenses.
     */
    /** @ignore */
    function expose(namespace, api)
    {
        var env = {};

        if (typeof namespace !== 'string') {
            api = namespace;
            namespace = null;
        }

        // the global api of any environment
        // thanks to Nicholas C. Zakas
        // http://www.nczonline.net/blog/2008/04/20/get-the-javascript-global/
        env.global = (function (){
            return this;
        }).call(null);

        // expose passed api as exports
        env.exports = api || {};

        // commonjs
        if (typeof module !== 'undefined' &&
            typeof exports !== 'undefined' &&
            module.exports) {
            env.commonjs = true;
            env.module = module;
            module.exports = exports = env.exports;
        }

        // browser only
        if (typeof window !== 'undefined') {
            env.browser = true;
            // we are not in amd wrapper
            if (!env.commonjs && namespace && env.exports) {
                env.global[namespace] = env.exports;
            }
        }

        return env;
    }

    expose('KeyframeSet', KeyframeSet);
})(this);
