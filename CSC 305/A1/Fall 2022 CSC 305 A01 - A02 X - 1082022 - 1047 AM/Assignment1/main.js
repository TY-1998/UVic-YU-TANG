
var canvas;
var gl;

var program;

var near = 1;
var far = 100;


var left = -6.0;
var right = 6.0;
var ytop =6.0;
var bottom = -6.0;


var lightPosition2 = vec4(100.0, 100.0, 100.0, 1.0 );
var lightPosition = vec4(0.0, 0.0, 100.0, 1.0 );

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 0.4, 0.4, 0.4, 1.0 );
var materialShininess = 40.0;

var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix, modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 0.5, 0.5);

var RX = 0;
var RY = 0;
var RZ = 0;

var MS = []; // The modeling matrix stack
var TIME = 0.0; // Realtime
var dt = 0.0
var prevTime = 0.0;
var resetTimerFlag = true;
var animFlag = false;
var controller;

// These are used to store the current state of objects.
// In animation it is often useful to think of an object as having some DOF
// Then the animation is simply evolving those DOF over time.
var sphereRotation = [0,0,0];
var spherePosition = [0,-3.35,0];

var sphereRotation2 = [0,0,0];
var spherePosition2 = [-1,-3.67,0];

var spherePosition3 = [-0.65,-2.6,0];

var cubeRotation = [10,5,10];
var cubePosition = [-2,1,1];

var cubeRotation2 = [7,1,2];
var cubePosition2 = [-1,-5,0];

var cylinderRotation = [0,0,0];
var cylinderPosition = [1.1,0,0];

var coneRotation = [0,0,0];
var conePosition = [2,-1.5,0];

// Setting the colour which is needed during illumination of a surface
function setColor(c)
{
    ambientProduct = mult(lightAmbient, c);
    diffuseProduct = mult(lightDiffuse, c);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
                                        "shininess"),materialShininess );
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 1.0, 1.0 );
    //gl.clearColor( 1.5, 0.5, 1.5, 1.0 );
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    

    setColor(materialDiffuse);
	
	// Initialize some shapes, note that the curved ones are procedural which allows you to parameterize how nice they look
	// Those number will correspond to how many sides are used to "estimate" a curved surface. More = smoother
    Cube.init(program);
	//
	//cube2.init(0,program);
    Cylinder.init(20,program);
    Cone.init(20,program);
    Sphere.init(36,program);

    // Matrix uniforms
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    
    // Lighting Uniforms
    gl.uniform4fv( gl.getUniformLocation(program, 
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "specularProduct"),flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, 
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
       "shininess"),materialShininess );


    document.getElementById("animToggleButton").onclick = function() {
        if( animFlag ) {
            animFlag = false;
        }
        else {
            animFlag = true;
            resetTimerFlag = true;
            window.requestAnimFrame(render);
        }
        //console.log(animFlag);
		
		controller = new CameraController(canvas);
		controller.onchange = function(xRot,yRot) {
			RX = xRot;
			RY = yRot;
			window.requestAnimFrame(render); };
    };

    render(0);
}

