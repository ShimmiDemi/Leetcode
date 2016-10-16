function main()
{

	var canvas = document.getElementById("canvas1");
	var gl = canvas.getContext("webgl");
	gl.clearColor(0.0, 0.0, 1.0, 0.0);                      // Set clear color to black, fully opaque
	
	// What to render

	var positionCoordinates = Teapot.coordinates;	
	var normals=Teapot.normals;
	var tangents=Teapot.tangents;
	var texCoords=Teapot.texCoords;
	var indices=Teapot.indices;

	var positionBuffer  = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);  
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionCoordinates), gl.STATIC_DRAW);

	var normalBuffer  = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer );  
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

	var tangentBuffer  = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, tangentBuffer );  
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tangents), gl.STATIC_DRAW);


	var texCoordBuffer  = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer );  
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

	var indicesBuffer  = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indicesBuffer );  
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	indicesBuffer.numItems=indices.length;
	
	// How to Draw
	
	var vShaderCode = [
		"attribute vec3 aVertexPosition;",
		"attribute vec3 aVertexNormal;",
		"attribute vec3 aVertexTangent;",
		"attribute vec2 aVertexTexCoord;",		


		"uniform mat4 uMVMatrix;",
		"uniform mat4 uPMatrix;",
		"uniform mat4 uNMatrix;",
		
		"varying vec3 vTransformedNormal;",
		"varying vec3 vTransformedTangent;",
		"varying vec2 vTexCoord;",
		"varying vec4 vPosition;",
		
		"void main(void) {",
		"   vPosition= uMVMatrix * vec4(aVertexPosition,1.0);",
		"   vTransformedNormal = (uMVMatrix *vec4( aVertexNormal,0.0)).xyz;",
		"   vTransformedTangent = (uNMatrix *vec4( aVertexTangent,0.0)).xyz;",
		"   vTexCoord = aVertexTexCoord;",
		"   gl_Position = uPMatrix * vPosition;",
		"}"
	].join("\n");
	
	var fShaderCode = [
		"precision mediump float;",
		"varying vec4 vPosition;",
		"varying vec3 vTransformedNormal;",
		"varying vec3 vTransformedTangent;",
		"varying vec2 vTexCoord;",
		
		"uniform vec3 uAmbientColor;",
		"uniform vec3 uPointLightLocation;",
		"uniform vec3 uPointLightSpecularColor;",
		"uniform vec3 uPointLightDiffuseColor;",
		"const float shininess=30.0;",

		"uniform sampler2D uSampler;",
		"uniform int isFrontFace;uniform int isBackFace;float amplify(float depth){float a=0.0010,b=10.0,c=0.0;float k=a*exp(b*depth)+c;return k*depth;}",
		"void main(void) {",
		"   if(isFrontFace==1){float depth=1.0*amplify(gl_FragCoord.z);gl_FragColor=vec4(depth,depth,depth,1);return;}",
		"   if(isBackFace==1){float depth=1.0-amplify(gl_FragCoord.z);gl_FragColor=vec4(depth,depth,depth,1);return;}",
		"   vec3 lightDirection =normalize(uPointLightLocation-vPosition.xyz);",
		"   vec3 normal = normalize(vTransformedNormal);",
		//"   vec3 texColor= texture2D(uSampler,vTexCoord).rgb;",
		"   vec3 eyeDirection = normalize(-vPosition.xyz);",
		"   vec3 reflectionDirection= reflect(-lightDirection,normal);",
		"   float diffuseLightWeighting = max(dot(normal, lightDirection),0.0);",
		"	float specularLightWeighting=0.;",
		"	if (dot(normal, lightDirection)>0.)",
		"    specularLightWeighting = pow(max(dot(reflectionDirection,eyeDirection),0.0),shininess);",
		"   vec3 lightWeighting = uAmbientColor+uPointLightDiffuseColor*diffuseLightWeighting+ uPointLightSpecularColor*specularLightWeighting;",
		//"	gl_FragColor = vec4(texColor*lightWeighting.rgb, 1.0);",


		"   float w=1024.0,h=1024.0;vec2 texCoord=vec2(gl_FragCoord.x/w,gl_FragCoord.y/h);",
		"   vec3 texColor=(1.0-texture2D(uSampler,texCoord).rgb)*1.2;",
		"   vec3 fragColor=texColor*uPointLightDiffuseColor*0.85+(1.0-diffuseLightWeighting)*0.15+specularLightWeighting*0.6;gl_FragColor=vec4(fragColor,1);",
		"}"
	].join("\n");
	// Create vertex shader , attach the source and compile
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, vShaderCode);	
	gl.compileShader(vertexShader);

	// Create fragment shader, attach the source and compile
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, fShaderCode);
	gl.compileShader(fragmentShader);

	 // 3. Create shader program, attach the shaders and link
	var shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	gl.useProgram(shaderProgram);
	gl.enable(gl.DEPTH_TEST);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	var positionLocation = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(positionLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

	var normalLocation = gl.getAttribLocation(shaderProgram, "aVertexNormal");
	gl.enableVertexAttribArray(normalLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);


	var tangentLocation = gl.getAttribLocation(shaderProgram, "aVertexTangent");
	gl.enableVertexAttribArray(tangentLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, tangentBuffer);
	gl.vertexAttribPointer(tangentLocation, 3, gl.FLOAT, false, 0, 0);

	var texCoordLocation = gl.getAttribLocation(shaderProgram, "aVertexTexCoord");
	gl.enableVertexAttribArray(texCoordLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);


	var MVMatrixLoc = gl.getUniformLocation(shaderProgram,"uMVMatrix");
	var PMatrixLoc = gl.getUniformLocation(shaderProgram,"uPMatrix");
	var NMatrixLoc = gl.getUniformLocation(shaderProgram,"uNMatrix");
	
	var uPointLightLocationLoc = gl.getUniformLocation(shaderProgram, "uPointLightLocation");
	var uAmbientColor = gl.getUniformLocation(shaderProgram,"uAmbientColor");
	var uPointLightSpecularColorLoc = gl.getUniformLocation(shaderProgram,"uPointLightSpecularColor");
	var uPointLightDiffuseColorLoc = gl.getUniformLocation(shaderProgram,"uPointLightDiffuseColor");



	//var rotZ=0.03;
	//var m=mat4.create();
	//mat4.scale(m,m,[0.4,0.4,0.4]);
        
		gl.uniform3fv(uPointLightLocationLoc,[1.5,1.0,1.0]);
		gl.uniform3fv(uAmbientColor,[0.2,0.2,0.2]);
		gl.uniform3fv(uPointLightDiffuseColorLoc,[1.0,0.0,0.0]);
		gl.uniform3fv(uPointLightSpecularColorLoc,[0.8,0.8,0.8]);

	var angle = 0.;



//Texture Part:


				var uSamplerLoc=gl.getUniformLocation(shaderProgram,"uSampler");
				gl.uniform1i(uSamplerLoc,0);

		var imageName="normal.gif";


				var texture=gl.createTexture();
				texture.image=new Image();
				texture.image.onload=function(){loadImageTexture(texture);}
				texture.image.src=imageName;
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D,texture);

			function loadImageTexture(texture)
			{
				gl.bindTexture(gl.TEXTURE_2D,texture);
				gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				gl.generateMipmap(gl.TEXTURE_2D);
			}

