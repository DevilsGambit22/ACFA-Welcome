const CLUB_SLUG = 'and-chess-for-all-1';
const MEMBER_GOAL = 1000;
const DEFAULT_PAWN = 'https://www.chess.com/bundles/web/images/user-image.007dad08.svg';

function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + 'y ago';
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + 'mo ago';
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + 'd ago';
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + 'h ago';
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + 'm ago';
  return 'just now';
}

function safeText(value) {
  return String(value || '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[char]));
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

async function loadMembers() {
  const list = document.getElementById('newMembers');
  const memberCount = document.getElementById('memberCount');
  const progressFill = document.getElementById('progressFill');

  try {
    const clubData = await fetchJson(`https://api.chess.com/pub/club/${CLUB_SLUG}/members`);
    const weekly = clubData.weekly || [];
    const monthly = clubData.monthly || [];
    const allMembers = [...weekly, ...monthly];

    const uniqueMembers = Array.from(
      new Map(allMembers.map((member) => [member.username.toLowerCase(), member])).values()
    );

    const newestMembers = uniqueMembers
      .sort((a, b) => b.joined - a.joined)
      .slice(0, 3);

    const totalMembers = uniqueMembers.length;
    memberCount.textContent = `${totalMembers} members`;
    progressFill.style.width = `${Math.min((totalMembers / MEMBER_GOAL) * 100, 100)}%`;

    if (!newestMembers.length) {
      list.innerHTML = '<div class="error-text">No recent members found.</div>';
      return;
    }

    const memberProfiles = await Promise.all(
      newestMembers.map(async (member) => {
        try {
          const profile = await fetchJson(`https://api.chess.com/pub/player/${member.username}`);
          return {
            username: member.username,
            avatar: profile.avatar || DEFAULT_PAWN,
            joined: member.joined
          };
        } catch (error) {
          return {
            username: member.username,
            avatar: DEFAULT_PAWN,
            joined: member.joined
          };
        }
      })
    );

    list.innerHTML = memberProfiles.map((member, index) => {
      const username = safeText(member.username);
      const joinedDate = new Date(member.joined * 1000);
      return `
        <a class="member-card" href="https://www.chess.com/member/${encodeURIComponent(member.username)}" target="_blank" rel="noopener">
          <div class="rank-number">${index + 1}</div>
          <div class="avatar-wrap">
            <img class="avatar" src="${member.avatar}" alt="${username}" onerror="this.src='${DEFAULT_PAWN}'" />
            <div class="new-badge">new</div>
          </div>
          <div class="member-info">
            <span class="member-name">@${username}</span>
            <span class="member-time">◆ ${timeAgo(joinedDate)}</span>
          </div>
        </a>
      `;
    }).join('');
  } catch (error) {
    console.error(error);
    list.innerHTML = '<div class="error-text">Unable to load members.</div>';
    memberCount.textContent = 'Unavailable';
  }
}

loadMembers();
