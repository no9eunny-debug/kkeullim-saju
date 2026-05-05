'use client';

import React from 'react';
import { getIlganCharacter } from '@/lib/saju/characters';

interface SajuPillarsProps {
  nickname: string;
  mbti: string;
  yearPillar: { gan: string; ji: string };
  monthPillar: { gan: string; ji: string };
  dayPillar: { gan: string; ji: string };
  timePillar: { gan: string; ji: string } | null;
  ilju: string;
  tti: string;
  ohang: Record<string, number>;
}

const CHEONGAN_HANJA: Record<string, string> = {
  '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊',
  '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸',
};

const JIJI_HANJA: Record<string, string> = {
  '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳',
  '오': '午', '미': '未', '신': '申', '유': '酉', '술': '戌', '해': '亥',
};

const CHEONGAN_OHANG: Record<string, string> = {
  '갑': '목', '을': '목', '병': '화', '정': '화', '무': '토',
  '기': '토', '경': '금', '신': '금', '임': '수', '계': '수',
};

const JIJI_OHANG: Record<string, string> = {
  '자': '수', '축': '토', '인': '목', '묘': '목', '진': '토', '사': '화',
  '오': '화', '미': '토', '신': '금', '유': '금', '술': '토', '해': '수',
};

const OHANG_COLORS: Record<string, string> = {
  '목': '#22c55e',
  '화': '#ef4444',
  '토': '#eab308',
  '금': '#94a3b8',
  '수': '#3b82f6',
};

const OHANG_LABELS: Record<string, string> = {
  '목': '木',
  '화': '火',
  '토': '土',
  '금': '金',
  '수': '水',
};

