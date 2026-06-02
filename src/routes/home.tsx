import { Hono } from 'hono';
import type { Bindings } from '../lib/types';

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', async (c) => {
  const stats = await c.env.DB.prepare(`
    SELECT
      (SELECT COUNT(*) FROM instructors WHERE status = 'approved') as instructor_count,
      (SELECT COUNT(*) FROM consultations) as consultation_count,
      (SELECT COUNT(*) FROM instructors WHERE is_vibe_coder = 1 AND status = 'approved') as vibe_count
  `).first<{ instructor_count: number; consultation_count: number; vibe_count: number }>().catch(() => null);

  // 바이브 코딩 강사 미리보기 (쇼케이스용)
  const vibeRows = await c.env.DB.prepare(`
    SELECT id, name, region, bio_short, vibe_coding_projects, specialty_tags
    FROM instructors WHERE status='approved' AND is_vibe_coder = 1
    ORDER BY created_at DESC LIMIT 3
  `).all<any>().catch(() => ({ results: [] as any[] }));
  const vibeList = vibeRows.results || [];

  return c.render(
    <>
      {/* ============================================
          HERO — 다크 시네마틱
          ============================================ */}
      <section class="relative min-h-[80vh] flex items-center justify-center px-margin-mobile md:px-margin-desktop pt-20 pb-32 overflow-hidden">
        <div class="absolute inset-0 z-0 pointer-events-none">
          <img
            alt="Abstract digital background"
            class="kaiedu-hero-bg w-full h-full object-cover opacity-40 mix-blend-screen"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDBSB0pQWSOA7h2Jj6A9ojPT57PxcqY4AY9uz6en-wqMGqqBo2FAZEX72fsy46mia01Y_eqCalo2EV8atVXM9OYBOf7hGuSMptEw3GuKX9Byz4SSulb2ib_qeEWnPoUxdiSR1GeO16gtQUQnwknJfyAmFxXHcPtCCTY9H9o9N0MQjZTkgBXYBuvuFmXuCsKm5LGmUmXQ_ARLymwXWF__gEWMOz5iJOKxn7GWLMz9PTMKGJ27GUUdK5iHQYZyG2Ysucu6l1IS1znHiAv"
          />
          <div class="absolute top-1/3 left-1/2 w-[900px] h-[900px] bg-electric-cyan/5 rounded-full blur-[150px] mix-blend-screen transform -translate-x-1/2 -translate-y-1/2"></div>
          <div class="absolute inset-0 bg-gradient-to-b from-transparent to-background"></div>
        </div>
        <div class="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center gap-8">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-glass border border-electric-cyan/30 text-electric-cyan font-label-caps text-label-caps animate-float">
            <span class="w-2 h-2 rounded-full bg-electric-cyan animate-pulse"></span>
            2025년 5월 베타 오픈 · 100% 무료 운영 중
          </div>

          <h1 class="font-display-lg-mobile md:font-display-xl text-display-lg-mobile md:text-display-xl text-on-surface leading-tight text-glow">
            대한민국 AI 교육의<br />
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan to-secondary-fixed">표준을 설계합니다</span>
          </h1>

          <p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            훈련된 AI 강사를 한 자리에. 내 상황에 꼭 맞는 커리큘럼을 10분 만에.<br class="hidden md:block" />
            공급과 수요를 한 번에 잇는 국내 최초 AI 교육 매칭 플랫폼.
          </p>

          <div class="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
            <a
              href="/consult"
              class="bg-electric-cyan text-deep-space px-8 py-4 rounded-full font-bold hover:bg-secondary transition-all duration-300 hover:-translate-y-1 box-glow flex items-center justify-center gap-2 group"
            >
              AI 커리큘럼 상담 받기
              <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </a>
            <a
              href="/instructor/register"
              class="bg-glass hover:bg-glass-fill px-8 py-4 rounded-full text-on-surface border border-glass-border transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              AI 강사로 등록하기
            </a>
          </div>
        </div>
      </section>

      {/* ============================================
          통계 — DB 연동
          ============================================ */}
      {stats && (
        <section class="py-24 px-margin-mobile md:px-margin-desktop bg-surface-container-lowest relative border-y border-glass-border">
          <div class="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 divide-y md:divide-y-0 md:divide-x divide-glass-border">
            <StatBlock n={stats.instructor_count} suffix="명" label="검증된 등록 강사" color="text-electric-cyan" />
            <StatBlock n={stats.consultation_count} suffix="건" label="누적 커리큘럼 설계" color="text-neon-violet" />
            <div class="flex flex-col items-center justify-center p-6 text-center relative group">
              <div class="absolute inset-0 bg-electric-cyan/5 rounded-2xl blur-xl group-hover:bg-electric-cyan/10 transition-colors"></div>
              <span class="font-display-lg text-display-lg text-on-surface font-bold mb-2 relative z-10">
                <span class="counter" data-count={stats.vibe_count}>{stats.vibe_count.toLocaleString()}</span>
                <span class="text-2xl ml-1 text-on-surface-variant">명</span>
              </span>
              <span class="font-headline-md text-headline-md text-on-surface-variant relative z-10">바이브 코딩 검증 강사</span>
            </div>
          </div>
        </section>
      )}

      {/* ============================================
          서비스 가치 — 왜 KAIEDU인가
          ============================================ */}
      <section class="py-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div class="text-center mb-16">
          <h2 class="font-headline-lg text-headline-lg text-on-surface mb-4">왜 KAIEDU인가요?</h2>
          <p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            단순 강사 디렉토리가 아닙니다. AI가 직접 커리큘럼을 설계합니다. 데이터에 기반한 정확한 진단과 검증된 전문가 매칭으로 당신의 시간을 절약합니다.
          </p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="bg-glass rounded-2xl p-8 relative overflow-hidden group hover:-translate-y-2 transition-all duration-300">
            <div class="absolute -right-8 -top-8 w-32 h-32 bg-secondary-container/20 rounded-full blur-2xl group-hover:bg-secondary-container/40 transition-colors"></div>
            <div class="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center mb-6 border border-glass-border text-electric-cyan">
              <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">route</span>
            </div>
            <h3 class="font-headline-md text-headline-md text-on-surface mb-3">10분 맞춤 로드맵</h3>
            <p class="font-body-md text-body-md text-on-surface-variant">
              업종·직무·고민만 답하면 Claude AI가 주차별 학습 로드맵과 추천 도구를 즉시 설계합니다.
            </p>
          </div>

          <div class="bg-glass rounded-2xl p-8 relative overflow-hidden group hover:-translate-y-2 transition-all duration-300 border-electric-cyan/30">
            <div class="absolute inset-0 bg-gradient-to-br from-electric-cyan/5 to-transparent z-0"></div>
            <div class="absolute -right-8 -top-8 w-32 h-32 bg-electric-cyan/20 rounded-full blur-2xl group-hover:bg-electric-cyan/40 transition-colors"></div>
            <div class="relative z-10 flex justify-between items-start mb-6">
              <div class="w-12 h-12 rounded-xl bg-electric-cyan/10 flex items-center justify-center border border-electric-cyan/30 text-electric-cyan">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">terminal</span>
              </div>
              <span class="bg-electric-cyan text-deep-space px-3 py-1 rounded-full font-label-caps text-[10px] font-bold tracking-wider box-glow">UNIQUE</span>
            </div>
            <h3 class="font-headline-md text-headline-md text-on-surface mb-3 relative z-10">바이브 코딩 강사 풀</h3>
            <p class="font-body-md text-body-md text-on-surface-variant relative z-10">
              실제로 AI 앱을 만들어본 강사만 별도 배지로 표시. 국내 유일의 바이브 코딩 검증 시스템입니다.
            </p>
          </div>

          <div class="bg-glass rounded-2xl p-8 relative overflow-hidden group hover:-translate-y-2 transition-all duration-300">
            <div class="absolute -right-8 -top-8 w-32 h-32 bg-neon-violet/20 rounded-full blur-2xl group-hover:bg-neon-violet/40 transition-colors"></div>
            <div class="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center mb-6 border border-glass-border text-neon-violet">
              <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">verified_user</span>
            </div>
            <h3 class="font-headline-md text-headline-md text-on-surface mb-3">검증된 매칭 시스템</h3>
            <p class="font-body-md text-body-md text-on-surface-variant">
              모든 강사는 운영진이 직접 심사·승인. 의뢰는 센터가 검토 후 안전하게 중개해 연결합니다.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          바이브 코딩 쇼케이스 — DB 연동
          ============================================ */}
      <section class="py-32 px-margin-mobile md:px-margin-desktop bg-surface-container-lowest relative border-y border-glass-border overflow-hidden">
        <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div class="absolute top-0 right-0 w-[600px] h-[600px] bg-electric-cyan/5 rounded-full blur-[120px] mix-blend-screen"></div>
          <div class="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-neon-violet/5 rounded-full blur-[120px] mix-blend-screen"></div>
        </div>
        <div class="max-w-container-max mx-auto relative z-10">
          <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
            <div>
              <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-glass border border-electric-cyan/30 text-electric-cyan font-label-caps text-label-caps mb-4">
                <span class="material-symbols-outlined text-sm">terminal</span>
                국내 유일 · VIBE CODING
              </div>
              <h2 class="font-headline-lg text-headline-lg text-on-surface mb-4 leading-tight">
                실제로 <span class="text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan to-secondary-fixed">AI 앱을 만들어본</span><br />
                강사만 모았습니다
              </h2>
              <p class="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
                "들어본 사람"이 아니라 "직접 만든 사람"이 가르칩니다.<br />
                바이브 코딩 강사들의 실제 프로젝트를 미리 확인해보세요.
              </p>
            </div>
            <a
              href="/instructor/list?vibe=1"
              class="bg-glass hover:bg-glass-fill px-8 py-4 rounded-full text-on-surface border border-glass-border transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2 self-start lg:self-end whitespace-nowrap"
            >
              전체 바이브 강사 보기
              <span class="material-symbols-outlined">arrow_forward</span>
            </a>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            {vibeList.length > 0 ? vibeList.map((row: any) => {
              let projects: any[] = [];
              try { projects = JSON.parse(row.vibe_coding_projects || '[]'); } catch {}
              let tags: string[] = [];
              try { tags = JSON.parse(row.specialty_tags || '[]'); } catch {}
              const featured = projects[0];
              return (
                <a
                  href={`/instructor/${row.id}`}
                  class="bg-glass rounded-2xl p-8 relative overflow-hidden group hover:-translate-y-2 transition-all duration-300 border-electric-cyan/20 hover:border-electric-cyan/40 flex flex-col"
                >
                  <div class="absolute -right-8 -top-8 w-32 h-32 bg-electric-cyan/10 rounded-full blur-2xl group-hover:bg-electric-cyan/30 transition-colors"></div>
                  <div class="relative z-10 flex items-start justify-between mb-6">
                    <div class="w-12 h-12 rounded-xl bg-electric-cyan/10 flex items-center justify-center border border-electric-cyan/30 text-electric-cyan">
                      <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">memory</span>
                    </div>
                    <span class="bg-electric-cyan text-deep-space px-3 py-1 rounded-full font-label-caps text-[10px] font-bold tracking-wider box-glow">VIBE CODER</span>
                  </div>
                  <div class="relative z-10 font-headline-md text-headline-md text-on-surface mb-1">{row.name}</div>
                  <div class="relative z-10 flex items-center gap-1 text-xs text-on-surface-variant mb-4">
                    <span class="material-symbols-outlined text-sm">location_on</span>{row.region}
                  </div>
                  <p class="relative z-10 font-body-md text-sm text-on-surface-variant mb-5 min-h-[40px] line-clamp-2">{row.bio_short}</p>
                  {featured && (
                    <div class="relative z-10 bg-surface-container/60 border border-glass-border rounded-lg p-4 mb-4">
                      <div class="font-label-caps text-[10px] text-electric-cyan tracking-wider mb-1">FEATURED PROJECT</div>
                      <div class="text-sm text-on-surface font-semibold mb-1">{featured.name}</div>
                      <div class="text-xs text-on-surface-variant line-clamp-1">{featured.tools}</div>
                    </div>
                  )}
                  <div class="relative z-10 flex flex-wrap gap-2 mt-auto">
                    {tags.slice(0, 2).map((t) => (
                      <span class="text-[10px] px-2.5 py-1 rounded-full bg-surface-container border border-glass-border text-on-surface-variant">{t}</span>
                    ))}
                  </div>
                </a>
              );
            }) : (
              <div class="md:col-span-3 text-center py-16 bg-glass rounded-2xl border border-glass-border">
                <span class="material-symbols-outlined text-5xl text-electric-cyan/40 mb-4">rocket_launch</span>
                <p class="font-headline-md text-on-surface mb-1">곧 첫 바이브 코딩 강사가 등록됩니다</p>
                <p class="text-sm text-on-surface-variant mb-8">바이브 코딩 강사 1호로 등록하시겠어요?</p>
                <a
                  href="/instructor/register"
                  class="inline-flex items-center gap-2 bg-electric-cyan text-deep-space px-8 py-4 rounded-full font-bold hover:bg-secondary transition-all duration-300 hover:-translate-y-1 box-glow"
                >
                  <span class="material-symbols-outlined">bolt</span> 1호 강사로 등록
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============================================
          작동 방식 — 3분이면 충분합니다
          ============================================ */}
      <section class="py-32 px-margin-mobile md:px-margin-desktop relative">
        <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div class="absolute top-1/2 left-1/2 w-[1000px] h-[1000px] bg-electric-cyan/5 rounded-full blur-[150px] mix-blend-screen transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div class="max-w-container-max mx-auto relative z-10">
          <div class="text-center mb-20">
            <div class="inline-block px-4 py-1.5 rounded-full bg-glass border border-electric-cyan/30 text-electric-cyan font-label-caps text-label-caps mb-4">HOW IT WORKS</div>
            <h2 class="font-headline-lg text-headline-lg text-on-surface mb-4">3분이면 충분합니다</h2>
            <p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">복잡한 회원가입 없이, 질문에 답하는 것만으로 끝납니다.</p>
          </div>
          <div class="relative">
            <div class="hidden md:block absolute top-8 left-0 w-full h-[2px] bg-glass-border z-0"></div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
              <StepCard num="01" title="질문에 답하기" desc="업종·직무·AI 경험·고민·목표 등 7가지 질문에 답하세요. 회원가입 없이 익명으로 진행됩니다." />
              <StepCard num="02" title="AI 커리큘럼 받기" desc="Claude Sonnet이 주차별 학습 로드맵과 추천 도구를 30초 안에 생성합니다." delay="0.2s" />
              <StepCard num="03" title="강사 추천 + 연결" desc="태그·지역·바이브 코딩 점수 기반 매칭. 의뢰는 센터가 검토 후 안전하게 중개합니다." delay="0.4s" />
            </div>
          </div>
          <div class="flex justify-center mt-16">
            <a
              href="/consult"
              class="bg-electric-cyan text-deep-space px-8 py-4 rounded-full font-bold hover:bg-secondary transition-all duration-300 hover:-translate-y-1 box-glow flex items-center justify-center gap-2"
            >
              AI 커리큘럼 상담 받기
              <span class="material-symbols-outlined">arrow_forward</span>
            </a>
          </div>
        </div>
      </section>

      {/* ============================================
          신뢰 라인 — 현업에서의 검증된 성과
          ============================================ */}
      <section class="py-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto relative">
        <div class="text-center mb-16">
          <h2 class="font-headline-lg text-headline-lg text-on-surface mb-4">현업에서의 검증된 성과</h2>
          <p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">기업·공공기관·대학 AI 교육 담당자분들이 지금 이 순간 활용 중입니다.</p>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div class="bg-glass rounded-3xl p-10 border border-glass-border relative overflow-hidden h-full flex flex-col justify-center">
            <div class="absolute -left-12 -bottom-12 w-48 h-48 bg-neon-violet/20 rounded-full blur-3xl"></div>
            <div class="space-y-8 relative z-10">
              <div>
                <div class="font-display-lg text-4xl md:text-5xl text-electric-cyan font-bold mb-2">30초</div>
                <div class="font-headline-md text-xl text-on-surface">평균 맞춤 로드맵 생성 시간</div>
                <p class="font-body-md text-on-surface-variant mt-2">Claude AI 기반 실시간 분석으로 대기 시간 없이 즉시 결과를 제공합니다.</p>
              </div>
              <div class="w-full h-px bg-glass-border"></div>
              <div>
                <div class="font-display-lg text-4xl md:text-5xl text-secondary-fixed font-bold mb-2">8주</div>
                <div class="font-headline-md text-xl text-on-surface">맞춤 학습 로드맵 + 추천 강사</div>
                <p class="font-body-md text-on-surface-variant mt-2">바이브 코딩 검증을 통과한 실무진 강사 매칭으로 교육의 질을 보장합니다.</p>
              </div>
            </div>
          </div>
          <div class="space-y-6">
            <div class="bg-glass rounded-2xl p-8 border border-glass-border hover:border-electric-cyan/30 transition-colors">
              <div class="flex items-center gap-4 mb-6">
                <div class="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                  <span class="material-symbols-outlined">corporate_fare</span>
                </div>
                <div>
                  <div class="font-headline-md text-lg text-on-surface">제조업 HRD 담당자</div>
                  <div class="font-body-md text-sm text-on-surface-variant">임직원 AI 실무 교육 도입</div>
                </div>
              </div>
              <p class="font-body-md text-on-surface-variant leading-relaxed">
                "막연했던 AI 교육 방향이 10분 상담으로 명확해졌습니다. 추천받은 강사의 실무 자동화 강의가 특히 큰 도움이 됐어요."
              </p>
            </div>
            <div class="bg-glass rounded-2xl p-8 border border-glass-border hover:border-electric-cyan/30 transition-colors">
              <div class="flex items-center gap-4 mb-6">
                <div class="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                  <span class="material-symbols-outlined">school</span>
                </div>
                <div>
                  <div class="font-headline-md text-lg text-on-surface">공공기관 교육 담당자</div>
                  <div class="font-body-md text-sm text-on-surface-variant">바이브 코딩 워크숍 운영</div>
                </div>
              </div>
              <p class="font-body-md text-on-surface-variant leading-relaxed">
                "실제로 AI 앱을 만들어본 강사가 직접 가르치니 수강 만족도가 확연히 달랐습니다. 검증된 매칭의 힘을 느꼈습니다."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          최종 CTA — 다크
          ============================================ */}
      <section class="py-24 px-margin-mobile md:px-margin-desktop">
        <div class="max-w-container-max mx-auto relative rounded-3xl overflow-hidden bg-surface-container-lowest border border-glass-border p-10 sm:p-16">
          <div class="absolute -top-24 -right-16 w-80 h-80 bg-electric-cyan/10 rounded-full blur-[120px]"></div>
          <div class="absolute -bottom-24 left-1/4 w-72 h-72 bg-neon-violet/10 rounded-full blur-[120px]"></div>
          <div class="relative z-10 max-w-2xl">
            <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-glass border border-electric-cyan/30 text-electric-cyan font-label-caps text-label-caps mb-6">
              <span class="w-2 h-2 rounded-full bg-electric-cyan animate-pulse"></span>
              지금 시작 가능
            </div>
            <h2 class="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-5 text-glow">
              지금 시작하세요.<br />
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan to-secondary-fixed">베타 기간 100% 무료</span>입니다.
            </h2>
            <p class="font-body-lg text-body-lg text-on-surface-variant mb-9">
              AI 교육이 필요한 기업·기관·개인 모두 환영합니다.<br />
              AI를 가르칠 수 있는 강사도 무료로 등록 가능합니다.
            </p>
            <div class="flex flex-col sm:flex-row gap-4">
              <a href="/consult" class="bg-electric-cyan text-deep-space px-8 py-4 rounded-full font-bold hover:bg-secondary transition-all duration-300 hover:-translate-y-1 box-glow flex items-center justify-center gap-2">
                상담 시작하기
                <span class="material-symbols-outlined">arrow_forward</span>
              </a>
              <a href="/instructor/list" class="bg-glass hover:bg-glass-fill px-8 py-4 rounded-full text-on-surface border border-glass-border transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2">
                강사 둘러보기
              </a>
            </div>
          </div>
        </div>
      </section>
    </>,
    { title: '대한민국 AI 교육의 표준을 설계합니다', currentPath: '/', variant: 'stitch' }
  );
});

function StatBlock({ n, suffix, label, color }: { n: number; suffix: string; label: string; color: string }) {
  return (
    <div class="flex flex-col items-center justify-center p-6 text-center">
      <span class={`font-display-lg text-display-lg ${color} font-bold mb-2`}>
        <span class="counter" data-count={n}>{n.toLocaleString()}</span>
        <span class="text-2xl ml-1 text-on-surface-variant">{suffix}</span>
      </span>
      <span class="font-headline-md text-headline-md text-on-surface-variant">{label}</span>
    </div>
  );
}

function StepCard({ num, title, desc, delay }: { num: string; title: string; desc: string; delay?: string }) {
  return (
    <div class="bg-glass rounded-2xl p-8 border border-glass-border" style={delay ? `animation-delay: ${delay}` : ''}>
      <div class="w-16 h-16 rounded-full bg-surface-container-low border border-glass-border flex items-center justify-center mb-6">
        <span class="font-display-lg text-2xl text-electric-cyan font-bold">{num}</span>
      </div>
      <h3 class="font-headline-md text-headline-md text-on-surface mb-3">{title}</h3>
      <p class="font-body-md text-body-md text-on-surface-variant leading-relaxed">{desc}</p>
    </div>
  );
}

export default app;
