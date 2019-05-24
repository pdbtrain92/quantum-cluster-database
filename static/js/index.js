let currentElement = "";

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
  let overlay = document.getElementById('overlay');
  overlay.style.display = "flex";
  // let xyzPath = '/data/' + currentElement + "/" + y.id;
  let viewer = $3Dmol.createViewer( $('#viewer_3Dmoljs'), { backgroundColor: 'white' } );
  cachedLookupXyzRawByFilename(y.id).then(data => {
    let v = viewer;
    v.addModel( data, "xyz" );                       /* load data */
    v.setStyle({}, {sphere: {color: 'spectrum'}});  /* style all atoms */
    v.zoomTo(1);                                      /* set camera */
    v.render();                                      /* render scene */
    v.zoom(0.8, 1000);                               /* slight zoom */
  }).catch(err => {
    console.error( "Failed to load XYZ " + y.id + ": " + err );
  })
  // jQuery.ajax( xyzPath, {
  //   success: function(data) {
  //   },
  //   error: function(hdr, status, err) {
  //     console.error( "Failed to load XYZ " + xyzPath + ": " + err );
  //   },
  // });
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
    const response = await fetch('/correlations/' + id, {
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
// fetch data and run
let correlations = async function(x) {
  let id = x.id;
  if (currentElement !== id) {
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
