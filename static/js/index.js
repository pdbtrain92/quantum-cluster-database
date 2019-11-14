let currentElement = "";

let baseURL = "localhost:3000";

let generalAbortController = new AbortController();

let overlayClose = function(){
  document.getElementById('overlay').style.display = "none";
};

//Loop through elements with data and set colors
let correlationLoop = function(corrArray){
  for ( var i = 0; i < corrArray.values.length; i++) {
      let obj = corrArray.values[i];
      //let newClass = defineCorrClass(obj.correlation);
      let newClass = "white-text";
      let transformedElement = document.getElementById(obj.right);
      transformedElement.className = 'element w-inline-block ' + newClass;
      transformedElement.style.backgroundColor = obj.correlation;
      if (obj.left === obj.right){
        transformedElement.className = 'element current-element w-inline-block';
      };
    };
};

//visualization render
let visualization = function(y) {
  /*let overlay = document.getElementById('overlay');
  overlay.style.display = "flex";
  // let xyzPath = '/data/' + currentElement + "/" + y.id;
  console.log(y);
  let viewer = $3Dmol.createViewer( $('#viewer_3Dmoljs'), { backgroundColor: 'white' } );
  cachedLookupXyzRawByFilename(y.id).then(data => {
    let v = viewer;
    v.addModel( data, "xyz" );
    v.setStyle({}, {sphere: {color: 'spectrum'}});
    v.zoomTo(1);
    v.render();
    v.zoom(0.8, 1000);
  }).catch(err => {
    console.error( "Failed to load XYZ " + y.id + ": " + err );
  })*/
};

//set up row
let rowBuild = function(clusterSize, clusterArrayPull){
  let row = document.getElementById('table-row-' + clusterSize);
  while (row.firstChild) {
    row.removeChild(row.firstChild);
  };
  let cellLabel = document.createElement('div');
  cellLabel.setAttribute('class', 'cluster-size-label');
  cellLabel.innerHTML = clusterSize;
  row.appendChild(cellLabel);
  clusterArrayPull.values.sort(function(a, b) {
    return a.energy - b.energy;
  });
  let firstCell = clusterArrayPull.values[0];
  let lowestEnergy = firstCell.energy;
  //build cell
  //for (var i=0; i < clusterArrayPull.values.length; i++){ -> switch when slider is built
  for (var i=0; i < clusterArrayPull.values.length; i++){
    let obj2 = clusterArrayPull.values[i];
    let el = obj2.element;
    let fileName = obj2.filename;
    let clusterImagePath = 'images/' + fileName;
    let clusterImage = clusterImagePath.replace("xyz", "jpg");
    let rawRelEnergy = (obj2.energy - lowestEnergy) * 100;
    let relEnergy = Math.round(rawRelEnergy * 100) / 100;
    let rawRelPerAtom = relEnergy / clusterSize;
    let relPerAtom = Math.round(rawRelPerAtom * 100) / 100;
    var cell = document.createElement("a");
    cell.setAttribute('class', 'cluster-table-item w-inline-block');
    cell.setAttribute('id', fileName);
    cell.setAttribute('onclick', 'visualization(this)');
    var imageAdd = document.createElement("img");
    imageAdd.src = clusterImage;
    imageAdd.setAttribute('style', 'padding-bottom:12px;')
    var relEnergyLabel = document.createElement("div");
    relEnergyLabel.innerHTML = "Rel Energy = " + relEnergy + " meV";
    var relEnergyPerAtomLabel = document.createElement("div");
    relEnergyPerAtomLabel.innerHTML = "RE / atom = " + relPerAtom + " meV";
    cell.appendChild(imageAdd);
    cell.appendChild(relEnergyLabel);
    cell.appendChild(relEnergyPerAtomLabel);
    row.appendChild(cell);
  };
};

let correlationCache = {};
async function cachedLookupCorrelation(id) {
  if (!correlationCache[id]) {
    const response = await fetch('correlations/' + id, {
      signal: generalAbortController.signal
    });
    correlationCache[id] = await response.json();
  }
  return correlationCache[id];
}

let xyzsCache = {};
async function cachedLookupXyz(el, size) {
  if (!xyzsCache[el]) { xyzsCache[el] = {}; }
  if (!xyzsCache[el][size]) {
    const res = await fetch('xyz/' + el + '/' + size, {
      signal: generalAbortController.signal
    });
    xyzsCache[el][size] = await res.json()
  }
  return xyzsCache[el][size];
}

async function cachedLookupXyzRawByFilename(filename) {
  let [el, size] = filename.split('-');
  const response = await cachedLookupXyz(el.toLowerCase(), size);
  const match = response.values.find(v => v.filename === filename);
  if (match) {
    return match.raw;
  } else {
    throw new Error('could not load ' + filename);
  }
}