// Sets the modelview and normal matrix in the shaders
function setMV() {
    modelViewMatrix = mult(viewMatrix,modelMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    normalMatrix = inverseTranspose(modelViewMatrix);
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix) );
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    setMV();   
}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCube() {
    setMV();
    Cube.draw();
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawSphere() {
    setMV();
    Sphere.draw();
}

// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCylinder() {
    setMV();
    Cylinder.draw();
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCone() {
    setMV();
    Cone.draw();
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modeling matrix with the result
function gTranslate(x,y,z) {
    modelMatrix = mult(modelMatrix,translate([x,y,z]));
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modeling matrix with the result
function gRotate(theta,x,y,z) {
    modelMatrix = mult(modelMatrix,rotate(theta,[x,y,z]));
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modeling matrix with the result
function gScale(sx,sy,sz) {
    modelMatrix = mult(modelMatrix,scale(sx,sy,sz));
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
    modelMatrix = MS.pop();
}

// pushes the current modelViewMatrix in the stack MS
function gPush() {
    MS.push(modelMatrix);
}


function render(timestamp) {
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    eye = vec3(0,0,10);
    MS = []; // Initialize modeling matrix stack
	
	// initialize the modeling matrix to identity
    modelMatrix = mat4();
    
    // set the camera matrix
    viewMatrix = lookAt(eye, at , up);
   
    // set the projection matrix
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    
    
    // set all the matrices
    setAllMatrices();
    
	if( animFlag )
    {
		// dt is the change in time or delta time from the last frame to this one
		// in animation typically we have some property or degree of freedom we want to evolve over time
		// For example imagine x is the position of a thing.
		// To get the new position of a thing we do something called integration
		// the simpelst form of this looks like:
		// x_new = x + v*dt
		// That is the new position equals the current position + the rate of of change of that position (often a velocity or speed), times the change in time
		// We can do this with angles or positions, the whole x,y,z position or just one dimension. It is up to us!
		dt = (timestamp - prevTime) / 1000.0;
		prevTime = timestamp;
	}
	// All the drawing part are below,the longest one is to draw seasweeds, I couldn't find simpler to do it so I have to draw 
	// the seasweeds one by one so total 30
	
	// Bubbles, the bubbles come out from human head, I repeate following drawing for 4 times
	gPush();

		gTranslate(3.4,1.8,1);      //  I translate the coordinate system 
		gPush();
		{
			setColor(vec4(1.0,1.0,1.0,0.8)); // Set the color to white 
			gScale(0.15,0.15,0.15);          // Decrease the size 
			drawSphere();                    
		}
		gPop();
	gPop();
    //Second bubbles
	gPush();
	
		gTranslate(3.4,2.0,1);
		gPush();
		{
			
			setColor(vec4(1.0,1.0,1.0,0.8));
			gScale(0.15,0.15,0.15);
			drawSphere();
		}
		gPop();
	gPop();
    //Third bubbles
	gPush();
		
		gTranslate(3.4,2.2,1);
		gPush();
		{
			
			setColor(vec4(1.0,1.0,1.0,0.8));
			gScale(0.15,0.15,0.15);
			drawSphere();
		}
		gPop();
	gPop();
    //Last bubbles
	gPush();
		
		gTranslate(3.4,2.4,1);
		gPush();
		{
			
			setColor(vec4(1.0,1.0,1.0,0.8));
			gScale(0.15,0.15,0.15);
			drawSphere();
		}
		gPop();
	gPop();
	// The bigger rock, use sphere as a rock
	gPush();
		
		gTranslate(spherePosition[0],spherePosition[1],spherePosition[2]);
		gPush();
		{
			
			setColor(vec4(0.5,0.5,0.5,0.8));
			drawSphere();
		}
		gPop();
	gPop();
	//Human head, ues sphere as a head 
	gPush();
		
		gTranslate(3.5,1.7,0);
		gPush();
		{
			
			setColor(vec4(0.5,0,0.5,0.8));
			gScale(0.5,0.5,0.5);
			drawSphere();
		}
		gPop();
	gPop();
	//Human body, squeeze the cube make it looks like a human body
	gPush();	
		gTranslate(3.5,0.450,0);
		gPush();
		{		
			setColor(vec4(0.5,0,0.5,0.8));
			gScale(1.3,1.8,1);		
			gRotate(10,0,-1,0);
			drawCube();
		}
		gPop();
	gPop();

	// Human thigh left,squeeze the cube make it looks like a human thigh
	gPush();
		
		gTranslate(3.2,-1.03,0);
		gPush();
		{
			
			setColor(vec4(0.5,0,0.5,0.8));
			
			gScale(0.3,1.1,0.1);
			gRotate(20,8,-9,1);  // Rotate the thigh so it is in the right angle 
			
			drawCube();
		}
		gPop();
	gPop();
    // Human thigh right,squeeze the cube make it looks like a human thigh
	gPush();
		
		gTranslate(3.9,-1.03,0);
		gPush();
		{
			
			setColor(vec4(0.5,0,0.5,0.8));
			
			gScale(0.3,1.1,0.1);
			gRotate(20,8,-9,1);  // Rotate the thigh so it is in the right angle 
			drawCube();
		}
		gPop();
	gPop();
    // Human left calf,squeeze the cube make it looks like a human calf
	gPush();
		
		gTranslate(3.2,-2.0,0);
		gPush();
		{
		
			setColor(vec4(0.5,0,0.5,0.8));
			
			gScale(0.23,0.8,0.1);
			gRotate(20,10,-9,3);  // Rotate the calf so it is in the right angle 
			drawCube();
		}
		gPop();
	gPop();
    // Human right calf,squeeze the cube make it looks like a human calf
	gPush();
		
		gTranslate(3.9,-2.0,0);
		gPush();
		{
			
			setColor(vec4(0.5,0,0.5,0.8));
			
			gScale(0.23,0.8,0.1);
			gRotate(20,10,-9,3);  // Rotate the calf so it is in the right angle 
			drawCube();
		}
		gPop();
	gPop();

	// Human right feet,squeeze the cube make it looks like a human feet
	gPush();
		
		gTranslate(3.9,-2.65,0);
		gPush();
		{
			setColor(vec4(0.5,0,0.5,0.8));
			gScale(0.3,0.3,0.3);
			gRotate(20,7,-9,3); // Rotate the calf so it is in the right angle 
			drawCube();
		}
		gPop();
	gPop();

	// Human left feet,squeeze the cube make it looks like a human feet
	gPush();
	
		gTranslate(3.2,-2.65,0);
		gPush();
		{
		
			setColor(vec4(0.5,0,0.5,0.8));
			
			gScale(0.3,0.3,0.3);
			gRotate(20,7,-9,3); // Rotate the calf so it is in the right angle 
			drawCube();
		}
		gPop();
	gPop();
    //The smaller rock, use the sphere as a rock
	gPush();
		
		gTranslate(spherePosition2[0],spherePosition2[1],spherePosition2[2]);
		gPush();
		{
			
			setColor(vec4(0.5,0.5,0.5,0.8));
			gScale(0.5,0.5,0.5);
			drawSphere();
		}
		gPop();
	gPop();
    
	//seaweed first column, I was trying to use global variable for all the position of seaweeds, but it will take
	// too much space on top, so I just put corresponding coordinate system in numbers
	// I didn't put all the seaweed like Vertical line,I made it curved to simulate bending in water.
	gPush();
		
		gTranslate(spherePosition3[0],spherePosition3[1],spherePosition3[2]);
		
		gPush();
		{
			
			setColor(vec4(0.0,1,0,0.5));  // Set color to green
			gScale(0.15,0.4,0.5);       //squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
	//seaweed
	gPush();
		
		gTranslate(-0.65,-3.1,-3);
		
		gPush();
		{
			
			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5); //squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
	//seaweed
	gPush();
		
		gTranslate(-0.63,-2.1,0);
		
		gPush();
		{
			
			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5); //squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
	//seaweed
	gPush();
		
		gTranslate(-0.66,-1.6,0);
		
		gPush();
		{
			
			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5); //squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
	//seaweed
	gPush();
		
		gTranslate(-0.65,-1.1,0);
		
		gPush();
		{
			// Draw the sphere!
			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5);  //squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
	//seaweed
	gPush();
		
		gTranslate(-0.68,-0.6,0);
		
		gPush();
		{
			
			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5);  //squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
	//seaweed
	gPush();
		
		gTranslate(-0.69,-0.1,0);
		
		gPush();
		{
			
			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5);  //squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
	//seaweed
	gPush();
		
		gTranslate(-0.64,0.4,0);
		
		gPush();
		{
			
			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5); //squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
	//seaweed
	gPush();
		
		gTranslate(-0.68,0.9,0);
		
		gPush();
		{
			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5); //squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
	//seaweed
	gPush();
		
		gTranslate(-0.66,1.4,0);
		
		gPush();
		{
			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5); //squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
	//End of first 10 seaweeds
	// Column 2 seaweeds
	gPush();
		
		gTranslate(0.0,-2.4,0);
		
		gPush();
		{
			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5); //squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
	//seaweeds
	gPush();
		gTranslate(0.06,-1.9,0);
		
		gPush();
		{
			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5);//squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
	//seaweeds
	gPush();
		gTranslate(0.0,-1.4,0);
		
		gPush();
		{
			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5);//squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
	//seaweeds
	gPush();
		
		gTranslate(0.08,-0.9,0);
		
		gPush();
		{
		
			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5);//squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
	//seaweeds
	gPush();
		gTranslate(0.0,-0.4,0);
		
		gPush();
		{
			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5);//squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
	//seaweeds
	gPush();
		gTranslate(0.04,0.1,0);
		
		gPush();
		{
			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5);//squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
    //seaweeds
	gPush();
		gTranslate(-0.04,0.6,0);
		
		gPush();
		{
			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5); //squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
     //seaweeds
	gPush();
		gTranslate(0.05,1.1,0);
		
		gPush();
		{
			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5); //squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
   //seaweeds
	gPush();
		gTranslate(0.0,1.6,0);
		
		gPush();
		{
			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5); //squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
   //seaweeds
	gPush();
		gTranslate(0.0,2.1,0);
		
		gPush();
		{
			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5);//squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
    //Column 3 seaweeds pretty the same thing as first two columns 
	gPush();
		gTranslate(0.65,-3.13,-0.5);
		
		gPush();
		{
			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5);//squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
    //seaweeds
	gPush();
		gTranslate(0.63,-2.57,0);
		
		gPush();
		{
			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5);//squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
     //seaweeds
	gPush();
		gTranslate(0.67,-2.05,0);
		
		gPush();
		{
			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5);//squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
    //seaweeds
	gPush();
		gTranslate(0.63,-1.53,0);
		
		gPush();
		{
			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5); //squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
    //seaweeds
	gPush();
		gTranslate(0.67,-1.0,0);
		
		gPush();
		{
			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5);//squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
    //seaweeds
	gPush();
		gTranslate(0.61,-0.5,0);
		
		gPush();
		{

			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5); //squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
    //seaweeds
	gPush();
		gTranslate(0.67,0.0,0);
		
		gPush();
		{
			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5); //squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
    //seaweeds
	gPush();
		gTranslate(0.63,0.5,0);
		
		gPush();
		{
			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5);//squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
    //seaweeds
	gPush();
		gTranslate(0.67,1.0,0);
		
		gPush();
		{
			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5);//squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
    //seaweeds
	gPush();
		gTranslate(0.63,1.4,0);
		
		gPush();
		{
			setColor(vec4(0.0,1,0,0.5));
			gScale(0.15,0.42,0.5);//squeeze the sphere
			drawSphere();
		}
		gPop();
		
	gPop();
	
	
	// Black ground, I just increase the Y values of cube and move it to the battom and change the color to black
	gPush();
		gTranslate(cubePosition2[0],cubePosition2[1],cubePosition2[2]);
		gPush();
		{
			setColor(vec4(0.0,0.0,0.0,1.0));
			// Here is an example of integration to rotate the cube around the y axis at 30 degrees per second
			// new cube rotation around y = current cube rotation around y + 30deg/s*dt
			//cubeRotation2[1] = cubeRotation2[1] + 30*dt;
			// This calls a simple helper function to apply the rotation (theta, x, y, z), 
			// where x,y,z define the axis of rotation. Here is is the y axis, (0,1,0).
			//gRotate(cubeRotation[1],0,5,0);
			gScale(14.0,2.0,0.7);
			drawCube();
		}
		gPop();
	gPop();
    
	//Fish tails, I squeeze the sphere to make it like the tails 
    gPush();
		gTranslate(1.25,-1.0,-1);
		gPush();
		{
			setColor(vec4(1.0,0.0,0.0,1.0));
			gScale(0.1,0.6,1);
			drawSphere();
		}
		gPop();
	gPop();
    //The second of tails, same idea 
	gPush();
		gTranslate(1.25,-2.0,-1);
		gPush();
		{
			setColor(vec4(1.0,0.0,0.0,1.0));
			gScale(0.1,0.6,1);
			drawSphere();
		}
		gPop();
	gPop();

    //Fish body, I decrease the size of cylinder and move it to the right place 
	gPush();
		gTranslate(1.7,-1.5,-0.5);
		gPush();
		{
			setColor(vec4(1.0,0.0,0.0,1.0));
			gScale(0.83,0.83,0.83);
			gRotate(30,0,1,0);  // Rotate the clinder with this angle so we can see the body
			drawCylinder();
		}
		gPop();
	gPop();	
    
	// Fish head, I decrease the size of cone and move it to the right place
	gPush();
		gTranslate(conePosition[0],conePosition[1],conePosition[2]);
		gPush();
		{
			setColor(vec4(0.5,0.5,0.5,1.0));
			gScale(0.45,0.45,0.45);
			gRotate(30,0,1,0); // Rotate the cone with this angle so we can see the head
			drawCone();
		}
		gPop();
	gPop();
    //Fish eyes left, I squezze the sphere and change the color to black and move to right place
	gPush();
		gTranslate(1.8,-1.3,0);// z is 0 so the eyes is on the face
		gPush();
		{
			setColor(vec4(1.0,1.0,1.0,1.0));
			gScale(0.15,0.15,0.15);
			gRotate(50,0,1,0);
			drawSphere();
		}
		gPop();
	gPop();
    // eyeball left, I squezze the sphere and change the color to black and move to right place
	gPush();
		gTranslate(1.8,-1.3,1.0);// z is 1 so the eyeball is on the eyes
		gPush();
		{
			setColor(vec4(0.0,0.0,0.0,1.0));
			gScale(0.05,0.05,0.05);
			gRotate(50,0,1,0);
			drawSphere();
		}
		gPop();
	gPop();
    //Fish eyes right, I squezze the sphere and change the color to black and move to right place
	gPush();
		gTranslate(2.2,-1.3,0);// z is 0 so the eyes is on the face
		gPush();
		{
			setColor(vec4(1.0,1.0,1.0,1.0));
			gScale(0.15,0.15,0.15);
			gRotate(50,0,1,0);
			drawSphere();
		}
		gPop();
	gPop();
    // eyeball right, I squezze the sphere and change the color to black and move to right place
    gPush();
		gTranslate(2.2,-1.3,1.0); // z is 1 so the eyeball is on the eyes
		gPush();
		{
			setColor(vec4(0.0,0.0,0.0,1.0));
			gScale(0.05,0.05,0.05);
			gRotate(50,0,1,20);
			drawSphere();
		}
		gPop();
	gPop();
	
    if( animFlag )
        window.requestAnimFrame(render);
}

// A simple camera controller which uses an HTML element as the event
// source for constructing a view matrix. Assign an "onchange"
// function to the controller as follows to receive the updated X and
// Y angles for the camera:
//
//   var controller = new CameraController(canvas);
//   controller.onchange = function(xRot, yRot) { ... };
//
// The view matrix is computed elsewhere.

function CameraController(element) {
	var controller = this;
	this.onchange = null;
	this.xRot = 0;
	this.yRot = 0;
	this.scaleFactor = 3.0;
	this.dragging = false;
	this.curX = 0;
	this.curY = 0;
	
	// Assign a mouse down handler to the HTML element.
	element.onmousedown = function(ev) {
		controller.dragging = true;
		controller.curX = ev.clientX;
		controller.curY = ev.clientY;
	};
	
	// Assign a mouse up handler to the HTML element.
	element.onmouseup = function(ev) {
		controller.dragging = false;
	};
	
	// Assign a mouse move handler to the HTML element.
	element.onmousemove = function(ev) {
		if (controller.dragging) {
			// Determine how far we have moved since the last mouse move
			// event.
			var curX = ev.clientX;
			var curY = ev.clientY;
			var deltaX = (controller.curX - curX) / controller.scaleFactor;
			var deltaY = (controller.curY - curY) / controller.scaleFactor;
			controller.curX = curX;
			controller.curY = curY;
			// Update the X and Y rotation angles based on the mouse motion.
			controller.yRot = (controller.yRot + deltaX) % 360;
			controller.xRot = (controller.xRot + deltaY);
			// Clamp the X rotation to prevent the camera from going upside
			// down.
			if (controller.xRot < -90) {
				controller.xRot = -90;
			} else if (controller.xRot > 90) {
				controller.xRot = 90;
			}
			// Send the onchange event to any listener.
			if (controller.onchange != null) {
				controller.onchange(controller.xRot, controller.yRot);
			}
		}
	};
}
