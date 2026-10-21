// All query-string variants are settings or app views of this one page.
export const SITE_URL = 'https://a10u.github.io/learn-with-Math-Wizard/';

export const SEO_COPY = Object.freeze({
  th: Object.freeze({
    title: 'เกมคณิตศาสตร์ ป.1–6 | Math Wizard Quest',
    description: 'เกมคณิตศาสตร์ ป.1–6 เล่นฟรีบนเว็บ ไม่ต้องสมัคร ฝึกบวก ลบ คูณ หาร เศษส่วน พร้อม Math Simulator 7 ห้อง 21 ภารกิจ ฝึกเขียนตามเส้นประ ไทย–อังกฤษ',
    locale: 'th_TH',
    imageAlt: 'Math Wizard Quest เกมฝึกคิดเลข ป.1–6 เล่นฟรี ไม่ต้องสมัคร',
  }),
  en: Object.freeze({
    title: 'Math Games for Grades 1–6 | Math Wizard Quest',
    description: 'Free math games for Grades 1–6, no sign-up or download. Explore arithmetic, fractions, 7 Math Simulator rooms, 21 missions and number tracing in Thai or English.',
    locale: 'en_US',
    imageAlt: 'Math Wizard Quest: free math games for Grades 1–6, no sign-up required',
  }),
});

export function getSeoMetadata(language = 'th') {
  const selected = language === 'en' ? 'en' : 'th';
  return {
    ...SEO_COPY[selected], language: selected, url: SITE_URL,
    image: `${SITE_URL}assets/og-image.png`,
  };
}

export function createStructuredData(language = 'th') {
  const metadata = getSeoMetadata(language), english = metadata.language === 'en';
  const website = `${SITE_URL}#website`, webpage = `${SITE_URL}#webpage`;
  const app = `${SITE_URL}#app`, organization = `${SITE_URL}#organization`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization', '@id': organization,
        name: 'Math Wizard by DR.Suwan', url: 'https://www.mathwizardtutor.com/',
        logo: { '@type': 'ImageObject', url: `${SITE_URL}assets/logo.jpg` },
      },
      {
        '@type': 'WebSite', '@id': website, url: SITE_URL,
        name: 'Math Wizard Quest', inLanguage: ['th', 'en'],
        publisher: { '@id': organization },
      },
      {
        '@type': 'WebPage', '@id': webpage, url: SITE_URL,
        name: metadata.title, description: metadata.description,
        inLanguage: metadata.language, isPartOf: { '@id': website },
        about: { '@id': app }, publisher: { '@id': organization },
        primaryImageOfPage: {
          '@type': 'ImageObject', url: metadata.image,
          width: 1200, height: 630, caption: metadata.imageAlt,
        },
      },
      {
        '@type': 'WebApplication', '@id': app, url: SITE_URL,
        name: 'Math Wizard Quest', description: metadata.description,
        applicationCategory: 'EducationalApplication', operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript', inLanguage: ['th', 'en'],
        educationalLevel: english ? 'Grades 1–6' : 'ประถมศึกษาปีที่ 1–6',
        audience: { '@type': 'EducationalAudience', educationalRole: 'student' },
        image: metadata.image, publisher: { '@id': organization },
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'THB' },
        featureList: english ? [
          'Math Simulator: 7 interactive rooms and 21 missions',
          '5 dotted-line writing modes: addition, subtraction, multiplication, division and fractions',
          'Math adventure and practice games for Grades 1–6',
          'Thai and English interface',
        ] : [
          'Math Simulator 7 ห้องทดลอง 21 ภารกิจ',
          'เขียนตามเส้นประ 5 โหมด: บวก ลบ คูณ หาร และเศษส่วน',
          'เกมผจญภัยและแบบฝึกคณิตศาสตร์ ป.1–6',
          'สลับภาษาไทยและอังกฤษ',
        ],
      },
    ],
  };
}

/** Update existing head nodes; never insert markup into a partial DOM. */
export function updateSeo(document, language = 'th') {
  const metadata = getSeoMetadata(language);
  if (!document) return metadata;
  document.title = metadata.title;
  const find = (id, selector) => document.getElementById?.(id) || document.querySelector?.(selector);
  const fields = [
    ['seo-description', 'meta[name="description"]', metadata.description],
    ['seo-og-title', 'meta[property="og:title"]', metadata.title],
    ['seo-og-description', 'meta[property="og:description"]', metadata.description],
    ['seo-og-url', 'meta[property="og:url"]', metadata.url],
    ['seo-og-locale', 'meta[property="og:locale"]', metadata.locale],
    ['seo-og-image-alt', 'meta[property="og:image:alt"]', metadata.imageAlt],
    ['seo-twitter-title', 'meta[name="twitter:title"]', metadata.title],
    ['seo-twitter-description', 'meta[name="twitter:description"]', metadata.description],
    ['seo-twitter-image-alt', 'meta[name="twitter:image:alt"]', metadata.imageAlt],
  ];
  for (const [id, selector, content] of fields) find(id, selector)?.setAttribute?.('content', content);
  const structuredData = find('seo-structured-data', 'script[type="application/ld+json"]');
  if (structuredData) structuredData.textContent = JSON.stringify(createStructuredData(metadata.language), null, 2);
  return metadata;
}
