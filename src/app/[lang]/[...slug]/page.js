import { getPageBySlug, getArticles, getCustomRecommendations } from '../../../lib/api/index';
import { notFound } from 'next/navigation';
import { ClientWrapper } from '../../../components/layouts/client-wrapper';
import CommonLayout from '../../../components/layouts/layout';
import Script from 'next/script'

// 添加这个配置来启用动态路由
export const dynamic = 'force-static'

// 如果需要的话，也可以添加这个配置来处理不同的域名
export const dynamicParams = true

// 添加缓存控制
export const revalidate = 86400; // 24小时重新验证一次

// 添加支持的语言列表
const SUPPORTED_LANGUAGES = ['en', 'zh'];

// 主页面组件
export default async function ArticlePage({ params }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { lang, slug } = resolvedParams;
    
    // 检查是否为支持的语言，如果不是则使用默认语言
    const currentLang = SUPPORTED_LANGUAGES.includes(lang) ? lang : 'en';
    
    const fullSlug = Array.isArray(slug) ? slug[slug.length - 1] : slug;
    const articleData = await getPageBySlug(fullSlug, currentLang, 'websitelm.com');

    // 检查文章是否存在且状态为已发布
    if (!articleData?.data || articleData.data.publishStatus !== 'publish') {
      console.error(`Article not found or not published for slug: ${slug}`);
      return notFound();
    }
    
    const article = articleData.data;
    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.description,
      datePublished: article.updatedAt,
      dateModified: article.updatedAt,
      author: {
        '@type': 'Person',
        name: article.author
      },
      publisher: {
        '@type': 'Organization',
        name: 'WebsiteLM',
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
      }
    };

    return (
      <>
        <Script id="article-schema" type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </Script>
        <ClientWrapper>
          <main className="flex-grow">
            <CommonLayout article={article} />
          </main>
        </ClientWrapper>
      </>
    );
  } catch (error) {
    console.error('Error in ArticlePage:', error);
    throw error;
  }
}

function joinArrayWithComma(arr) {
  return Array.isArray(arr) ? arr.filter(Boolean).join(',') : '';
}

export async function generateMetadata({ params }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { lang, slug } = resolvedParams;
    
    // 检查是否为支持的语言，如果不是则使用默认语言
    const currentLang = SUPPORTED_LANGUAGES.includes(lang) ? lang : 'en';
    
    const fullSlug = Array.isArray(slug) ? slug[slug.length - 1] : slug;
    const articleData = await getPageBySlug(fullSlug, currentLang, 'websitelm.com');
    
    if (!articleData?.data || articleData.data.publishStatus !== 'publish') {
      return {
        title: 'Not Found',
        description: 'The page you are looking for does not exist.',
        robots: 'noindex, nofollow' 
      };
    }

    const article = articleData.data;
    const host = process.env.NEXT_PUBLIC_HOST || 'https://websitelm.com';
    
    const metadataBaseUrl = host ? new URL(host) : null;

    return {
      title: article.title, 
      description: article.description,
      keywords: joinArrayWithComma(article.pageStats?.genKeywords) ,
      robots: article.publishStatus === 'publish' ? 'index, follow' : 'noindex, nofollow',
      openGraph: { 
        title: article.title,
        description: article.description,
        type: 'article',
        publishedTime: article.updatedAt,
        modifiedTime: article.updatedAt,  
        locale: lang,
        siteName: '',
        images: [{
          url: '',
          width: 1200,
          height: 630,
          alt: article.title
        }]
      },
      twitter: { 
        card: 'summary_large_image',
        title: article.title,
        description: article.description,
        images: article.coverImage,
        creator: ''
      },
      alternates: {
        canonical: currentLang === 'en' 
          ? `${host}/${fullSlug}`
          : `${host}/${currentLang}/${fullSlug}`,
        languages: {
          'en': `${host}/${fullSlug}`,
          'zh': `${host}/zh/${fullSlug}`,
        }
      },
      metadataBase: metadataBaseUrl,
      authors: [{ name: article.author }],
      category: article.category
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Error',
      description: 'An error occurred while generating metadata.'
    };
  }
}

export async function generateStaticParams() {
  try {
    const response = await getArticles(process.env.CUSTOMER_ID, process.env.TOKEN);
    
    if (!response?.data) {
      console.warn('No articles data received');
      return [];
    }

    const validArticles = response.data.filter(article => 
      article && 
      typeof article.lang === 'string' && 
      typeof article.pageLangId === 'string'
    );

    return validArticles.map((article) => ({
      lang: article.lang,
      slug: article.pageLangId
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return []; 
  }
}