var imageTexture=texture;






	var isFrontFaceLoc = gl.getUniformLocation(shaderProgram,"isFrontFace");
	var isBackFaceLoc = gl.getUniformLocation(shaderProgram,"isBackFace");


	var imageWidth=1024,imageHeight=1024;

				var framebuffer=gl.createFramebuffer();
				gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);
				framebuffer.width=imageWidth;
				framebuffer.height=imageHeight;
				var texture=gl.createTexture();
				gl.bindTexture(gl.TEXTURE_2D,texture);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,framebuffer.width,framebuffer.height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				gl.generateMipmap(gl.TEXTURE_2D);
				var renderbuffer=gl.createRenderbuffer();
				gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
				gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, framebuffer.width, framebuffer.height);
				gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
				gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
			//	gl.bindTexture(gl.TEXTURE_2D, null);
				gl.bindRenderbuffer(gl.RENDERBUFFER, null);
				gl.bindFramebuffer(gl.FRAMEBUFFER, null);



	function draw()
	{
		//mat4.rotate(m,m,rotZ,[0,1,0]);
		//gl.uniformMatrix4fv(modelMatrixLoc,false,m);
		gl.viewport(0,0,canvas.width,canvas.height);
		var modelViewMatrix = mat4.create();
		    var projectionMatix = mat4.create();
		
		mat4.identity(projectionMatix);
		mat4.perspective(projectionMatix,45,canvas.width/canvas.height,0.1,100,projectionMatix);

		mat4.identity(modelViewMatrix);
		var zoom=0.01;
		mat4.scale(modelViewMatrix,modelViewMatrix,[zoom,zoom,zoom]);
		mat4.translate(modelViewMatrix,modelViewMatrix,[0.0,0.0,-35.5]);
		mat4.rotate(modelViewMatrix,modelViewMatrix,-Math.PI/2,[1.0,0.0,0.0]);
		mat4.translate(modelViewMatrix,modelViewMatrix,[0.0,0.0,-5.5]);
		mat4.rotate(modelViewMatrix,modelViewMatrix,0.12,[1.0,0.0,0.0]);
		mat4.rotate(modelViewMatrix,modelViewMatrix,angle,[0.0,0.0,1.0]);
		angle-=0.01;
		

		var normalMatrix = mat4.create();
	//	mat4.invert(normalMatrix,modelViewMatrix);
	//	mat4.transpose(normalMatrix,modelViewMatrix);
		gl.uniformMatrix4fv(NMatrixLoc,false,normalMatrix);

		gl.uniformMatrix4fv(MVMatrixLoc,false,modelViewMatrix);
		gl.uniformMatrix4fv(PMatrixLoc,false,projectionMatix);




				gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);
				gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

				gl.depthFunc(gl.LEQUAL);
				gl.uniform1i(isFrontFaceLoc,1);
				gl.uniform1i(isBackFaceLoc,0);
				gl.disable(gl.CULL_FACE);


		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer); 
		gl.drawElements(gl.TRIANGLES, indicesBuffer.numItems,gl.UNSIGNED_SHORT,0);

				gl.enable(gl.BLEND);
				gl.depthFunc(gl.GEQUAL);
			//	gl.blendFunc(gl.SRC_ALPHA, gl.DST_ALPHA);
				gl.blendFunc(gl.ONE, gl.ONE);
				gl.uniform1i(isFrontFaceLoc,0);
				gl.uniform1i(isBackFaceLoc,1);
				gl.enable(gl.CULL_FACE);
				gl.cullFace(gl.FRONT);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer); 
		gl.drawElements(gl.TRIANGLES, indicesBuffer.numItems,gl.UNSIGNED_SHORT,0);

				gl.disable(gl.CULL_FACE);
				gl.disable(gl.BLEND);
				gl.depthFunc(gl.LEQUAL);

				gl.bindFramebuffer(gl.FRAMEBUFFER, null);

			gl.uniform1i(isFrontFaceLoc,0);
			gl.uniform1i(isBackFaceLoc,0);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer); 
		gl.drawElements(gl.TRIANGLES, indicesBuffer.numItems,gl.UNSIGNED_SHORT,0);


		

/*
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D,imageTexture);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer); 
		gl.drawElements(gl.TRIANGLES, indicesBuffer.numItems,gl.UNSIGNED_SHORT,0);

*/


		requestAnimationFrame(draw);
	}
	draw();
}
