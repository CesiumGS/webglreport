/**
Copyright (c) 2011 Analytical Graphics, Inc.

The MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/*jslint browser: true, vars: true, white: true, nomen: true*/
/*global $, _*/
$(function() {
    "use strict";
    var canvas = $("<canvas />", { width: "1", height: "1" }).appendTo("body")[0];
    var gl;
    var contextName = _.find(["webgl", "experimental-webgl"], function(name) {
        try {
            gl = canvas.getContext(name, { stencil: true });
            return !!gl;
        } catch (e) {}
        return false;
    });

    var template = _.template($("#reportTemplate").html());
    var report = [
        ["Platform", navigator.platform],
        ["Browser User Agent", navigator.userAgent]
    ];

    function renderReport(header) {
        _.each(report, function(item) {
            if (item.length > 1 && item[0].length > 0) {
                item[0] += ":";
            }
        });

        $("#output").html(header + template({ report: report }));
    }

    if (!gl) {
        renderReport($("#webglNotSupportedTemplate").html());
        return;
    }

    function describeRange(value) {
        return "[" + value[0] + ", " + value[1] + "]";
    }

    report.push(
        ["Context Name", contextName],
        ["GL Version", gl.getParameter(gl.VERSION)],
        ["Shading Language Version", gl.getParameter(gl.SHADING_LANGUAGE_VERSION)],
        ["Vendor", gl.getParameter(gl.VENDOR)],
        ["Renderer", gl.getParameter(gl.RENDERER)],

        ["Pixel Depths"],
        ["Red Bits", gl.getParameter(gl.RED_BITS)],
        ["Green Bits", gl.getParameter(gl.GREEN_BITS)],
        ["Blue Bits", gl.getParameter(gl.BLUE_BITS)],
        ["Alpha Bits", gl.getParameter(gl.ALPHA_BITS)],
        ["Depth Bits", gl.getParameter(gl.DEPTH_BITS)],
        ["Stencil Bits", gl.getParameter(gl.STENCIL_BITS)],

        ["Implementation Dependent States"],
        ["Max. Render Buffer Size", gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)],
        ["Max. Combined Texture Image Units", gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS)], // min: 8
        ["Max. Cube Map Texture Size", gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE)], // min: 16
        ["Max. Fragment Uniform Vectors", gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS)], // min: 16
        ["Max. Texture Image Units", gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)], // min: 8
        ["Max. Texture Size", gl.getParameter(gl.MAX_TEXTURE_SIZE)], // min: 64
        ["Max. Varying Vectors", gl.getParameter(gl.MAX_VARYING_VECTORS)], // min: 8
        ["Max. Vertex Attributes", gl.getParameter(gl.MAX_VERTEX_ATTRIBS)], // min: 8
        ["Max. Vertex Texture Image Units", gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) || "0"], // min: 0
        ["Max. Vertex Uniform Vectors", gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS)], // min: 128
        ["Aliased Line Width Range", describeRange(gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE))], // must include the value 1
        ["Aliased Point Size Range", describeRange(gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE))], // must include the value 1
        ["Max. Viewport Dimensions", describeRange(gl.getParameter(gl.MAX_VIEWPORT_DIMS))],

        ["Supported Extensions"]
    );

    var extensions = gl.getSupportedExtensions();
    if (extensions.length > 0) {
        report = report.concat(_.map(extensions, function(extension) {
            return ["", extension];
        }));
    } else {
        report.push(
            ["", "No extensions were found."]
        );
    }

    renderReport($("#webglSupportedTemplate").html());
});