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
go
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var WebGLReport = {};

WebGLReport.main = function() {

	//Formats output into a table
	function display(string, data) {
		document.writeln('<tr>');
			document.writeln('<td><b>' + string + '</b></td>');
			if(data) {
				document.writeln('<td>' + data + '</td>');
			}
		document.writeln('</tr>');
	}

    display("Platform: ", navigator.platform);
    display("Broswer User Agent: ", navigator.userAgent);
	
	var contextInfo = WebGLReport.getWebGLSupport();
	if (contextInfo) {
		display("Context Name:", contextInfo.name);
		var gl = contextInfo.gl;
		display("GL Version: ", gl.getParameter(gl.VERSION));
		var shadingLanguageVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
		display("Shading Language Version: ", shadingLanguageVersion);
		var vendor = gl.getParameter(gl.VENDOR);
		display("Vendor: ", vendor);
		var renderer = gl.getParameter(gl.RENDERER);
		display("Renderer: ", renderer);
		
		display("<br/><u>Pixel Depths</u>");		
		var redBits = gl.getParameter(gl.RED_BITS);
		display("Red Bits: ", redBits );
		var greenBits = gl.getParameter(gl.GREEN_BITS);
		display("Green Bits: ", greenBits );
		var blueBits = gl.getParameter(gl.BLUE_BITS);
		display("Blue Bits: ", blueBits );
		var alphaBits = gl.getParameter(gl.ALPHA_BITS);
		display("Alpha Bits: ", alphaBits );
		var depthBits = gl.getParameter(gl.DEPTH_BITS);
		display("Depth Bits: ", depthBits );
		var stencilBits = gl.getParameter(gl.STENCIL_BITS);
		display("Stencil Bits: ", stencilBits || '0');
		
		
		display("<br/><u>Implementation Dependent States</u>");
		var maximumCombinedTextureImageUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS); // min: 8
		display("Max. Combined Texture Image Units: ", maximumCombinedTextureImageUnits);
		var maximumCubeMapTextureSize = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);               // min: 16
		display("Max. Cube Map Texture Size: ", maximumCubeMapTextureSize);
		var maximumFragmentUniformVectors = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);        // min: 16
		display("Max. Fragment Uniform Vectors: ", maximumFragmentUniformVectors);
		var maximumTextureImageUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);                  // min: 8
		display("Max. Texture Image Units: ", maximumTextureImageUnits);
		var maximumTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);                               // min: 64
		display("Max. Texture Size: ", maximumTextureSize);
		var maximumVaryingVectors = gl.getParameter(gl.MAX_VARYING_VECTORS);                         // min: 8
		display("Max. Varying Vectors", maximumVaryingVectors);
		var maximumVertexAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);                        // min: 8
		display("Max. Vertex Attributes", maximumVertexAttributes);
		var maximumVertexTextureImageUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);     // min: 0
		display("Max. Vertex Texture Image Units: ", maximumVertexTextureImageUnits || '0');
		var maximumVertexUniformVectors = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);            // min: 128
		display("Max. Vertex Uniform Vectors", maximumVertexUniformVectors);
		
		
		var aliasedLineWidthRange = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE); // must include 1
		var aliasedLWR = [];
		for(var i = 0; i < aliasedLineWidthRange.length; i++) {
			aliasedLWR.push(aliasedLineWidthRange[i]);
		}
		display("Aliased Line Width Range: ", '[' + aliasedLWR.toString() + ']');
		
		var aliasedPointSizeRange = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE); // must include 1 
		var aliasedPSR = [];
		for(i = 0; i < aliasedPointSizeRange.length; i++) {
			aliasedPSR.push(aliasedPointSizeRange[i]);	
		}
		display("Aliased Line Point Size Range: ", '[' + aliasedPSR.toString() + ']');
		
		var maximumViewportDimensions = gl.getParameter(gl.MAX_VIEWPORT_DIMS);	// includes 2		
		var maxVPDim = [];
		for(i = 0; i < maximumViewportDimensions.length; i++) {
			maxVPDim.push(maximumViewportDimensions[i]);
		}
		display("Max. Viewport Dimensions", '['+ maxVPDim.toString() + ']');
			
		display('<br/><u>Supported Extensions:</u>');			
		var extensions = gl.getSupportedExtensions();
		if(extensions.length > 0) {
			for(i = 0; i < extensions.length; i++) {
				display(extensions[i]);
			}
		}
		else {
			display("No extensions were found.");
		}
		
	}
	else {
		document.writeln('<div class="ErrorMessage">');
		document.writeln('<br/>WebGL is not supported by this browser.<br/>');
		document.writeln('Try installing the latest version of <a href="http://www.mozilla.com/en-US/firefox/fx/">Firefox</a>');
		document.writeln('or <a href="http://www.google.com/chrome">Chrome</a>,<br/>');
		document.writeln('or check out <a href="http://learningwebgl.com/blog/?p=11">Getting Started with WebGL</a>'); 
		document.writeln('at the <a href="http://learningwebgl.com/blog/">Learning WebGL Blog</a>.<br/><br/>');
		document.writeln('</div>');
	}
};

WebGLReport.getWebGLSupport = function() {
	var contextNames = ["webgl", "experimental-webgl"];
	for(var i = 0; i < contextNames.length; i++){
		try{ //Needed for unsupported browsers, otherwise it gets caught up on the next line
			var context = document.getElementById("testCanvas").getContext(contextNames[i]);
			if(context) {
				return {
					name : contextNames[i],
					gl : context
				};
			}
		}
		catch(e) {
		}
	}
	
	return null;
}