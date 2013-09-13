(function() {

    function clamp(v, min, max) {
        return Math.max(Math.min(v, max), min);
    }

    // See http://tauday.com/
    var TAU = Math.PI * 2;

    function dct_1d(x) {
        var X = [];
        var N = x.length;
        var average;

        // The DC offset is simply the average of all
        // the pixel values.

        average = 0;
        for (var n = 0; n < N; n++)
            average += x[n];
        average /= N;
        X[0] = average;

        // Step through all the frequencies, calculating the coefficients
        // for each one.
        for (var k = 1; k < N; k++) {
            // DCT-II says that the basis functions we use are
            // cosines with increasing 1/4 frequencies.
            var frequency = TAU * (1/4) * k;

            // Step through all the samples, "pulling" out all the coefficients.
            // For a more intuitive explanation of the Fourier transform in general:
            // http://www.altdevblogaday.com/2011/05/17/understanding-the-fourier-transform/
            average = 0;
            for (var n = 0; n < N; n++) {
                var theta = (2*n+1) / N;
                average += x[n] * Math.cos(frequency * theta);
            }
            average /= N;
            X[k] = average;
        }

        return X;
    }

    function idct_1d(X) {
        var N = X.length;
        var x = [];

        // We start with all pixel values having the DC offset.
        for (var n = 0; n < N; n++)
            x[n] = X[0];

        // The rest are frequency coefficients; sum them up one
        // at a time.
        for (var k = 1; k < N; k++) {
            // The coefficient is normalized from 0 to 1. The maximum
            // value needed for any coefficient is 0.5 (which will give
            // us -0.5/+0.5, a 1.0 spread), so divide in two.
            var coef = X[k] / 2.0;

            // DCT-II says that the basis functions we use are
            // cosines with increasing 1/4 frequencies.
            var frequency = TAU * (1/4) * k;

            for (var n = 0; n < N; n++) {
                var theta = (2*n+1) / N;
                x[n] += coef * Math.cos(frequency * theta);
            }
        }

        return x;
    }

    function a8(a) {
        var v = (a * 255) | 0;
        return 'rgb(' + v + ', ' + v + ', ' + v + ')';
    }

    function plot(ctx, values) {
        var pad = 5;
        var width = ctx.canvas.width - pad*2;
        var height = ctx.canvas.height - pad*2;
        var rectWidth = Math.ceil(width / values.length);

        function plotOne(v, i) {
            ctx.beginPath();

            ctx.fillStyle = a8(v);
            ctx.fillRect(rectWidth * i, 0, rectWidth, height);

            ctx.fillStyle = '#ff0000';
            var x = rectWidth * i + rectWidth / 2;
            var y = clamp(1.0 - v, 0, 1) * height;
            ctx.arc(x, y, 2, 0, TAU);
            ctx.fill();
        }

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.save();
        ctx.translate(pad, pad);
        values.forEach(plotOne);
        ctx.restore();
    }

    function linear(x, n) {
        return x / (n - 1);
    }

    function sine(x, n) {
        var t = x / (n - 1) * Math.PI * 2;
        return Math.cos(t) * 0.5 + 0.5;
    }

    function evalF(f, n) {
        var v = [];
        for (var i = 0; i < n; i++)
            v.push(f(i, n));
        return v;
    }

    function createIDCTDemo() {
        var elem = document.createElement("div");
        elem.classList.add("idct-demo");

        var canvasWrapper = document.createElement("div");
        canvasWrapper.classList.add("canvas-wrapper");
        elem.appendChild(canvasWrapper);

        var canvas = document.createElement("canvas");
        canvas.width = 360;
        canvas.height = 60;
        canvasWrapper.appendChild(canvas);

        var ctx = canvas.getContext('2d');

        Tangle.formats.d2 = function(v) {
            return sprintf("%02.2f", v);
        };

        function makeSlider(index) {
            var span = document.createElement("span");
            span.classList.add("TKAdjustableNumber");
            span.classList.add("slider");

            // horrible hack for Tangle not supporting arrays
            span.setAttribute("data-var", "coef_" + index);

            span.setAttribute("data-format", "d2");

            span.setAttribute("data-min", "-1");
            span.setAttribute("data-max", "1");
            span.setAttribute("data-step", "0.01");

            if (index != 0) {
                var html = sprintf(" * cos(%d/4 <i>t</i>)", index);
                span.innerHTML = html;
            }

            return span;
        }

        function plus() {
            var plus = document.createElement("span");
            plus.classList.add("plus");
            plus.innerHTML = ' + ';
            return plus;
        }

        var nCoefs = 32;
        for (var i = 0; i < nCoefs; i++) {
            var span = document.createElement("span");
            span.classList.add("entry");

            var slider = makeSlider(i);
            span.appendChild(slider);
            if (i < nCoefs - 1)
                span.appendChild(plus());

            if (i == 0)
                span.classList.add("dc");
            else
                span.classList.add("freq");

            elem.appendChild(span);
        }

        var tangle = new Tangle(elem, {
            initialize: function() {
                for (var i = 0; i < nCoefs; i++)
                    this['coef_' + i] = 0;
                this.coef_0 = 0.5;
            },
            update: function() {
                var coefs = [];
                for (var i = 0; i < nCoefs; i++)
                    coefs[i] = this['coef_' + i];

                var vals = idct_1d(coefs);
                plot(ctx, vals);
            }
        });

        return elem;
    }

    (function() {
        var elem = createIDCTDemo();
        document.body.appendChild(elem);
    })();

})();
