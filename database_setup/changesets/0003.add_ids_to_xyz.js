module.exports.up = (knex) => {
  return knex.raw(`
    alter table xyz add column id text null;

    create index ixn_xyzid on xyz(id);
  `);
};

module.exports.down = (knex) => {
  // not necessary
}