/*let txtsCache = {};
async function cachedLookupTxt(el, size, structure) {
  if (!txtsCache[el]) { txtsCache[el] = {}; }
  if (!txtsCache[el][size]) { txtsCache[el][size] = {}; }
  if (!txtsCache[el][size][structure]) {
    const txtres = await fetch('ids/' + el + '/' + size + '/' + structure, {
      signal: generalAbortController.signal
    });
    txtsCache[el][size][structure] = await txtres.json()
  }
  return txtsCache[el][size][structure];
}

async function cachedLookupTxtRawByFilename(txtFilename) {
  let [el, size, structure] = txtFilename.split('-');
  const responseTxt = await cachedLookupTxt(el.toLowerCase(), size, structure);
  console.log(responseTxt);
  const matchTxt = responseTxt.values.find(v => v.filename === txtFilename);
  if (matchTxt) {
    return matchTxt.raw;
  } else {
    throw new Error('could not load ' + filename);
  }
}*/
// fetch data and run
let correlations = async function(x) {
  console.log(x);
  let id = x.id;
  if (currentElement !== id) {` `
    generalAbortController.abort();
    generalAbortController = new AbortController();
  }
  currentElement = id;
  let elUpper = id.charAt(0).toUpperCase();
  let stringWithoutFirstLetter = id.slice(1);
  let elText = elUpper + stringWithoutFirstLetter;
  cachedLookupCorrelation(id)
    .then(function(myJson) {
      correlationLoop(myJson);
      var headerText = document.getElementById('hs-replace');
      headerText.innerHTML = "<strong>Currently Selected: " + elText +'<strong>' + '  Scroll down to see clusters.';
    })
    .catch(e => console.log('Error:', e))
  await tableBuild(id);
}

let tableBuild = async function(id){
  document.getElementById('cluster-table').style.display = "flex";
  document.getElementById('pcc-box').style.display = "flex";
  let xyzRequests = [];
  for (var i = 3; i<56; i++){
    let clusterSize = i;
    cachedLookupXyz(id, i)
      .then(async (response) => {
        rowBuild(clusterSize, response);
      })
  };
  return Promise.all(xyzRequests).catch(error => console.error('Error:', error));
};

// Detail page functionality
let detailVisualization = function(y) {
  let overlay = document.getElementById('ball-and-stick');
  overlay.style.display = "flex";
  let viewer = $3Dmol.createViewer( $('#viewer_3Dmoljs'), { backgroundColor: 'white' } );
  cachedLookupXyzRawByFilename(y.values[0]["filename"]).then(data => {
    let v = viewer;
    v.addModel( data, "xyz" );                       /* load data */
    v.setStyle({}, {sphere: {color: 'spectrum'}});  /* style all atoms */
    v.zoomTo(1);                                      /* set camera */
    v.render();                                      /* render scene */
    v.zoom(0.8, 1000);                               /* slight zoom */
  }).catch(err => {
    console.error( "Failed to load XYZ " + y.id + ": " + err );
  })
};
let precision = function(x) {
return Number.parseFloat(x).toPrecision(6);
}

let detailStats = function(x){

  //document.getElementById('energy-diff').textContent=precision(x.values.info[0][]);
  document.getElementById('n-less-1').textContent=precision(x.values.info[0]["minusOne"]);
  document.getElementById('n-and-1').textContent=precision(x.values.info[0]["plusOne"]);
  document.getElementById('humo-lomo').textContent=precision(x.values.info[0]["HomoLumoGap"]);
  document.getElementById('valence-electrons').textContent=precision(x.values.info[0]["valenceElectrons"]);
}

let coordinatesBuild = function(x){
  let coordinateLocation = x.values[0]["coordinates"];
  console.log(coordinateLocation);
  for (var i=0; i < coordinateLocation.length; i++){
    let coordinateBox = document.getElementById("coordinateDetail");
    var coorRow = document.createElement('div');
    coorRow.setAttribute('class', 'el-stat-box');
    let cellArray = ['x', 'y', 'z'];
    coordinateBox.appendChild(coorRow);
    for (var j=0; j < 3; j++){
      var coorCell = document.createElement('div');
      coorCell.setAttribute('class', 'el-xyz-val');
      coorRow.appendChild(coorCell);
      var coorSolo = document.createElement('div');
      let coorVal = cellArray[j];
      //console.log(coordinateLocation[i][coorVal]);
      coorCell.appendChild(coorSolo);
      coorSolo.innerHTML = precision(coordinateLocation[i][coorVal]);
    }
  }
}

let xyzDownload = function(x){
  let xyzDownloadLink = document.getElementById('download-xyz-detail');
  console.log(x);
  let extension = x.values[0]["filename"];
  extension = extension.split('-');
  extension[2] = extension[2].replace(".xyz", "");
  console.log(extension);
  let xyzFile = '/xyz-id/' + extension[0] + '/' + extension[1] + '/' + extension[2];
  xyzDownloadLink.setAttribute('href', xyzFile);
  xyzDownloadLink.setAttribute('download', xyzFile + '.xyz');
}

let setLabels = function(x){
  let compositionLabel = document.getElementById('composition');
  let structureLabel = document.getElementById('structure-id');
  let labelVals = x.values[0]['filename'].replace('.xyz','');
  console.log('setLabels');
  structureLabel.innerHTML = 'Stucture ID: ' + labelVals;
  labelVals = labelVals.split('-');
  compositionLabel.innerHTML = 'Composition: ' + labelVals[0] + '(' + labelVals[1] + ')';
}

let xyzTasks = function(x){
  coordinatesBuild(x);
  xyzDownload(x);
  setLabels(x);
  detailVisualization(x);
};

let initiate = async function(){

  let detailId = 'Ag-13-3';
  const txtResponse = await fetch('/ids/Ag/13/3');
  const txtJson = await txtResponse.json();
  detailStats(txtJson);
  console.log(txtJson);
  const xyzResponse = await fetch('/xyz-id/Ag/13/3');
  const xyzJson = await xyzResponse.json();
  xyzTasks(xyzJson, detailId);
  console.log(xyzJson);
};
