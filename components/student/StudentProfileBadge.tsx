'use client';

import { useState, useEffect, useCallback } from 'react';

const COOKIE_NAME = 'student_profile';
const DEFAULT_NICKNAME = '小明';
const DEFAULT_YEAR = 27;
const YEAR_OPTIONS = Array.from({ length: 12 }, (_, i) => 24 + i); // 24届 ~ 35届

function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : '';
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
}

type Profile = { nickname: string; year: number };
type ProfileStore = Record<string, Profile>;

function loadProfile(studentId: string): Profile {
  try {
    const raw = getCookie(COOKIE_NAME);
    if (!raw) return { nickname: DEFAULT_NICKNAME, year: DEFAULT_YEAR };
    const store: ProfileStore = JSON.parse(raw);
    const p = store[studentId];
    if (p && typeof p.nickname === 'string' && typeof p.year === 'number') {
      return { nickname: p.nickname, year: p.year };
    }
  } catch {
    // ignore
  }
  return { nickname: DEFAULT_NICKNAME, year: DEFAULT_YEAR };
}

function saveProfile(studentId: string, profile: Profile) {
  try {
    const raw = getCookie(COOKIE_NAME);
    const store: ProfileStore = raw ? JSON.parse(raw) : {};
    store[studentId] = profile;
    setCookie(COOKIE_NAME, JSON.stringify(store));
  } catch {
    // ignore
  }
}

type Props = { studentId: string };

export function StudentProfileBadge({ studentId }: Props) {
  const [profile, setProfile] = useState<Profile>({ nickname: DEFAULT_NICKNAME, year: DEFAULT_YEAR });
  const [open, setOpen] = useState(false);
  const [editNickname, setEditNickname] = useState(profile.nickname);
  const [editYear, setEditYear] = useState(profile.year);

  const refresh = useCallback(() => {
    setProfile(loadProfile(studentId));
  }, [studentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setEditNickname(profile.nickname);
    setEditYear(profile.year);
  }, [profile.nickname, profile.year]);

  const openModal = () => {
    setEditNickname(profile.nickname);
    setEditYear(profile.year);
    setOpen(true);
  };

  const save = () => {
    const next: Profile = {
      nickname: (editNickname || DEFAULT_NICKNAME).trim() || DEFAULT_NICKNAME,
      year: editYear,
    };
    saveProfile(studentId, next);
    setProfile(next);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={openModal}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-500/50 bg-slate-800/80 backdrop-blur-sm text-blue-400 hover:bg-slate-700/80 transition text-sm"
        title="点击编辑昵称与届别"
      >
        <span>{profile.nickname}</span>
        <span className="text-gray-400">·</span>
        <span>{profile.year}届考生</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-hidden />
          <div
            className="relative glass-effect rounded-2xl p-6 w-full max-w-sm shadow-xl border border-blue-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-blue-400 mb-4">编辑资料</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">昵称</label>
                <input
                  type="text"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  placeholder={DEFAULT_NICKNAME}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700/50 text-white placeholder-gray-500 focus:border-cyan-400/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">届别</label>
                <select
                  value={editYear}
                  onChange={(e) => setEditYear(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700/50 text-white focus:border-cyan-400/50 focus:outline-none"
                >
                  {YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y}>
                      {y}届考生
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 text-gray-300 hover:bg-slate-700/80 transition"
              >
                取消
              </button>
              <button
                type="button"
                onClick={save}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition font-medium"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
