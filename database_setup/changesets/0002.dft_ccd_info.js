module.exports.up = (knex) => {
  return knex.raw(`
    create table info(
      id text,
      filename text primary key,
      element text,
      minus_one text,
      plus_one text,
      homo_lumo_gap text,
      valence_electrons text,
      similarities jsonb not null default '[]'::JSONB,
      raw text
    );
    
    create index ixn_info_el on info(element);
    create index ixn_info_id on info(id);

    create table ccd_dft(
      id text,
      kind text,
      filename text primary key,
      element text,
      source text,
      locations jsonb not null default '[]'::JSONB,
      raw text
    );

    create index ixn_ccd_dft_kind on ccd_dft(kind);
    create index ixn_ccd_dft_id on ccd_dft(id);
    create index ixn_ccd_dft_el on ccd_dft(element);
    `);
};

module.exports.down = (knex) => {
  // not necessary
}