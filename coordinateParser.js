/*function handleFileSelectOLD(evt) {
	fileDisplayArea.innerText = "";
	var files = evt.target.files[0];
	var fileType = /.x3d./;
	var xml = "";
	if (files.type.match(fileType)) {
		var reader = new FileReader();

		reader.onload = function(e) {
			xml = parseXml(reader.result);
			var mater = xml.getElementsByTagName('Material');
			var coords = xml.getElementsByTagName('Coordinate');
			var normals = xml.getElementsByTagName('Normal');
			colorFromX = mater[0].getAttribute('diffuseColor');
			colorFromX = colorFromX.replace(/ /g, ",");
			colorFromX = colorFromX.replace(/\.0/g, "");
			coordFromX = coords[0].getAttribute('point');
			coordFromX = coordFromX.replace(/ |, /g, ",");
			normFromX = normals[0].getAttribute('vector');
			normFromX = normFromX.replace(/ |, /g, ",");
			webGLStart();
		}

		reader.readAsText(files);
	} else {
		fileDisplayArea.innerText = "File not supported!"
	}
}
*/
function getCoordinates(xmlDocu) {
	var indexes = xmlDocu.getElementsByTagName('IndexedFaceSet')[0].getAttribute('coordIndex');
	indexes = indexes.split(" ");
	var coords = [];
	coords = xmlDocu.getElementsByTagName('Coordinate')[0].getAttribute('point');
	coords = coords.split(" ");
	//alert("Indexes: "+indexes+" "+indexes.length);
	//alert("Coords: "+coords+" "+coords.length);
	var counter = 0;
	var fullCoords = [];
	for (var i in indexes) {
		var indexNum = indexes[i];
		counter++;
		if(indexNum != -1) {
			for (var j = 0 ; j<3; j++ ) {
				fullCoords.push(coords[3*indexNum+j]);
			}
		}
	}
	//alert("FullCoords: " +fullCoords.length);
	return fullCoords;
}
function getIndexes () {
	var indexes = [0, 1, 2, -1, 0, 2, 3, -1, 1, 0, 4, -1, 0, 3, 4, -1, 3, 2, 4, -1, 2, 1, 4, -1];
	for (var i in indexes) {
		if (indexes[i] == -1) {
			indexes.splice(i,1);
		}
	}
	//alert("GetIndexes: "+indexes + " " + indexes.length);
	return indexes;
}

function getNormals(xml) {
	var indexes = xml.getElementsByTagName('IndexedFaceSet')[0].getAttribute('coordIndex');
	indexes = indexes.split(" ");
	var coords = [];
	coords = xml.getElementsByTagName('Coordinate')[0].getAttribute('point');
	coords = coords.split(" ");
	var counter = 0;
	var fullCoords = [];
	for (var i in indexes) {
		var indexNum = indexes[i];
		counter++;
		if(indexNum != -1) {
			for (var j = 0 ; j<3; j++ ) {
				fullCoords.push(coords[3*indexNum+j]);
			}
		}
	}
	 var normals = [];
	 var vector1 = vec3.create();
	 var vector2 = vec3.create();
	 var cross = vec3.create;
	 var normal = vec3.create();
	for (var i=0; i<fullCoords.length; i+=9) {
		vec3.set(vector1, fullCoords[i+6]-fullCoords[i], fullCoords[i+7]-fullCoords[i+1], fullCoords[i+8]-fullCoords[i+2]);
		vec3.set(vector2, fullCoords[i+3]-fullCoords[i], fullCoords[i+4]-fullCoords[i+1], fullCoords[i+5]-fullCoords[i+2]);
		/*alert(fullCoords[i+6]+" "+fullCoords[i]);
		alert(fullCoords[i+7]+" "+fullCoords[i+1]);
		alert(fullCoords[i+8]+" "+fullCoords[i+2]);
		alert(fullCoords[i+3]+" "+fullCoords[i]);
		alert(fullCoords[i+4]+" "+fullCoords[i+1]);
		alert(fullCoords[i+5]+" "+fullCoords[i+2]);
		alert("Vec1: "+vector1[0]+" "+vector1[1]+" "+vector1[2]);
		alert("Vec2: "+vector2[0]+" "+vector2[1]+" "+vector2[2]);*/
		vec3.cross(cross, vector1, vector2);
		vec3.normalize(normal, cross);
		normals.push(normal[0]);
		normals.push(normal[1]);
		normals.push(normal[2]);
		normals.push(normal[0]);
		normals.push(normal[1]);
		normals.push(normal[2]);
		normals.push(normal[0]);
		normals.push(normal[1]);
		normals.push(normal[2]);
	}
	return normals;
}
function getColor(xml) {
	
	var mater = xml.getElementsByTagName('Material');
	var color = mater[0].getAttribute('diffuseColor');
	var colorTable = [];
	if(color == null) {
		colorTable = [1,1,0];
	} else
		colorTable = color.split(" ");
	return colorTable;
}
//Scale the brightness of light depending on if there are added lightsources in the scene
//In this implementation brightness of 1 is no change, 1.9 is the coefficient that matches
//X3D.
function getBrightness(xml) {
	var intensity = 0;
	var light = xml.getElementsByTagName('DirectionalLight');
	//If no added lights, colors are displayed without modification to brightness
	if (!light.length) {
		intensity = 1;
	} else {
		//If we have an added directional light, get intensity value
		intensity = light[0].getAttribute('intensity');
		//If there is no intensity value, set the value to X3D default
		if(!intensity) {
			intensity = 1.9;
		}
		//If intensity is 0, again no modification to brightness
		else if (intensity == 0) {
			intensity = 1;
		}
		//If intensity value is in the accepted range, multiply with proper coefficient
		else if (intensity > 0 && intensity <= 1){
			intensity *= 1.9;
		} else {
			intensity = 1;
			alert("Incorrect intensity of light, default value will be used. Value must be 0.0 - 1.0");
		}
	}
	return intensity;
		
}

function getMinMax(xml) {
	//Get the minimum and maximum coordinates of the object. Coordinates are used
	//to perform the inital translation, so that the object would be in view immediately
	var coords = [];
	coords = xml.getElementsByTagName('Coordinate')[0].getAttribute('point');
	coords = coords.split(" ");
	var minX=coords[0], minY=coords[1], minZ=coords[2], maxX=coords[0], maxY=coords[1], maxZ=coords[2];
	var counter = 0;
	for(i in coords) {
		if (counter == 0) {
			counter++;
			if (coords[i]<minX) {
				minX=coords[i];
			}else if (coords[i]>maxX) {
				maxX=coords[i];
			}
		}else if (counter == 1) {
			counter++;
			if (coords[i]<minY) {
				minY=coords[i];
			}else if (coords[i]>maxY) {
				maxY=coords[i];
			}
		}else if (counter == 2) {
			counter = 0;
			if (coords[i]<minZ) {
				minZ=coords[i];
			}else if (coords[i]>maxZ) {
				maxZ=coords[i];
			}
		}
	}
	minX = parseFloat(minX);
	minY = parseFloat(minY);
	minZ = parseFloat(minZ);
	maxX = parseFloat(maxX);
	maxY = parseFloat(maxY);
	maxZ = parseFloat(maxZ);
	var initialZoom = -1*(maxX+maxY+maxZ-minX-minY-minZ);
	//alert(maxX+" "+minX +" "+" "+ maxY+" "+minY+" "+ maxZ+" "+minZ);
	return [((maxX+minX)/2.0), ((maxY+minY)/2.0), ((maxZ+minZ)/2.0), initialZoom];
}