import { Hono } from 'hono';
import type { Bindings } from '../lib/types';
import {
  SPECIALTY_TAGS, REGIONS, TARGET_AUDIENCES, LECTURE_FORMATS,
} from '../lib/types';
import { uuid, safeJsonArray, isEmail, generateToken, isoExpiresIn } from '../lib/utils';

const app = new Hono<{ Bindings: Bindings }>();

// ============================================
// stitch 다크 디자인 - 강사 섹션 공용 스타일
// (.chip / .step-dot / .radio-card 상태 클래스는 app.js가 토글하므로 여기서 시각 정의)
// ============================================
function StitchInstructorStyles() {
  return (
    <style
      // @ts-ignore
      dangerouslySetInnerHTML={{
        __html: `
          .step-dot {
            width: 40px; height: 40px; border-radius: 9999px;
            display: flex; align-items: center; justify-content: center;
            font-weight: 700; font-size: 14px;
            background: #1c2024; border: 1px solid rgba(255,255,255,0.12);
            color: #c7c5ce; transition: all .3s;
          }
          .step-dot.step-dot-active {
            background: #00D9FF; border-color: #00D9FF; color: #0A0E27;
            box-shadow: 0 0 15px rgba(0,217,255,0.4);
          }
          .step-dot.step-dot-done {
            background: #1c2024; border-color: #00D9FF; color: #00D9FF;
            box-shadow: 0 0 10px rgba(0,217,255,0.2);
          }
          .chip {
            display: inline-flex; align-items: center;
            padding: 8px 16px; border-radius: 9999px; cursor: pointer;
            font-size: 14px; font-weight: 500;
            background: #181c20; border: 1px solid rgba(255,255,255,0.12);
            color: #c7c5ce; transition: all .2s; user-select: none;
          }
          .chip:hover { border-color: #00D9FF; color: #e0e2e7; }
          .chip.chip-selected {
            background: rgba(0,217,255,0.1); border-color: #00D9FF; color: #00D9FF;
            box-shadow: inset 0 0 10px rgba(0,217,255,0.1);
          }
          .radio-card {
            display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
            padding: 10px 20px; border-radius: 8px;
            background: #181c20; border: 1px solid rgba(255,255,255,0.12);
            color: #c7c5ce; transition: all .2s;
          }
          .radio-card:hover { border-color: #00D9FF; }
          .radio-card:has(input:checked) {
            border-color: #00D9FF; background: rgba(0,217,255,0.08); color: #00D9FF;
            box-shadow: inset 0 0 10px rgba(0,217,255,0.1);
          }
        `,
      }}
    />
  );
}

