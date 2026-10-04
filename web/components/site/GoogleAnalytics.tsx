import Script from 'next/script';
import { safeGaId } from '@/lib/seo';

/** Loads Google Analytics only when a measurement id has been set in the admin panel. */
export function GoogleAnalytics({ id }: { id: string }) {
  const gaId = safeGaId(id);
  if (!gaId) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
      </Script>
    </>
  );
}
