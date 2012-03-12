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
    var report = {
        platform: navigator.platform,
        userAgent: navigator.userAgent
    };

    function getExtensionUrl(extension) {
        //special cases
        if (extension === 'WEBKIT_lose_context') {
            extension = 'WEBGL_lose_context';
        }
        else if (extension === 'WEBKIT_WEBGL_compressed_textures') {
            extension = '';
        }
        extension = extension.replace(/^WEBKIT_/, '');
        extension = extension.replace(/EXT_/, '');

        return 'http://www.khronos.org/registry/webgl/extensions/' + extension;
    }

    function renderReport(header) {
        $("#output").html(header + template({
            report: report,
            getExtensionUrl: getExtensionUrl
         }));
    }

    if (!gl) {
        renderReport($("#webglNotSupportedTemplate").html());
        return;
    }

    function describeRange(value) {
        return "[" + value[0] + ", " + value[1] + "]";
    }

    report = _.extend(report, {
       contextName: contextName,
       glVersion: gl.getParameter(gl.VERSION),
       shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
       vendor: gl.getParameter(gl.VENDOR),
       renderer: gl.getParameter(gl.RENDERER),
       redBits: gl.getParameter(gl.RED_BITS),
       greenBits: gl.getParameter(gl.GREEN_BITS),
       blueBits: gl.getParameter(gl.BLUE_BITS),
       alphaBits: gl.getParameter(gl.ALPHA_BITS),
       depthBits: gl.getParameter(gl.DEPTH_BITS),
       stencilBits: gl.getParameter(gl.STENCIL_BITS),
       maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
       maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS), // min: 8
       maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE), // min: 16
       maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS), // min: 16
       maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS), // min: 8
       maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE), // min: 64
       maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS), // min: 8
       maxVertexAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS), // min: 8
       maxVertexTextureImageUnits: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) || 0, // min: 0
       maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS), // min: 128
       aliasedLineWidthRange: describeRange(gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE)), // must include the value 1
       aliasedPointSizeRange: describeRange(gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)), // must include the value 1
       maxViewportDimensions: describeRange(gl.getParameter(gl.MAX_VIEWPORT_DIMS)),
       extensions: gl.getSupportedExtensions()
    });
//            ["", "No extensions were found."]

    renderReport($("#webglSupportedTemplate").html());
});