import { ImageResponse } from 'next/og';
import { getSite } from '@/lib/site';

export const alt = 'Portfolio';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 300;

/** Link preview card, generated from the published name and job title. */
export default async function OpengraphImage() {
  const { profile } = await getSite();
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: 80, background: '#0a0d12', color: '#e8ecf2',
        }}
      >
        <div style={{ display: 'flex', fontSize: 28, letterSpacing: 6, color: '#3dd6c2', textTransform: 'uppercase' }}>
          {profile.jobTitle || 'Portfolio'}
        </div>
        <div style={{ display: 'flex', marginTop: 24, fontSize: 104, fontWeight: 700, lineHeight: 1.05 }}>{profile.name}</div>
        {profile.location ? (
          <div style={{ display: 'flex', marginTop: 32, fontSize: 32, color: '#98a2b3' }}>{profile.location}</div>
        ) : null}
        <div style={{ display: 'flex', marginTop: 56, width: 160, height: 8, background: '#3dd6c2', borderRadius: 4 }} />
      </div>
    ),
    size,
  );
}