export default function SajuPillars({
  nickname,
  mbti,
  yearPillar,
  monthPillar,
  dayPillar,
  timePillar,
  ilju,
  tti,
  ohang,
}: SajuPillarsProps) {
  const ilgan = dayPillar.gan;
  const character = getIlganCharacter(ilgan);

  const pillars = [
    { label: '연주', sub: '年', pillar: yearPillar },
    { label: '월주', sub: '月', pillar: monthPillar },
    { label: '일주', sub: '日', pillar: dayPillar },
    { label: '시주', sub: '時', pillar: timePillar },
  ];

  const totalOhang = Object.values(ohang).reduce((a, b) => a + b, 0) || 1;

  return (
    <div style={{
      maxWidth: 480,
      margin: '0 auto',
      background: '#ffffff',
      borderRadius: 20,
      border: '1px solid #E5E8EB',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      padding: '32px 24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Title */}
      <div style={{
        textAlign: 'center',
        marginBottom: 28,
      }}>
        <h2 style={{
          fontSize: 22,
          fontWeight: 700,
          color: '#1a1a1a',
          margin: 0,
          lineHeight: 1.4,
        }}>
          {nickname}님의 사주가 나왔어요
        </h2>
      </div>

      {/* Character Card */}
      {character && (
        <div style={{
          background: character.gradient || character.bgColor || '#f8f9fa',
          borderRadius: 16,
          padding: '24px 20px',
          marginBottom: 24,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Emoji */}
          <div style={{ fontSize: 48, marginBottom: 8 }}>
            {character.emoji}
          </div>

          {/* Title */}
          <div style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: 12,
            textShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            &ldquo;{character.title}&rdquo;형
          </div>

          {/* Badges */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 16,
          }}>
            <span style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.85)',
              borderRadius: 20,
              padding: '4px 12px',
              fontSize: 13,
              fontWeight: 600,
              color: '#4a5568',
              backdropFilter: 'blur(4px)',
            }}>
              {mbti}
            </span>
            <span style={{
              display: 'inline-block',
              background: OHANG_COLORS[CHEONGAN_OHANG[ilgan] || ''] || '#94a3b8',
              borderRadius: 20,
              padding: '4px 12px',
              fontSize: 13,
              fontWeight: 600,
              color: '#ffffff',
            }}>
              {CHEONGAN_OHANG[ilgan] ? `${OHANG_LABELS[CHEONGAN_OHANG[ilgan]]} (${CHEONGAN_OHANG[ilgan]})` : ''}
            </span>
          </div>

          {/* Info Panels */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.75)',
              borderRadius: 12,
              padding: '14px 12px',
              backdropFilter: 'blur(4px)',
            }}>
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#6b7280',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                타고난 성격
              </div>
              <div style={{
                fontSize: 14,
                fontWeight: 500,
                color: '#1f2937',
                lineHeight: 1.5,
              }}>
                {character.keyword}
              </div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.75)',
              borderRadius: 12,
              padding: '14px 12px',
              backdropFilter: 'blur(4px)',
            }}>
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#6b7280',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                타고난 매력
              </div>
              <div style={{
                fontSize: 13,
                fontWeight: 500,
                color: '#1f2937',
                lineHeight: 1.5,
              }}>
                {character.description}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Four Pillars */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10,
        marginBottom: 24,
      }}>
        {pillars.map(({ label, sub, pillar }) => {
          const gan = pillar?.gan || '';
          const ji = pillar?.ji || '';
          const ganOhang = CHEONGAN_OHANG[gan] || '';
          const jiOhang = JIJI_OHANG[ji] || '';
          const accentColor = OHANG_COLORS[ganOhang] || '#94a3b8';

          return (
            <div key={label} style={{
              background: '#fafbfc',
              borderRadius: 14,
              border: '1px solid #E5E8EB',
              padding: '14px 8px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Accent top bar */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: accentColor,
                borderRadius: '14px 14px 0 0',
              }} />

              {/* Label */}
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#6b7280',
                marginBottom: 10,
              }}>
                {label}<span style={{ fontSize: 10, marginLeft: 2, color: '#9ca3af' }}>({sub})</span>
              </div>

              {/* Cheongan Hanja */}
              <div style={{
                fontSize: 44,
                fontWeight: 300,
                color: accentColor,
                lineHeight: 1.1,
                marginBottom: 2,
                fontFamily: 'serif',
              }}>
                {pillar ? (CHEONGAN_HANJA[gan] || '?') : '?'}
              </div>
              <div style={{
                fontSize: 11,
                color: '#9ca3af',
                marginBottom: 10,
              }}>
                {pillar ? gan : '?'}
              </div>

              {/* Divider */}
              <div style={{
                width: '60%',
                height: 1,
                background: '#E5E8EB',
                margin: '0 auto 10px',
              }} />

              {/* Jiji Hanja */}
              <div style={{
                fontSize: 44,
                fontWeight: 300,
                color: OHANG_COLORS[jiOhang] || '#94a3b8',
                lineHeight: 1.1,
                marginBottom: 2,
                fontFamily: 'serif',
              }}>
                {pillar ? (JIJI_HANJA[ji] || '?') : '?'}
              </div>
              <div style={{
                fontSize: 11,
                color: '#9ca3af',
              }}>
                {pillar ? ji : '?'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Info */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 20,
        flexWrap: 'wrap',
      }}>
        <div style={{
          background: '#f3f4f6',
          borderRadius: 8,
          padding: '6px 14px',
          fontSize: 13,
          color: '#4b5563',
        }}>
          <span style={{ fontWeight: 600 }}>띠</span> {tti}
        </div>
        <div style={{
          background: '#f3f4f6',
          borderRadius: 8,
          padding: '6px 14px',
          fontSize: 13,
          color: '#4b5563',
        }}>
          <span style={{ fontWeight: 600 }}>일간</span> {ilgan}({CHEONGAN_HANJA[ilgan] || ''})
        </div>
        <div style={{
          background: '#f3f4f6',
          borderRadius: 8,
          padding: '6px 14px',
          fontSize: 13,
          color: '#4b5563',
        }}>
          <span style={{ fontWeight: 600 }}>일주</span> {ilju}
        </div>
      </div>

      {/* Ohang Distribution Bar */}
      <div style={{ marginTop: 8 }}>
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#6b7280',
          marginBottom: 8,
          textAlign: 'center',
        }}>
          오행 분포
        </div>
        <div style={{
          display: 'flex',
          borderRadius: 8,
          overflow: 'hidden',
          height: 28,
          background: '#f3f4f6',
        }}>
          {Object.entries(ohang)
            .filter(([, count]) => count > 0)
            .sort(([, a], [, b]) => b - a)
            .map(([element, count]) => {
              const percentage = (count / totalOhang) * 100;
              return (
                <div
                  key={element}
                  style={{
                    width: `${percentage}%`,
                    background: OHANG_COLORS[element] || '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#ffffff',
                    minWidth: percentage > 8 ? 'auto' : 0,
                    overflow: 'hidden',
                    transition: 'width 0.6s ease',
                  }}
                >
                  {percentage >= 12 && (
                    <span>{OHANG_LABELS[element]} {count}</span>
                  )}
                </div>
              );
            })}
        </div>
        {/* Legend */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          marginTop: 10,
          flexWrap: 'wrap',
        }}>
          {Object.entries(ohang)
            .filter(([, count]) => count > 0)
            .sort(([, a], [, b]) => b - a)
            .map(([element, count]) => (
              <div key={element} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                color: '#4b5563',
              }}>
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: OHANG_COLORS[element] || '#94a3b8',
                }} />
                <span>{OHANG_LABELS[element]}({element}) {count}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
