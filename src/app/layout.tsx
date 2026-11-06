import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EcoBiz — Nota Pembukuan Hijau UMKM Kuliner',
  description:
    'PWA pembukuan hijau untuk warung makan, gorengan, kedai kopi, dan katering. Catat penjualan, belanja bahan, sisa bahan, dan jelantah dengan hitung hemat transparan.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EcoBiz',
  },
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#013E37',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cleanExtensionAttrsScript = `
    (function() {
      function stripExtAttrs(el) {
        if (!el || el.nodeType !== 1) return;
        var attrs = el.getAttributeNames ? el.getAttributeNames() : [];
        for (var i = 0; i < attrs.length; i++) {
          var name = attrs[i];
          if (
            name === 'bis_skin_checked' ||
            name === 'bis_register' ||
            name.indexOf('__processed_') === 0
          ) {
            el.removeAttribute(name);
          }
        }
      }
      function stripAll(root) {
        if (!root) return;
        stripExtAttrs(root);
        if (root.querySelectorAll) {
          var nodes = root.querySelectorAll('[bis_skin_checked],[bis_register]');
          for (var i = 0; i < nodes.length; i++) {
            stripExtAttrs(nodes[i]);
          }
        }
      }
      stripAll(document.documentElement);
      var observer = new MutationObserver(function(mutations) {
        for (var i = 0; i < mutations.length; i++) {
          var m = mutations[i];
          if (m.type === 'attributes') {
            stripExtAttrs(m.target);
          } else if (m.type === 'childList') {
            for (var j = 0; j < m.addedNodes.length; j++) {
              stripAll(m.addedNodes[j]);
            }
          }
        }
      });
      observer.observe(document.documentElement, {
        attributes: true,
        childList: true,
        subtree: true
      });
      window.addEventListener('load', function() {
        setTimeout(function() { observer.disconnect(); }, 2500);
      });
    })();
  `;

  return (
    <html lang="id" data-theme="emerald" suppressHydrationWarning>
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: cleanExtensionAttrsScript }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=Manjari:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning
        className="antialiased selection:bg-[#FFEFB3] selection:text-[#013E37]"
      >
        {children}
      </body>
    </html>
  );
}
