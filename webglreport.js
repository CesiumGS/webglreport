/**
Copyright (c) 2011-2013 Contributors.

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
/*jshint white: false, nomen: false*/
/*global $, _*/
$(function() {
    "use strict";

    var template = _.template($('#reportTemplate').html());
    var report = {
        platform: navigator.platform,
        userAgent: navigator.userAgent
    };

    if (!window.WebGLRenderingContext) {
        // The browser does not support WebGL
        renderReport($('#webglNotSupportedTemplate').html());
        return;
    }

    var canvas = $('<canvas />', { width: '1', height: '1' }).appendTo('body');
    var gl;
    var contextName = _.find(['webgl', 'experimental-webgl'], function(name) {
        gl = canvas[0].getContext(name, { stencil: true });
        return !!gl;
    });
    canvas.remove();

    if (!gl) {
        // The browser supports WebGL, but initialization failed
        renderReport($('#webglNotEnabledTemplate').html());
        return;
    }

    function getExtensionUrl(extension) {
        //special cases
        if (extension === 'WEBKIT_lose_context') {
            extension = 'WEBGL_lose_context';
        }
        else if (extension === 'WEBKIT_WEBGL_compressed_textures') {
            extension = '';
        }
        extension = extension.replace(/^WEBKIT_/, '');
        extension = extension.replace(/^MOZ_/, '');
        extension = extension.replace(/_EXT_/, '_');

        return 'https://www.khronos.org/registry/webgl/extensions/' + extension;
    }

    function renderReport(header) {
        $('#output').html(header + template({
            report: report,
            getExtensionUrl: getExtensionUrl
        }));
    }

    function describeRange(value) {
        return '[' + value[0] + ', ' + value[1] + ']';
    }

    function getMaxAnisotropy() {
        var e = gl.getExtension('EXT_texture_filter_anisotropic')
                || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic')
                || gl.getExtension('MOZ_EXT_texture_filter_anisotropic');

        if (e) {
            var max = gl.getParameter(e.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
            // See Canary bug: https://code.google.com/p/chromium/issues/detail?id=117450
            if (max === 0) {
                max = 2;
            }
            return max;
        }
        return null;
    }

    function formatPower(exponent, verbose) {
        if (verbose) {
            return '' + Math.pow(2, exponent);
        } else {
            return '2<sup>' + exponent + '</sup>';
        }
    }

    function getPrecisionDescription(precision, verbose) {
        var verbosePart = verbose ? ' bit mantissa' : '';
        return '[-' + formatPower(precision.rangeMin, verbose) + ', ' + formatPower(precision.rangeMax, verbose) + '] (' + precision.precision + verbosePart + ')'
    }

    function getBestFloatPrecision(shaderType) {
        var high = gl.getShaderPrecisionFormat(shaderType, gl.HIGH_FLOAT);
        var medium = gl.getShaderPrecisionFormat(shaderType, gl.MEDIUM_FLOAT);
        var low = gl.getShaderPrecisionFormat(shaderType, gl.LOW_FLOAT);

        var best = high;
        if (high.precision === 0) {
            best = medium;
        }

        return '<span title="High: ' + getPrecisionDescription(high, true) + '\n\nMedium: ' + getPrecisionDescription(medium, true) + '\n\nLow: ' + getPrecisionDescription(low, true) + '">' +
            getPrecisionDescription(best, false) + '</span>';
    }

    function getFloatIntPrecision(gl) {
        var high = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
        var s = (high.precision !== 0) ? 'highp/' : 'mediump/';

        high = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_INT);
        s += (high.rangeMax !== 0) ? 'highp' : 'lowp';

        return s;
    }

    function isPowerOfTwo(n) {
        return (n !== 0) && ((n & (n - 1)) === 0);
    }

    function getAngle(gl) {
        var lineWidthRange = describeRange(gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE));

        // Heuristic: ANGLE is only on Windows, not in IE, and does not implement line width greater than one.
        var angle = (navigator.platform === 'Win32') && 
            (gl.getParameter(gl.RENDERER) !== 'Internet Explorer') && 
            (lineWidthRange === describeRange([1,1]));

        if (angle) {
            // Heuristic: D3D11 backend does not appear to reserve uniforms like the D3D9 backend, e.g.,
            // D3D11 may have 1024 uniforms per stage, but D3D9 has 254 and 221.
            //
            // We could also test for WEBGL_draw_buffers, but many systems do not have it yet
            // due to driver bugs, etc.
            if (isPowerOfTwo(gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS)) && isPowerOfTwo(gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS))) {
                return 'Yes, D3D11';
            } else {
                return 'Yes, D3D9';
            }
        }

        return 'No';
    }

    function getMajorPerformanceCaveat(contextName) {
        // Does context creation fail to do a major performance caveat?
        var canvas = $('<canvas />', { width : '1', height : '1' }).appendTo('body');
        var gl = canvas[0].getContext(contextName, { failIfMajorPerformanceCaveat : true });
        canvas.remove();

        if (!gl) {
            // Our original context creation passed.  This did not.
            return 'Yes';
	}

        if (typeof gl.getContextAttributes().failIfMajorPerformanceCaveat === 'undefined') {
            // If getContextAttributes() doesn't include the failIfMajorPerformanceCaveat
            // property, assume the browser doesn't implement it yet.
            return 'Not implemented';
        }

	return 'No';
    }

    function getDraftExtensions() {
        if (navigator.userAgent.indexOf('Chrome') !== -1) {
            return 'To see draft extensions in Chrome, browse to about:flags, enable the "Enable WebGL Draft Extensions" option, and relaunch.';
	} else if (navigator.userAgent.indexOf('Firefox') !== -1) {
            return 'To see draft extensions in Firefox, browse to about:config and set webgl.enable-draft-extensions to true.';
	}

        return '';
    }

    function getMaxColorBuffers(gl) {
        var maxColorBuffers = 1;
        var ext = gl.getExtension("WEBGL_draw_buffers");
		if (ext != null) 
    		maxColorBuffers = gl.getParameter(ext.MAX_DRAW_BUFFERS_WEBGL);
        
        return maxColorBuffers;
    }

    function getUnmaskedInfo(gl) {
        var unMaskedInfo = {
            renderer: '',
            vendor: ''
        };
        
        var dbgRenderInfo = gl.getExtension("WEBGL_debug_renderer_info");
        if (dbgRenderInfo != null) {
            unMaskedInfo.renderer = gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL);
            unMaskedInfo.vendor   = gl.getParameter(dbgRenderInfo.UNMASKED_VENDOR_WEBGL);
        }
        
        return unMaskedInfo;
    }
    
    report = _.extend(report, {
        contextName: contextName,
        glVersion: gl.getParameter(gl.VERSION),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        unMaskedVendor: getUnmaskedInfo(gl).vendor,
        unMaskedRenderer: getUnmaskedInfo(gl).renderer,
        antialias:  gl.getContextAttributes().antialias ? 'Available' : 'Not available',
        angle: getAngle(gl),
        majorPerformanceCaveat: getMajorPerformanceCaveat(contextName),
        maxColorBuffers: getMaxColorBuffers(gl),
        redBits: gl.getParameter(gl.RED_BITS),
        greenBits: gl.getParameter(gl.GREEN_BITS),
        blueBits: gl.getParameter(gl.BLUE_BITS),
        alphaBits: gl.getParameter(gl.ALPHA_BITS),
        depthBits: gl.getParameter(gl.DEPTH_BITS),
        stencilBits: gl.getParameter(gl.STENCIL_BITS),
        maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
        maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
        maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
        maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
        maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
        maxVertexAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
        maxVertexTextureImageUnits: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
        maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
        aliasedLineWidthRange: describeRange(gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE)),
        aliasedPointSizeRange: describeRange(gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)),
        maxViewportDimensions: describeRange(gl.getParameter(gl.MAX_VIEWPORT_DIMS)),
        maxAnisotropy: getMaxAnisotropy(),
        extensions: gl.getSupportedExtensions(),
        vertexShaderBestPrecision: getBestFloatPrecision(gl.VERTEX_SHADER),
        fragmentShaderBestPrecision: getBestFloatPrecision(gl.FRAGMENT_SHADER),
        fragmentShaderFloatIntPrecision: getFloatIntPrecision(gl),
        draftExtensions: getDraftExtensions()
    });

    if (window.externalHost) {
        // Tab is running with Chrome Frame
        renderReport($('#webglSupportedChromeFrameTemplate').html());
    }
    else {
        renderReport($('#webglSupportedTemplate').html());
    }

    var pipeline = $('.pipeline')
    var background = $('.background')[0];

    background.width = pipeline.width();
    background.height = pipeline.height();

    var hasVertexTextureUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) > 0;

    var context = background.getContext('2d');
    context.shadowOffsetX = 3;
    context.shadowOffsetY = 3;
    context.shadowBlur = 7;
    context.shadowColor = 'rgba(0, 0, 0, 0.5)';
    context.strokeStyle = 'black';

    var boxPadding = 4;

    function drawBox(element, fill) {
        var pos = element.position();
        var x = pos.left - boxPadding;
        var y = pos.top - boxPadding;
        var width = element.outerWidth() + (boxPadding * 2);
        var height = element.outerHeight() + (boxPadding * 2);
        var radius = 10;

        context.fillStyle = fill;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(x + radius, y);
        context.lineTo(x + width - radius, y);
        context.quadraticCurveTo(x + width, y, x + width, y + radius);
        context.lineTo(x + width, y + height - radius);
        context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        context.lineTo(x + radius, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height - radius);
        context.lineTo(x, y + radius);
        context.quadraticCurveTo(x, y, x + radius, y);
        context.closePath();
        context.stroke();
        context.fill();

        return { x: x, y: y, width: width, height: height };
    }

    function drawLeftHead(x, y) {
        context.beginPath();
        context.moveTo(x + 5, y + 15);
        context.lineTo(x - 10, y);
        context.lineTo(x + 5, y - 15);
        context.quadraticCurveTo(x, y, x + 5, y + 15);
        context.fill();
    }

    function drawDownHead(x, y) {
        context.beginPath();
        context.moveTo(x + 15, y - 5);
        context.lineTo(x, y + 10);
        context.lineTo(x - 15, y - 5);
        context.quadraticCurveTo(x, y, x + 15, y - 5);
        context.fill();
    }

    function drawDownArrow(topBox, bottomBox) {
        context.beginPath();

        var arrowTopX = (topBox.x + topBox.width) / 2;
        var arrowTopY = topBox.y + topBox.height;
        var arrowBottomX = (bottomBox.x + bottomBox.width) / 2;
        var arrowBottomY = bottomBox.y - 15;
        context.moveTo(arrowTopX, arrowTopY);
        context.lineTo(arrowBottomX, arrowBottomY);
        context.stroke();

        drawDownHead(arrowBottomX, arrowBottomY);
    }

    var vertexShaderBox = drawBox($('.vertexShader'), '#ff6700');
    var rasterizerBox = drawBox($('.rasterizer'), '#3130cb');
    var fragmentShaderBox = drawBox($('.fragmentShader'), '#ff6700');
    var framebufferBox = drawBox($('.framebuffer'), '#7c177e');
    var texturesBox = drawBox($('.textures'), '#3130cb');

    var arrowRightX = texturesBox.x;
    var arrowRightY = texturesBox.y + (texturesBox.height / 2);
    var arrowMidX = (texturesBox.x + vertexShaderBox.x + vertexShaderBox.width) / 2;
    var arrowMidY = arrowRightY;
    var arrowTopMidY = vertexShaderBox.y + (vertexShaderBox.height / 2);
    var arrowBottomMidY = fragmentShaderBox.y + (fragmentShaderBox.height / 2);
    var arrowTopLeftX = vertexShaderBox.x + vertexShaderBox.width + 15;
    var arrowTopLeftY = arrowTopMidY;
    var arrowBottomLeftX = fragmentShaderBox.x + fragmentShaderBox.width + 15;
    var arrowBottomLeftY = arrowBottomMidY;

	if (hasVertexTextureUnits) {
	    context.fillStyle = context.strokeStyle = 'black';
	    context.lineWidth = 10;
	} else {
		context.fillStyle = context.strokeStyle = '#FFF';
	    context.shadowColor = '#000';
		context.shadowOffsetX = context.shadowOffsetY = 0;
	    context.lineWidth = 8;
	}

	context.beginPath();
	context.moveTo(arrowMidX, arrowMidY);
	context.lineTo(arrowMidX, arrowTopMidY);
	if (hasVertexTextureUnits) {
		context.lineTo(arrowTopLeftX, arrowTopMidY);
		context.stroke();
		drawLeftHead(arrowTopLeftX, arrowTopLeftY);
	} else {
		context.stroke();
	    context.shadowColor = '#000';
		context.font = 'bold 14pt arial, Sans-Serif';
		context.fillText('No vertex textures available.', arrowMidX - 8, arrowTopMidY - 8);
	}

    context.lineWidth = 10;
    context.fillStyle = context.strokeStyle = 'black';
    context.shadowColor = 'rgba(0, 0, 0, 0.5)';
	context.shadowOffsetX = context.shadowOffsetY = 3;
    context.beginPath();

    context.moveTo(arrowRightX, arrowRightY);

    context.lineTo(arrowMidX - context.lineWidth * 0.5, arrowMidY);
	context.moveTo(arrowMidX, arrowMidY);
    context.lineTo(arrowMidX, arrowBottomMidY);
    context.lineTo(arrowBottomLeftX, arrowBottomLeftY);

    context.stroke();

    drawLeftHead(arrowBottomLeftX, arrowBottomLeftY);

    drawDownArrow(vertexShaderBox, rasterizerBox);
    drawDownArrow(rasterizerBox, fragmentShaderBox);
    drawDownArrow(fragmentShaderBox, framebufferBox);
});
