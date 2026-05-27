'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Site {
  name: string;
  url: string;
  category: string;
  desc: string;
}

const sites: Site[] = [
  // 电影/电视剧
  { name: '低端影视', url: 'https://ddrk.me', category: '电影', desc: '高清电影电视剧在线观看' },
  { name: '厂长资源', url: 'https://www.czzy77.com', category: '电影', desc: '最新电影免费看' },
  { name: 'LIBVIO', url: 'https://www.libvio.fun', category: '电影', desc: '高清影视资源' },
  { name: '达达龟', url: 'https://www.dadagui.me', category: '电影', desc: '免费电影电视剧' },
  { name: '小嘀咕', url: 'https://www.xiaodigu.com', category: '电影', desc: '影视资源聚合' },
  { name: '奈飞工厂', url: 'https://nefe.cc', category: '电影', desc: 'Netflix影视资源' },
  { name: '欧乐影院', url: 'https://www.olevod.com', category: '电影', desc: '海外影视资源' },
  { name: '独播库', url: 'https://www.duboku.co', category: '电视剧', desc: '热播电视剧在线' },
  { name: '在线之家', url: 'https://www.zxzj.me', category: '电影', desc: '在线影视观看' },
  { name: '555电影', url: 'https://www.555dy.com', category: '电影', desc: '免费高清电影' },
  // 动漫
  { name: '樱花动漫', url: 'https://www.yhmgo.com', category: '动漫', desc: '热门动漫在线观看' },
  { name: '风车动漫', url: 'https://www.dm530.org', category: '动漫', desc: '免费动漫大全' },
  { name: '动漫之家', url: 'https://www.idmzj.com', category: '动漫', desc: '动漫资源聚合' },
  { name: 'AGE动漫', url: 'https://www.agemys.org', category: '动漫', desc: '高清动漫在线' },
  { name: '包子漫画', url: 'https://www.baozimh.com', category: '动漫', desc: '免费漫画阅读' },
  // 综艺
  { name: '大师兄影视', url: 'https://dsxys.com', category: '综艺', desc: '综艺影视资源' },
  { name: '韩剧TV', url: 'https://www.hanjutv.com', category: '综艺', desc: '韩剧综艺在线' },
  { name: '人人影视', url: 'https://www.rrys2019.com', category: '电影', desc: '影视资源分享' },
];

const categories = ['全部', '电影', '电视剧', '动漫', '综艺'];

const categoryColors: Record<string, string> = {
  '电影': '#667eea',
  '电视剧': '#e74c3c',
  '动漫': '#f59e0b',
  '综艺': '#2ecc71',
};

export default function WatchPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('全部');

  const filtered = sites.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.desc.includes(search);
    const matchCat = selectedCat === '全部' || s.category === selectedCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="watch-page">
      <div className="watch-container">
        <div className="watch-header">
          <button onClick={() => router.push('/')} className="watch-back">← 返回首页</button>
          <h1>免费看剧</h1>
          <div style={{ width: '80px' }} />
        </div>

        {/* Search */}
        <div className="watch-search-wrap">
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索网站名称..."
            className="watch-search"
          />
        </div>

        {/* Category tabs */}
        <div className="watch-categories">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setSelectedCat(cat)}
              className={`watch-cat-btn ${selectedCat === cat ? 'active' : ''}`}
              style={{
                background: selectedCat === cat ? (cat === '全部' ? '#667eea' : categoryColors[cat]) : 'rgba(255,255,255,0.06)',
                color: selectedCat === cat ? '#fff' : '#94a3b8',
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Site cards */}
        <div className="watch-grid">
          {filtered.map((site) => (
            <a key={site.url} href={site.url} target="_blank" rel="noopener noreferrer"
              className="watch-card">
              <div className="watch-card-top">
                <span className="watch-card-name">{site.name}</span>
                <span className="watch-card-tag" style={{ background: categoryColors[site.category] + '25', color: categoryColors[site.category] }}>
                  {site.category}
                </span>
              </div>
              <p className="watch-card-desc">{site.desc}</p>
              <div className="watch-card-url">{site.url.replace(/https?:\/\//, '')}</div>
            </a>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="watch-empty">
            <p>没有找到匹配的网站</p>
          </div>
        )}
      </div>
    </div>
  );
}
