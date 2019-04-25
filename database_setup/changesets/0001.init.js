module.exports.up = (knex) => {
  return knex.raw(`
    create table correlation(
      left_element text not null,
      right_element text not null,
      correlation text not null,
      primary key(left_element, right_element)
    );

    create table xyz(
      element text not null,
      filename text not null,
      raw text not null,
      coordinates jsonb not null,
      cluster_size int not null,
      energy text not null
    );

    create index ixn_xyz on xyz(element, cluster_size);
  `);
};

module.exports.down = (knex) => {
  // not necessary
}