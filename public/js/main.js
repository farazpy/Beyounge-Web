/**
 * Beyounge Main Client Script
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initHeaderScroll();
  initFaqAccordion();
  initFaqSearch();
  initBlogFilter();
  initPhoneInteractiveScreen();
  initCopyButtons();
});

// Mobile Drawer Navigation
function initMobileNav() {
  const toggleBtn = document.getElementById('mobileMenuToggle');
  const closeBtn = document.getElementById('mobileMenuClose');
  const drawer = document.getElementById('mobileMenu');
  const overlay = document.getElementById('mobileOverlay');

  if (!toggleBtn || !drawer) return;

  function openDrawer() {
    drawer.classList.add('open');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  toggleBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (overlay) overlay.addEventListener('click', closeDrawer);

  // Close on nav link click
  const links = drawer.querySelectorAll('a');
  links.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });
}

// Sticky Header Effect
function initHeaderScroll() {
  const header = document.querySelector('.header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// FAQ Accordion Toggle
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (!questionBtn) return;

    questionBtn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Close all other items in same list
      const parent = item.closest('.faq-list');
      if (parent) {
        parent.querySelectorAll('.faq-item').forEach(other => {
          other.classList.remove('active');
        });
      }

      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}

// FAQ Search Filter
function initFaqSearch() {
  const searchInput = document.getElementById('faqSearchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
      const question = item.querySelector('.faq-question')?.textContent.toLowerCase() || '';
      const answer = item.querySelector('.faq-answer')?.textContent.toLowerCase() || '';

      if (question.includes(query) || answer.includes(query)) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  });
}

// Blog Category Filter
function initBlogFilter() {
  const filterBtns = document.querySelectorAll('.blog-filter-btn');
  const blogCards = document.querySelectorAll('.blog-card');

  if (!filterBtns.length || !blogCards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('btn-primary'));
      filterBtns.forEach(b => b.classList.add('btn-secondary'));
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary');

      const category = btn.getAttribute('data-category');

      blogCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (category === 'all' || cardCategory === category) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// Interactive Phone Screen Switcher in Hero
function initPhoneInteractiveScreen() {
  const switcherBtns = document.querySelectorAll('.screen-switch-btn');
  const screenContent = document.getElementById('phoneScreenContent');

  if (!switcherBtns.length || !screenContent) return;

  const screens = {
    workout: `
      <div class="app-header-ui">
        <div class="app-user-greeting">
          <h4>Today's AI Workout</h4>
          <p>45 Min • Upper Body Hypertrophy</p>
        </div>
        <span class="badge badge-emerald">Active</span>
      </div>
      <div class="app-card-ai">
        <div class="app-card-ai-title"><i class="lucide-zap"></i> AI Coach Recommendation</div>
        <p class="app-card-ai-body">Your heart rate recovered 14% faster yesterday. Increasing dumbbell press weight by 2.5kg today.</p>
      </div>
      <div class="app-workout-card">
        <div class="app-workout-icon"><i class="lucide-dumbbell"></i></div>
        <div class="app-workout-info">
          <h5>Incline Dumbbell Press</h5>
          <p>4 Sets x 10 Reps • 28 kg</p>
        </div>
      </div>
      <div class="app-workout-card">
        <div class="app-workout-icon"><i class="lucide-activity"></i></div>
        <div class="app-workout-info">
          <h5>Weighted Pull-Ups</h5>
          <p>3 Sets x 8 Reps • +10 kg</p>
        </div>
      </div>
      <div class="app-metric-grid">
        <div class="app-metric-card">
          <span class="app-metric-label">Target Calories</span>
          <div class="app-metric-val">580 kcal</div>
        </div>
        <div class="app-metric-card">
          <span class="app-metric-label">Estimated Time</span>
          <div class="app-metric-val">42 Mins</div>
        </div>
      </div>
    `,
    nutrition: `
      <div class="app-header-ui">
        <div class="app-user-greeting">
          <h4>Macro & Calorie Tracker</h4>
          <p>Target: 2,400 kcal • 180g Protein</p>
        </div>
        <span class="badge badge-cyan">Synced</span>
      </div>
      <div class="app-metric-grid">
        <div class="app-metric-card">
          <span class="app-metric-label">Protein</span>
          <div class="app-metric-val">142g / 180g</div>
          <span class="app-metric-sub">78% completed</span>
        </div>
        <div class="app-metric-card">
          <span class="app-metric-label">Carbs</span>
          <div class="app-metric-val">210g / 260g</div>
          <span class="app-metric-sub">On track</span>
        </div>
      </div>
      <div class="app-card-ai">
        <div class="app-card-ai-title"><i class="lucide-utensils"></i> Dinner Suggestion</div>
        <p class="app-card-ai-body">Grilled Salmon with Quinoa & Asparagus (38g Protein, 480 kcal) to hit your daily macro target.</p>
      </div>
    `,
    analytics: `
      <div class="app-header-ui">
        <div class="app-user-greeting">
          <h4>Weekly Progress</h4>
          <p>Consistency Score: 96%</p>
        </div>
        <span class="badge badge-purple">New PR!</span>
      </div>
      <div class="app-metric-grid">
        <div class="app-metric-card">
          <span class="app-metric-label">Bench Press PR</span>
          <div class="app-metric-val">115 kg</div>
          <span class="app-metric-sub">+5kg this month</span>
        </div>
        <div class="app-metric-card">
          <span class="app-metric-label">Workouts Done</span>
          <div class="app-metric-val">18 Sessions</div>
          <span class="app-metric-sub">Streak: 12 days</span>
        </div>
      </div>
      <div class="app-card-ai">
        <div class="app-card-ai-title"><i class="lucide-trending-up"></i> AI Projection</div>
        <p class="app-card-ai-body">You are on trajectory to hit a 125kg Bench Press by week 6 with current overload protocol.</p>
      </div>
    `
  };

  switcherBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switcherBtns.forEach(b => b.classList.remove('active', 'btn-primary'));
      switcherBtns.forEach(b => b.classList.add('btn-secondary'));
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary', 'active');

      const screenKey = btn.getAttribute('data-screen');
      if (screens[screenKey]) {
        screenContent.style.opacity = '0';
        setTimeout(() => {
          screenContent.innerHTML = screens[screenKey];
          screenContent.style.opacity = '1';
        }, 150);
      }
    });
  });
}

// Copy Buttons for Press Kit Color Hexes
function initCopyButtons() {
  const copyBtns = document.querySelectorAll('.btn-copy');
  copyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-copy');
      if (!textToCopy) return;

      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="lucide-check"></i> Copied!';
        setTimeout(() => {
          btn.innerHTML = originalText;
        }, 2000);
      }).catch(err => {
        console.error('Copy error', err);
      });
    });
  });
}