// ============================================
// 강사 등록 페이지 (GET)
// ============================================
app.get('/register', (c) => {
  const stepLabels = ['기본 정보', '전문 분야', '경력 / 포트폴리오', '바이브 코딩'];
  return c.render(
    <>
      <StitchInstructorStyles />

      {/* 헤더 */}
      <section class="relative px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto pt-16 pb-10 text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-glass text-label-caps font-label-caps text-electric-cyan mb-6">
          <span class="material-symbols-outlined text-[16px]">person_add</span>
          INSTRUCTOR REGISTRATION
        </div>
        <h1 class="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface mb-4">
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan to-neon-violet">AI 강사</span>로 등록하세요
        </h1>
        <p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          관리자 심사 후 공개됩니다. 등록 시 입력한 이메일로 언제든 프로필을 수정할 수 있는 매직 링크를 보내드립니다.
        </p>
        <div class="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-body-md text-on-surface-variant">
          <span class="inline-flex items-center gap-1.5"><span class="material-symbols-outlined text-[18px] text-electric-cyan">check_circle</span> 등록비 무료</span>
          <span class="inline-flex items-center gap-1.5"><span class="material-symbols-outlined text-[18px] text-electric-cyan">check_circle</span> 1~2일 내 심사</span>
          <span class="inline-flex items-center gap-1.5"><span class="material-symbols-outlined text-[18px] text-electric-cyan">check_circle</span> 자가 수정 가능</span>
        </div>
      </section>

      <div class="px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto pb-24">
        {/* 단계 표시 + 라벨 */}
        <div class="flex items-center justify-center gap-2 sm:gap-4 mb-10">
          {[1,2,3,4].map(n => (
            <div class="flex items-center gap-2 sm:gap-4">
              <div class="flex flex-col items-center gap-2">
                <div class={`step-dot ${n === 1 ? 'step-dot-active' : ''}`} data-step-dot={n}>{n}</div>
                <div class="font-label-caps text-label-caps text-on-surface-variant hidden sm:block">{stepLabels[n-1]}</div>
              </div>
              {n < 4 && <div class="w-8 sm:w-14 h-0.5 bg-glass-border self-start mt-5"></div>}
            </div>
          ))}
        </div>

      <form id="instructor-form" class="bg-glass rounded-xl p-6 sm:p-10">
        {/* STEP 1 */}
        <div class="step-panel" data-step="1">
          <h2 class="font-headline-md text-headline-md text-on-surface mb-1">기본 정보</h2>
          <p class="text-body-md text-on-surface-variant mb-6">필수 항목을 입력해주세요.</p>
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="form-label">이름 (실명) *</label>
              <input type="text" name="name" class="form-input" placeholder="홍길동" required />
            </div>
            <div>
              <label class="form-label">활동 지역 *</label>
              <select name="region" class="form-input" required>
                <option value="">선택</option>
                {REGIONS.map(r => <option value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label class="form-label">이메일 *</label>
              <input type="email" name="email" class="form-input" placeholder="you@example.com" required />
              <div class="text-label-caps font-label-caps text-on-surface-variant mt-2">수정 권한 매직 링크 발송에 사용됩니다.</div>
            </div>
            <div>
              <label class="form-label">전화번호</label>
              <input type="tel" name="phone" class="form-input" placeholder="010-0000-0000" />
            </div>
          </div>
          <div class="mt-4">
            <label class="form-label">자기소개 한 줄 (최대 100자) *</label>
            <input type="text" name="bio_short" maxlength={100} class="form-input" placeholder="예: 실무 자동화 200건 경험, 대기업 임직원 교육 전문" required />
            <div class="text-label-caps font-label-caps text-on-surface-variant mt-2"><span data-count="bio_short">0</span>/100자 — 강사 카드에 노출됩니다.</div>
          </div>
        </div>

        {/* STEP 2 */}
        <div class="step-panel hidden" data-step="2">
          <h2 class="font-headline-md text-headline-md text-on-surface mb-1">전문 분야</h2>
          <p class="text-body-md text-on-surface-variant mb-6">강의 가능한 분야와 대상을 모두 선택해주세요.</p>

          <div class="mb-6">
            <label class="form-label">전문 분야 (복수 선택) *</label>
            <div class="flex flex-wrap gap-2 mt-2" id="specialty-chips">
              {SPECIALTY_TAGS.map(tag => (
                <span class="chip" data-chip="specialty" data-value={tag}>{tag}</span>
              ))}
            </div>
            <input type="hidden" name="specialty_tags" />
          </div>

          <div class="mb-6">
            <label class="form-label">강의 가능 대상 (복수 선택) *</label>
            <div class="flex flex-wrap gap-2 mt-2" id="audience-chips">
              {TARGET_AUDIENCES.map(t => (
                <span class="chip" data-chip="audience" data-value={t}>{t}</span>
              ))}
            </div>
            <input type="hidden" name="target_audience" />
          </div>

          <div>
            <label class="form-label">강의 형태 *</label>
            <div class="flex flex-wrap gap-3 mt-2">
              {LECTURE_FORMATS.map((f, i) => (
                <label class="radio-card">
                  <input type="radio" name="lecture_format" value={f} required={i === 0} class="sr-only" />
                  <span class="text-body-md font-medium">{f}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* STEP 3 */}
        <div class="step-panel hidden" data-step="3">
          <h2 class="font-headline-md text-headline-md text-on-surface mb-1">경력 & 포트폴리오</h2>
          <p class="text-body-md text-on-surface-variant mb-6">경력 요약은 필수, 나머지는 선택입니다.</p>

          <div class="mb-4">
            <label class="form-label">경력 요약 (최대 500자) *</label>
            <textarea name="career_summary" maxlength={500} rows={5} class="form-input" placeholder="주요 경력, 강의 경험, 전문 분야를 자유롭게 작성해주세요." required></textarea>
            <div class="text-label-caps font-label-caps text-on-surface-variant mt-2"><span data-count="career_summary">0</span>/500자</div>
          </div>

          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="form-label">포트폴리오 URL</label>
              <input type="url" name="portfolio_url" class="form-input" placeholder="https://..." />
            </div>
            <div>
              <label class="form-label">SNS / 유튜브</label>
              <input type="url" name="sns_url" class="form-input" placeholder="https://youtube.com/..." />
            </div>
          </div>

          <div class="mt-4 grid sm:grid-cols-2 gap-4">
            <div>
              <label class="form-label">강의료 범위</label>
              <input type="text" name="fee_range" class="form-input" placeholder="예: 시간당 20~30만원" />
            </div>
            <div class="flex items-end">
              <label class="flex items-center gap-2 cursor-pointer text-on-surface">
                <input type="checkbox" name="fee_public" value="1" class="accent-electric-cyan w-4 h-4" />
                <span class="text-body-md">강의료를 공개합니다</span>
              </label>
            </div>
          </div>
        </div>

        {/* STEP 4: 바이브 코딩 */}
        <div class="step-panel hidden" data-step="4">
          <h2 class="font-headline-md text-headline-md text-on-surface mb-1 flex items-center gap-2">
            <span class="material-symbols-outlined text-electric-cyan">code</span>
            바이브 코딩 포트폴리오
          </h2>
          <p class="text-body-md text-on-surface-variant mb-6">
            바이브 코딩 기반으로 직접 개발한 앱·서비스가 있다면 등록하세요.<br />
            <span class="text-electric-cyan font-medium">1개 이상 등록 시 "바이브 코딩 가능" 배지가 자동으로 부여됩니다.</span> (선택 항목)
          </p>

          <div id="vibe-projects" class="space-y-4"></div>

          <button type="button" id="add-vibe-btn" class="mt-4 w-full inline-flex items-center justify-center gap-2 border border-glass-border bg-glass-fill backdrop-blur-md text-on-surface px-6 py-3 rounded-lg hover:border-electric-cyan hover:text-electric-cyan transition-all">
            <span class="material-symbols-outlined text-[20px]">add</span>
            바이브 코딩 프로젝트 추가
          </button>

          <div class="mt-8 p-4 bg-surface-container-low border border-glass-border rounded-lg">
            <label class="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" name="agree" required class="mt-1 accent-electric-cyan w-4 h-4" />
              <span class="text-body-md text-on-surface-variant">
                <strong class="text-on-surface">개인정보 수집 및 이용 동의 (필수)</strong> — 입력하신 정보는 강사 매칭 및 운영팀 심사 목적으로만 사용되며,
                관련 법령에 따라 안전하게 보관됩니다.
                <a href="/legal/privacy" target="_blank" class="text-electric-cyan underline">자세히 보기</a>
              </span>
            </label>
          </div>
        </div>

        {/* 네비게이션 */}
        <div class="mt-10 flex justify-between items-center gap-3 pt-8 border-t border-glass-border">
          <button type="button" id="prev-step" class="hidden inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface px-6 py-3 rounded-lg hover:bg-glass-fill transition-colors">
            <span class="material-symbols-outlined text-[20px]">arrow_back</span> 이전
          </button>
          <div class="flex-1"></div>
          <button type="button" id="next-step" class="inline-flex items-center gap-2 bg-electric-cyan text-deep-space px-8 py-3 rounded-full font-semibold hover:bg-secondary box-glow transition-all">
            다음 <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
          <button type="submit" id="submit-btn" class="hidden inline-flex items-center gap-2 bg-electric-cyan text-deep-space px-8 py-3 rounded-full font-semibold hover:bg-secondary box-glow transition-all">
            <span class="material-symbols-outlined text-[20px]">send</span> 등록 신청
          </button>
        </div>
      </form>

      <p class="text-center text-label-caps font-label-caps text-on-surface-variant mt-6">
        등록 후 관리자 심사를 거쳐 승인되면 강사 목록에 노출됩니다. 보통 1~2 영업일 소요됩니다.
      </p>
    </div>
    </>,
    { title: '강사 등록', currentPath: '/instructor/register', variant: 'stitch' }
  );
});

// ============================================
// 강사 등록 API (POST)
// ============================================
app.post('/api/register', async (c) => {
  try {
    const body = await c.req.json();
    const {
      name, region, email, phone, bio_short,
      specialty_tags, target_audience, lecture_format,
      career_summary, portfolio_url, sns_url, fee_range, fee_public,
      vibe_coding_projects, agree
    } = body;

    if (!agree) return c.json({ ok: false, error: '개인정보 수집 동의가 필요합니다.' }, 400);
    if (!name || !region || !email || !bio_short || !career_summary || !lecture_format) {
      return c.json({ ok: false, error: '필수 항목이 누락되었습니다.' }, 400);
    }
    if (!isEmail(email)) return c.json({ ok: false, error: '올바른 이메일 형식이 아닙니다.' }, 400);
    if (!Array.isArray(specialty_tags) || specialty_tags.length === 0) {
      return c.json({ ok: false, error: '전문 분야를 1개 이상 선택해주세요.' }, 400);
    }
    if (!Array.isArray(target_audience) || target_audience.length === 0) {
      return c.json({ ok: false, error: '강의 대상을 1개 이상 선택해주세요.' }, 400);
    }

    // 중복 이메일 체크
    const dup = await c.env.DB.prepare('SELECT id FROM instructors WHERE email = ?').bind(email).first();
    if (dup) return c.json({ ok: false, error: '이미 등록된 이메일입니다.' }, 400);

    const id = uuid();
    const vibeProjects = Array.isArray(vibe_coding_projects)
      ? vibe_coding_projects.filter((p: any) => p && p.name) : [];
    const isVibe = vibeProjects.length > 0 ? 1 : 0;

    const editToken = generateToken();
    const editTokenExpires = isoExpiresIn(60 * 24 * 30); // 30일

    await c.env.DB.prepare(`
      INSERT INTO instructors (
        id, name, region, email, phone, specialty_tags, target_audience,
        lecture_format, career_summary, portfolio_url, sns_url,
        vibe_coding_projects, fee_range, fee_public, bio_short,
        is_vibe_coder, status, edit_token, edit_token_expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).bind(
      id, name, region, email, phone || null,
      JSON.stringify(specialty_tags), JSON.stringify(target_audience),
      lecture_format, career_summary, portfolio_url || null, sns_url || null,
      JSON.stringify(vibeProjects), fee_range || null, fee_public ? 1 : 0,
      bio_short, isVibe, editToken, editTokenExpires
    ).run();

    return c.json({ ok: true, id, edit_link: `${c.env.APP_BASE_URL || ''}/instructor/edit/${editToken}` });
  } catch (e: any) {
    return c.json({ ok: false, error: e.message || '서버 오류' }, 500);
  }
});

// ============================================
// 강사 목록 페이지
// ============================================
app.get('/list', async (c) => {
  const tag = c.req.query('tag') || '';
  const region = c.req.query('region') || '';
  const format = c.req.query('format') || '';
  const vibeOnly = c.req.query('vibe') === '1';
  const q = c.req.query('q') || '';

  let sql = `SELECT * FROM instructors WHERE status = 'approved'`;
  const params: any[] = [];
  if (region) { sql += ` AND region = ?`; params.push(region); }
  if (format) { sql += ` AND lecture_format = ?`; params.push(format); }
  if (vibeOnly) { sql += ` AND is_vibe_coder = 1`; }
  if (tag) { sql += ` AND specialty_tags LIKE ?`; params.push(`%${tag}%`); }
  if (q) {
    sql += ` AND (name LIKE ? OR bio_short LIKE ? OR career_summary LIKE ?)`;
    const qq = `%${q}%`; params.push(qq, qq, qq);
  }
  sql += ` ORDER BY is_vibe_coder DESC, created_at DESC LIMIT 100`;

  const rows = await c.env.DB.prepare(sql).bind(...params).all<any>();
  const list = rows.results || [];

  const totalCount = list.length;
  const vibeCount = list.filter((r: any) => r.is_vibe_coder === 1).length;
  const regionSet = new Set(list.map((r: any) => r.region));

  return c.render(
    <>
      <StitchInstructorStyles />

      <div class="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto pt-12 pb-24">
        {/* 헤더 */}
        <header class="mb-12">
          <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-glass text-label-caps font-label-caps text-electric-cyan mb-6">
                <span class="w-2 h-2 rounded-full bg-electric-cyan animate-pulse-slow"></span>
                INSTRUCTOR DIRECTORY · 검증된 강사만
              </div>
              <h1 class="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface mb-4">
                내게 맞는 <span class="text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan to-neon-violet">AI 강사</span>를<br />
                지금 찾아보세요
              </h1>
              <p class="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
                전문 분야·지역·강의 형태로 필터링하고, 바이브 코딩 가능한 실전 강사를 한눈에 확인할 수 있습니다.
              </p>
            </div>
            <div class="flex items-center gap-3">
              <a href="/consult" class="inline-flex items-center gap-2 bg-electric-cyan text-deep-space px-6 py-3 rounded-full font-semibold hover:bg-secondary box-glow transition-all">
                <span class="material-symbols-outlined text-[20px]">forum</span> AI 상담받고 추천받기
              </a>
              <a href="/instructor/register" class="inline-flex items-center gap-2 border border-glass-border bg-glass-fill backdrop-blur-md text-on-surface px-6 py-3 rounded-full hover:border-electric-cyan hover:text-electric-cyan transition-all">
                <span class="material-symbols-outlined text-[20px]">person_add</span> 강사 등록
              </a>
            </div>
          </div>

          {/* 통계 띠 */}
          <div class="mt-10 grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl">
            <div class="bg-glass rounded-xl p-6 flex items-center gap-4">
              <div class="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center border border-glass-border">
                <span class="material-symbols-outlined text-electric-cyan">group</span>
              </div>
              <div>
                <div class="font-headline-md text-headline-md text-on-surface">{totalCount}<span class="text-body-md text-on-surface-variant ml-1">명</span></div>
                <div class="font-label-caps text-label-caps text-on-surface-variant">TOTAL</div>
              </div>
            </div>
            <div class="bg-glass rounded-xl p-6 flex items-center gap-4">
              <div class="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center border border-electric-cyan/30 box-glow">
                <span class="material-symbols-outlined text-electric-cyan">code</span>
              </div>
              <div>
                <div class="font-headline-md text-headline-md text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan to-neon-violet">{vibeCount}<span class="text-body-md text-on-surface-variant ml-1">명</span></div>
                <div class="font-label-caps text-label-caps text-electric-cyan">VIBE CODER</div>
              </div>
            </div>
            <div class="bg-glass rounded-xl p-6 flex items-center gap-4 col-span-2 md:col-span-1">
              <div class="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center border border-glass-border">
                <span class="material-symbols-outlined text-neon-violet">location_on</span>
              </div>
              <div>
                <div class="font-headline-md text-headline-md text-on-surface">{regionSet.size}<span class="text-body-md text-on-surface-variant ml-1">개</span></div>
                <div class="font-label-caps text-label-caps text-on-surface-variant">REGIONS</div>
              </div>
            </div>
          </div>
        </header>

        {/* 필터 바 */}
        <form method="get" class="bg-glass rounded-xl p-5 md:p-6 mb-12">
          <div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div class="relative">
              <label class="form-label">검색</label>
              <span class="material-symbols-outlined absolute left-3 bottom-2.5 text-outline text-[20px]">search</span>
              <input type="text" name="q" value={q} placeholder="이름·키워드 검색" class="form-input pl-10" />
            </div>
            <div>
              <label class="form-label">전문 분야</label>
              <select name="tag" class="form-input">
                <option value="">전체 분야</option>
                {SPECIALTY_TAGS.map(t => <option value={t} selected={tag === t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label class="form-label">지역</label>
              <select name="region" class="form-input">
                <option value="">전체 지역</option>
                {REGIONS.map(r => <option value={r} selected={region === r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label class="form-label">강의 형태</label>
              <select name="format" class="form-input">
                <option value="">전체 형태</option>
                {LECTURE_FORMATS.map(f => <option value={f} selected={format === f}>{f}</option>)}
              </select>
            </div>
            <div class="flex items-center gap-2">
              <label class={`flex items-center gap-2 text-body-md flex-1 px-3 py-3 rounded-lg border cursor-pointer transition ${vibeOnly ? 'border-electric-cyan bg-electric-cyan/10 text-electric-cyan font-semibold box-glow' : 'border-glass-border text-on-surface-variant hover:border-electric-cyan'}`}>
                <input type="checkbox" name="vibe" value="1" checked={vibeOnly} class="accent-electric-cyan w-4 h-4" />
                <span class="material-symbols-outlined text-[16px]">code</span>
                바이브만
              </label>
              <button class="inline-flex items-center justify-center bg-electric-cyan text-deep-space w-12 h-12 rounded-lg hover:bg-secondary box-glow transition-all" aria-label="검색">
                <span class="material-symbols-outlined">search</span>
              </button>
            </div>
          </div>
          {/* 활성 필터 배지 */}
          {(q || tag || region || format || vibeOnly) && (
            <div class="mt-4 flex flex-wrap items-center gap-2 text-body-md">
              <span class="text-on-surface-variant text-label-caps font-label-caps">활성 필터:</span>
              {q && <span class="px-3 py-1 rounded-full bg-surface-container-highest border border-glass-border text-label-caps font-label-caps text-on-surface-variant">"{q}"</span>}
              {tag && <span class="px-3 py-1 rounded-full bg-surface-container-highest border border-glass-border text-label-caps font-label-caps text-on-surface-variant">{tag}</span>}
              {region && <span class="px-3 py-1 rounded-full bg-surface-container-highest border border-glass-border text-label-caps font-label-caps text-on-surface-variant">{region}</span>}
              {format && <span class="px-3 py-1 rounded-full bg-surface-container-highest border border-glass-border text-label-caps font-label-caps text-on-surface-variant">{format}</span>}
              {vibeOnly && <span class="px-3 py-1 rounded-full bg-electric-cyan/10 border border-electric-cyan/50 text-label-caps font-label-caps text-electric-cyan">바이브</span>}
              <a href="/instructor/list" class="text-electric-cyan hover:underline ml-1 text-label-caps font-label-caps">전체 초기화</a>
            </div>
          )}
        </form>

        {/* 결과 헤더 */}
        <div class="flex items-center justify-between mb-6">
          <div class="text-body-md text-on-surface-variant">
            <span class="font-semibold text-on-surface">{totalCount}</span>명의 강사
          </div>
          <div class="text-label-caps font-label-caps text-on-surface-variant inline-flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px]">sort</span> 바이브 코딩 우선 · 최근 등록순
          </div>
        </div>

        {list.length === 0 ? (
          <div class="text-center py-20 bg-glass rounded-xl">
            <div class="w-16 h-16 mx-auto rounded-2xl bg-surface-container flex items-center justify-center mb-4 border border-glass-border">
              <span class="material-symbols-outlined text-[32px] text-outline">search_off</span>
            </div>
            <p class="text-on-surface font-semibold mb-1">조건에 맞는 강사가 아직 없습니다</p>
            <p class="text-body-md text-on-surface-variant mb-6">필터를 조정하거나 AI 상담을 받아보세요.</p>
            <a href="/consult" class="inline-flex items-center gap-2 bg-electric-cyan text-deep-space px-6 py-3 rounded-full font-semibold hover:bg-secondary box-glow transition-all">
              <span class="material-symbols-outlined text-[20px]">forum</span> AI 상담 받기
            </a>
          </div>
        ) : (
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {list.map((row: any, idx: number) => {
              const tags = safeJsonArray<string>(row.specialty_tags);
              const audiences = safeJsonArray<string>(row.target_audience);
              return (
                <a
                  href={`/instructor/${row.id}`}
                  class="block group relative bg-glass rounded-xl p-6 hover:border-electric-cyan/50 transition-all duration-300"
                >
                  <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3">
                      {/* 이니셜 아바타 */}
                      <div class={`w-12 h-12 rounded-xl flex items-center justify-center text-deep-space font-bold text-lg ${row.is_vibe_coder ? 'bg-gradient-to-br from-electric-cyan to-neon-violet box-glow' : 'bg-gradient-to-br from-electric-cyan to-secondary'}`}>
                        {String(row.name || '?').charAt(0)}
                      </div>
                      <div class="leading-tight">
                        <div class="font-headline-md text-body-lg font-bold text-on-surface group-hover:text-electric-cyan transition-colors">{row.name}</div>
                        <div class="text-label-caps font-label-caps text-on-surface-variant mt-1 inline-flex items-center gap-1">
                          <span class="material-symbols-outlined text-[14px]">location_on</span> {row.region}
                        </div>
                      </div>
                    </div>
                    {row.is_vibe_coder ? (
                      <span class="inline-flex items-center gap-1 bg-surface-dim/80 backdrop-blur-md border border-electric-cyan/50 px-2.5 py-1 rounded-full box-glow">
                        <span class="material-symbols-outlined text-[14px] text-electric-cyan">verified</span>
                        <span class="font-label-caps text-label-caps text-electric-cyan">VIBE</span>
                      </span>
                    ) : null}
                  </div>

                  <p class="text-body-md text-on-surface-variant leading-relaxed line-clamp-2 mb-4 min-h-[48px]">
                    {row.bio_short}
                  </p>

                  <div class="flex flex-wrap gap-1.5 mb-4 min-h-[28px]">
                    {tags.slice(0, 3).map(t => <span class="bg-surface-container-highest px-2 py-1 rounded text-[12px] font-semibold text-on-surface-variant border border-glass-border">{t}</span>)}
                    {tags.length > 3 && <span class="bg-surface-container-highest px-2 py-1 rounded text-[12px] font-semibold text-on-surface-variant border border-glass-border">+{tags.length - 3}</span>}
                  </div>

                  <div class="flex items-center justify-between pt-4 border-t border-glass-border text-label-caps font-label-caps text-on-surface-variant">
                    <div class="flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-[16px]">co_present</span>
                      <span>{row.lecture_format}</span>
                    </div>
                    <span class="text-electric-cyan font-semibold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      자세히 <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </>,
    { title: '강사 찾기', currentPath: '/instructor/list', variant: 'stitch' }
  );
});

// ============================================
// 강사 상세 페이지
// ============================================
app.get('/:id', async (c) => {
  const id = c.req.param('id');
  // 예약어 처리: register, list, edit, api 같은 건 다른 라우트에서 먼저 잡힘
  if (['register', 'list', 'api', 'edit'].includes(id)) return c.notFound();

  const row = await c.env.DB.prepare(
    `SELECT * FROM instructors WHERE id = ? AND status = 'approved'`
  ).bind(id).first<any>();

  if (!row) return c.notFound();

  const tags = safeJsonArray<string>(row.specialty_tags);
  const audiences = safeJsonArray<string>(row.target_audience);
  const projects = safeJsonArray<any>(row.vibe_coding_projects);

  return c.render(
    <>
      {/* 히어로 */}
      <section class="relative overflow-hidden px-margin-mobile md:px-margin-desktop max-w-5xl mx-auto pt-8 pb-12">
        <a href="/instructor/list" class="inline-flex items-center gap-2 text-body-md text-on-surface-variant hover:text-electric-cyan mb-8 transition-colors">
          <span class="material-symbols-outlined text-[18px]">arrow_back</span> 강사 목록으로
        </a>

        <div class="grid lg:grid-cols-[auto_1fr] gap-8 items-start">
          {/* 큰 이니셜 아바타 */}
          <div class={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center text-deep-space font-bold text-4xl ${row.is_vibe_coder ? 'bg-gradient-to-br from-electric-cyan via-secondary to-neon-violet box-glow' : 'bg-gradient-to-br from-electric-cyan to-secondary'}`}>
            {String(row.name || '?').charAt(0)}
            {row.is_vibe_coder && (
              <div class="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-surface-container border-2 border-electric-cyan flex items-center justify-center">
                <span class="material-symbols-outlined text-electric-cyan text-[20px]">bolt</span>
              </div>
            )}
          </div>

          <div>
            <div class="flex items-center gap-3 flex-wrap mb-3">
              {row.is_vibe_coder ? (
                <span class="inline-flex items-center gap-1.5 bg-electric-cyan/10 border border-electric-cyan/50 px-3 py-1 rounded-full box-glow">
                  <span class="material-symbols-outlined text-[14px] text-electric-cyan">verified</span>
                  <span class="font-label-caps text-label-caps text-electric-cyan">VIBE CODER</span>
                </span>
              ) : (
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-glass text-label-caps font-label-caps text-on-surface-variant">
                  <span class="material-symbols-outlined text-[14px] text-electric-cyan">check_circle</span> 검증된 강사
                </span>
              )}
              <span class="font-label-caps text-label-caps text-outline">VERIFIED · {new Date(row.updated_at || row.created_at).getFullYear()}</span>
            </div>

            <h1 class="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface">
              {row.name}
            </h1>

            <div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-body-md text-on-surface-variant">
              <span class="inline-flex items-center gap-1.5"><span class="material-symbols-outlined text-[18px] text-electric-cyan">location_on</span>{row.region}</span>
              <span class="inline-flex items-center gap-1.5"><span class="material-symbols-outlined text-[18px] text-electric-cyan">co_present</span>{row.lecture_format}</span>
              {audiences.length > 0 && <span class="inline-flex items-center gap-1.5"><span class="material-symbols-outlined text-[18px] text-electric-cyan">group</span>{audiences.slice(0, 3).join(' · ')}</span>}
            </div>

            <p class="mt-6 font-body-lg text-body-lg text-on-surface leading-relaxed max-w-2xl">{row.bio_short}</p>
          </div>
        </div>
      </section>

      {/* 본문 */}
      <div class="px-margin-mobile md:px-margin-desktop max-w-5xl mx-auto pb-24 grid lg:grid-cols-[1fr_320px] gap-8">
        {/* 메인 컨텐츠 */}
        <div class="space-y-10">
          <section>
            <div class="flex items-center gap-2 mb-4">
              <div class="w-8 h-8 rounded-lg bg-surface-container border border-glass-border flex items-center justify-center">
                <span class="material-symbols-outlined text-electric-cyan text-[18px]">sell</span>
              </div>
              <h2 class="font-headline-md text-body-lg font-bold text-on-surface">전문 분야</h2>
            </div>
            <div class="flex flex-wrap gap-2">
              {tags.map(t => <span class="bg-surface-container-highest px-3 py-1.5 rounded text-body-md font-semibold text-on-surface-variant border border-glass-border">{t}</span>)}
            </div>
          </section>

          <section>
            <div class="flex items-center gap-2 mb-4">
              <div class="w-8 h-8 rounded-lg bg-surface-container border border-glass-border flex items-center justify-center">
                <span class="material-symbols-outlined text-electric-cyan text-[18px]">work</span>
              </div>
              <h2 class="font-headline-md text-body-lg font-bold text-on-surface">경력 요약</h2>
            </div>
            <div class="bg-glass rounded-xl p-6">
              <p class="text-on-surface-variant leading-relaxed whitespace-pre-wrap">{row.career_summary}</p>
            </div>
          </section>

          {projects.length > 0 && (
            <section>
              <div class="flex items-center gap-2 mb-4">
                <div class="w-8 h-8 rounded-lg bg-surface-container border border-electric-cyan/30 flex items-center justify-center box-glow">
                  <span class="material-symbols-outlined text-electric-cyan text-[18px]">code</span>
                </div>
                <h2 class="font-headline-md text-body-lg font-bold text-on-surface">바이브 코딩 포트폴리오</h2>
                <span class="ml-1 bg-electric-cyan/10 border border-electric-cyan/50 px-2.5 py-0.5 rounded-full font-label-caps text-label-caps text-electric-cyan">{projects.length}개</span>
              </div>
              <div class="grid sm:grid-cols-2 gap-4">
                {projects.map((p: any, idx: number) => (
                  <div class="bg-glass rounded-xl p-5 hover:border-electric-cyan/50 transition-all">
                    <div class="flex items-start justify-between mb-3">
                      <div class="w-10 h-10 rounded-lg bg-surface-container border border-glass-border flex items-center justify-center">
                        <span class="material-symbols-outlined text-electric-cyan text-[20px]">memory</span>
                      </div>
                      <span class="font-label-caps text-label-caps text-electric-cyan">PROJECT {String(idx + 1).padStart(2, '0')}</span>
                    </div>
                    <div class="font-bold text-on-surface mb-1.5">{p.name}</div>
                    {p.tools && <div class="text-label-caps text-electric-cyan mb-3 font-mono">{p.tools}</div>}
                    {p.desc && <p class="text-body-md text-on-surface-variant leading-relaxed line-clamp-3 mb-4">{p.desc}</p>}
                    <div class="flex gap-4 text-body-md">
                      {p.url && <a href={p.url} target="_blank" rel="noopener" class="inline-flex items-center gap-1 text-electric-cyan hover:text-on-surface transition-colors"><span class="material-symbols-outlined text-[16px]">open_in_new</span> 실행</a>}
                      {p.github && <a href={p.github} target="_blank" rel="noopener" class="inline-flex items-center gap-1 text-electric-cyan hover:text-on-surface transition-colors"><span class="material-symbols-outlined text-[16px]">code</span> 코드</a>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(row.portfolio_url || row.sns_url || (row.fee_public === 1 && row.fee_range)) && (
            <section>
              <div class="flex items-center gap-2 mb-4">
                <div class="w-8 h-8 rounded-lg bg-surface-container border border-glass-border flex items-center justify-center">
                  <span class="material-symbols-outlined text-electric-cyan text-[18px]">link</span>
                </div>
                <h2 class="font-headline-md text-body-lg font-bold text-on-surface">기타 정보</h2>
              </div>
              <div class="bg-glass rounded-xl p-6 grid sm:grid-cols-2 gap-5">
                {row.portfolio_url && (
                  <div>
                    <div class="font-label-caps text-label-caps text-on-surface-variant mb-1">PORTFOLIO</div>
                    <a href={row.portfolio_url} target="_blank" rel="noopener" class="text-electric-cyan hover:underline text-body-md break-all">{row.portfolio_url}</a>
                  </div>
                )}
                {row.sns_url && (
                  <div>
                    <div class="font-label-caps text-label-caps text-on-surface-variant mb-1">SNS / CHANNEL</div>
                    <a href={row.sns_url} target="_blank" rel="noopener" class="text-electric-cyan hover:underline text-body-md break-all">{row.sns_url}</a>
                  </div>
                )}
                {row.fee_public === 1 && row.fee_range && (
                  <div>
                    <div class="font-label-caps text-label-caps text-on-surface-variant mb-1">FEE RANGE</div>
                    <div class="text-body-md font-medium text-on-surface">{row.fee_range}</div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* 사이드바 — 의뢰 CTA */}
        <aside class="lg:sticky lg:top-24 self-start">
          <div class="bg-glass rounded-xl p-6">
            <div class="font-label-caps text-label-caps text-electric-cyan mb-2">CONTACT</div>
            <h3 class="font-headline-md text-body-lg font-bold text-on-surface mb-2">이 강사에게 의뢰하기</h3>
            <p class="text-body-md text-on-surface-variant mb-5 leading-relaxed">
              한국인공지능교육센터가 의뢰를 검토 후 강사에게 안전하게 중개합니다.
            </p>
            <a href={`/contact/${row.id}`} class="w-full inline-flex items-center justify-center gap-2 bg-electric-cyan text-deep-space px-6 py-3 rounded-full font-semibold hover:bg-secondary box-glow transition-all">
              <span class="material-symbols-outlined text-[20px]">send</span> 의뢰 신청
            </a>
            <div class="mt-5 pt-5 border-t border-glass-border space-y-2.5 text-body-md text-on-surface-variant">
              <div class="flex items-start gap-2">
                <span class="material-symbols-outlined text-electric-cyan text-[18px]">shield</span>
                <span>운영진 검토 후 전달</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="material-symbols-outlined text-electric-cyan text-[18px]">schedule</span>
                <span>1~3 영업일 내 회신</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="material-symbols-outlined text-electric-cyan text-[18px]">paid</span>
                <span>중개 수수료 무료 (베타)</span>
              </div>
            </div>
          </div>

          <div class="mt-4 text-center">
            <a href="/instructor/list" class="inline-flex items-center gap-1 text-label-caps font-label-caps text-on-surface-variant hover:text-electric-cyan transition-colors">
              <span class="material-symbols-outlined text-[16px]">arrow_back</span> 다른 강사 둘러보기
            </a>
          </div>
        </aside>
      </div>
    </>,
    { title: row.name, currentPath: '/instructor', variant: 'stitch' }
  );
});

// ============================================
// 강사 자가 수정 (매직 링크)
// ============================================
app.get('/edit/:token', async (c) => {
  const token = c.req.param('token');
  const row = await c.env.DB.prepare(
    `SELECT * FROM instructors WHERE edit_token = ?`
  ).bind(token).first<any>();

  if (!row) {
    return c.render(
      <div class="max-w-xl mx-auto px-4 py-20 text-center">
        <i class="fas fa-circle-exclamation text-5xl text-amber-500 mb-4"></i>
        <h1 class="text-2xl font-bold mb-2">유효하지 않은 링크</h1>
        <p class="text-brand-sub">수정 링크가 유효하지 않거나 만료되었습니다.</p>
      </div>, { title: '오류' }
    );
  }
  if (row.edit_token_expires_at && new Date(row.edit_token_expires_at).getTime() < Date.now()) {
    return c.render(
      <div class="max-w-xl mx-auto px-4 py-20 text-center">
        <i class="fas fa-clock text-5xl text-amber-500 mb-4"></i>
        <h1 class="text-2xl font-bold mb-2">링크가 만료되었습니다</h1>
        <p class="text-brand-sub mb-6">관리자에게 새 수정 링크 발송을 요청해주세요.</p>
        <a href="/" class="btn btn-primary">메인으로</a>
      </div>, { title: '만료' }
    );
  }

  const tags = safeJsonArray<string>(row.specialty_tags);
  const audiences = safeJsonArray<string>(row.target_audience);
  const projects = safeJsonArray<any>(row.vibe_coding_projects);

  return c.render(
    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 class="text-3xl font-bold mb-2">프로필 수정</h1>
      <p class="text-brand-sub mb-8">
        현재 상태:{' '}
        <span class={`badge badge-status-${row.status}`}>{
          row.status === 'pending' ? '심사 대기' :
          row.status === 'approved' ? '승인됨 (공개)' : '반려됨'
        }</span>
      </p>

      <form id="instructor-edit-form" class="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5"
            data-id={row.id} data-token={token}>
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="label">이름</label>
            <input type="text" name="name" value={row.name} class="input-field" required />
          </div>
          <div>
            <label class="label">활동 지역</label>
            <select name="region" class="input-field" required>
              {REGIONS.map(r => <option value={r} selected={row.region === r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label class="label">이메일 (변경 불가)</label>
            <input type="email" value={row.email} class="input-field" disabled />
          </div>
          <div>
            <label class="label">전화번호</label>
            <input type="tel" name="phone" value={row.phone || ''} class="input-field" />
          </div>
        </div>

        <div>
          <label class="label">자기소개 한 줄</label>
          <input type="text" name="bio_short" maxlength={100} value={row.bio_short} class="input-field" required />
        </div>

        <div>
          <label class="label">전문 분야</label>
          <div class="flex flex-wrap gap-2 mt-2" id="edit-specialty-chips">
            {SPECIALTY_TAGS.map(t => (
              <span class={`chip ${tags.includes(t) ? 'chip-selected' : ''}`} data-chip="specialty" data-value={t}>{t}</span>
            ))}
          </div>
          <input type="hidden" name="specialty_tags" value={JSON.stringify(tags)} />
        </div>

        <div>
          <label class="label">강의 대상</label>
          <div class="flex flex-wrap gap-2 mt-2" id="edit-audience-chips">
            {TARGET_AUDIENCES.map(t => (
              <span class={`chip ${audiences.includes(t) ? 'chip-selected' : ''}`} data-chip="audience" data-value={t}>{t}</span>
            ))}
          </div>
          <input type="hidden" name="target_audience" value={JSON.stringify(audiences)} />
        </div>

        <div>
          <label class="label">강의 형태</label>
          <div class="flex gap-3 mt-2">
            {LECTURE_FORMATS.map(f => (
              <label class="flex items-center gap-2 cursor-pointer px-4 py-2.5 border border-slate-300 rounded-lg">
                <input type="radio" name="lecture_format" value={f} checked={row.lecture_format === f} />
                <span class="text-sm">{f}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label class="label">경력 요약</label>
          <textarea name="career_summary" maxlength={500} class="input-field" required>{row.career_summary}</textarea>
        </div>

        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="label">포트폴리오 URL</label>
            <input type="url" name="portfolio_url" value={row.portfolio_url || ''} class="input-field" />
          </div>
          <div>
            <label class="label">SNS / 유튜브</label>
            <input type="url" name="sns_url" value={row.sns_url || ''} class="input-field" />
          </div>
        </div>

        <div>
          <h3 class="font-bold mb-2 flex items-center gap-2">
            <i class="fas fa-code text-brand-accent"></i> 바이브 코딩 포트폴리오
          </h3>
          <div id="edit-vibe-projects" class="space-y-3"
               data-initial={JSON.stringify(projects)}></div>
          <button type="button" id="edit-add-vibe-btn" class="mt-3 btn btn-secondary">
            <i class="fas fa-plus"></i> 프로젝트 추가
          </button>
        </div>

        <div class="pt-4 border-t border-slate-200">
          <button type="submit" class="btn btn-primary w-full text-base py-3.5">
            <i class="fas fa-save"></i> 저장
          </button>
          <p class="text-xs text-brand-sub mt-2 text-center">
            수정 후 관리자 재심사가 진행될 수 있습니다.
          </p>
        </div>
      </form>
    </div>,
    { title: '프로필 수정', currentPath: '/instructor', variant: 'stitch' }
  );
});

// 자가 수정 API
app.post('/api/edit/:token', async (c) => {
  try {
    const token = c.req.param('token');
    const row = await c.env.DB.prepare(
      'SELECT id, edit_token_expires_at FROM instructors WHERE edit_token = ?'
    ).bind(token).first<any>();
    if (!row) return c.json({ ok: false, error: '유효하지 않은 토큰' }, 404);
    if (row.edit_token_expires_at && new Date(row.edit_token_expires_at).getTime() < Date.now()) {
      return c.json({ ok: false, error: '만료된 토큰' }, 403);
    }

    const body = await c.req.json();
    const {
      name, region, phone, bio_short,
      specialty_tags, target_audience, lecture_format,
      career_summary, portfolio_url, sns_url, vibe_coding_projects,
    } = body;

    const vibe = Array.isArray(vibe_coding_projects)
      ? vibe_coding_projects.filter((p: any) => p && p.name) : [];
    const isVibe = vibe.length > 0 ? 1 : 0;

    await c.env.DB.prepare(`
      UPDATE instructors SET
        name = ?, region = ?, phone = ?, bio_short = ?,
        specialty_tags = ?, target_audience = ?, lecture_format = ?,
        career_summary = ?, portfolio_url = ?, sns_url = ?,
        vibe_coding_projects = ?, is_vibe_coder = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      name, region, phone || null, bio_short,
      JSON.stringify(specialty_tags || []), JSON.stringify(target_audience || []),
      lecture_format, career_summary, portfolio_url || null, sns_url || null,
      JSON.stringify(vibe), isVibe, row.id
    ).run();

    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ ok: false, error: e.message }, 500);
  }
});

export default app;
