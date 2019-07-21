
const { initialize } = require('../src/setup/knex');

module.exports.getXyz = async(element, clusterSize) => {
  const knex = await initialize();
  return knex('xyz').where({
    element: element.toLowerCase(),
    cluster_size: clusterSize
  }).select([
    'element',
    'filename',
    'raw',
    'coordinates',
    'cluster_size as clusterSize',
    'energy'
  ]);
};
// returns xyz, correlations, dft, ccd, info
module.exports.getElement = async(element) => {
  const knex = await initialize();
  const results = {
    xyz: knex('xyz').where({
      element: element.toLowerCase()
    }).select([
      'element',
      'filename',
      'coordinates',
      'cluster_size as clusterSize',
      'energy'
    ]),
    info: knex('info').where({
      element
    }).select([
      'id',
      'filename',
      'element',
      'minus_one as minusOne',
      'plus_one as plusOne',
      'homo_lumo_gap as HomoLumoGap',
      'valence_electrons as valenceElectrons',
      'similarities'
    ]),
    ccdAndDfts: knex('ccd_dft').where({
      element
    }).select([
      'id',
      'kind as ccdOrDft', // which one is it
      'filename',
      'element',
      'source',
      'locations'
    ]),
    correlations: knex('correlation').where({
      left_element: element
    }).select([
      'left_element as left',
      'right_element as right',
      'correlation',
    ])
  }
  await Promise.all(Object.keys(results).map(async k => {results[k] = await results[k]}));
  return results;
};

module.exports.getInfoDftAndCcdById = async(id) => {
  const knex = await initialize();
  const results = {
    info: knex('info').where({
      id
    }).select([
      'id',
      'filename',
      'element',
      'minus_one as minusOne',
      'plus_one as plusOne',
      'homo_lumo_gap as HomoLumoGap',
      'valence_electrons as valenceElectrons',
      'similarities'
    ]),
    ccdAndDfts: knex('ccd_dft').where({
      id
    }).select([
      'id',
      'kind as ccdOrDft', // which one is it
      'filename',
      'element',
      'source',
      'locations'
    ])
  }
  await Promise.all(Object.keys(results).map(async k => {results[k] = await results[k]}));
  return results;
};