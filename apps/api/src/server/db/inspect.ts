import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

import postgres from 'postgres';

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });

  const sample = await sql`
    select business_name, category, city, google_rating, review_count, has_website, status, phone
    from agency_os.leads
    where source = 'google_maps'
    order by review_count desc nulls last
    limit 5;
  `;
  console.log('Top 5 por reseñas:');
  for (const r of sample) console.log(' ', r.business_name, '|', r.category, '|', r.city, '| ⭐', r.google_rating, '|', r.review_count, 'reseñas |', r.phone);

  const byCity = await sql`
    select city, count(*)::int as n from agency_os.leads
    where source='google_maps' group by city order by n desc limit 5;
  `;
  console.log('\nTop ciudades:', byCity.map((r) => `${r.city}:${r.n}`).join(', '));

  const stats = await sql`
    select count(*)::int total,
           count(*) filter (where google_rating is not null)::int con_rating,
           count(*) filter (where latitude is not null)::int con_geo,
           count(*) filter (where has_website)::int con_web
    from agency_os.leads where source='google_maps';
  `;
  console.log('\nStats:', stats[0]);

  await sql.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
