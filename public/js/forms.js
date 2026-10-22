/**
 * Beyounge Form Handling & Interactive AI Coach Demo
 */

document.addEventListener('DOMContentLoaded', () => {
  initContactForm();
  initNewsletterForm();
  initDataDeletionForm();
  initAiCoachDemo();
  initCallbackForm();
  initOfficeLocationTabs();
});

// Toast Helper
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  const icon = type === 'success' ? '✓' : '✕';
  toast.innerHTML = `<span style="color: ${type === 'success' ? '#10B981' : '#E11D48'}; font-weight: bold;">${icon}</span> <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Contact Form Handler
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Sending Message...';

    const formData = {
      name: form.querySelector('[name="name"]')?.value,
      email: form.querySelector('[name="email"]')?.value,
      subject: form.querySelector('[name="subject"]')?.value,
      message: form.querySelector('[name="message"]')?.value
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Message sent successfully! We will reach out shortly.', 'success');
        form.reset();
        const successBox = document.getElementById('contactSuccessBox');
        if (successBox) {
          successBox.style.display = 'block';
          const successText = document.getElementById('contactSuccessText');
          if (successText) successText.innerText = data.message;
          successBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } else {
        showToast(data.error || 'Failed to send message. Please check input fields.', 'error');
      }
    } catch (err) {
      showToast('Network error occurred. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

// Newsletter Form Handler
function initNewsletterForm() {
  const forms = document.querySelectorAll('.newsletter-form');
  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      if (!input || !input.value) return;

      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Subscribing...';

      try {
        const res = await fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: input.value })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          showToast(data.message || 'Subscribed! Check your inbox for updates.', 'success');
          input.value = '';
        } else {
          showToast(data.error || 'Subscription failed. Please check your email.', 'error');
        }
      } catch (err) {
        showToast('Network error. Please try again later.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  });
}

// Data Deletion Form Handler
function initDataDeletionForm() {
  const form = document.getElementById('dataDeletionForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Submitting Request...';

    const formData = {
      fullName: form.querySelector('[name="fullName"]')?.value,
      email: form.querySelector('[name="email"]')?.value,
      accountUsername: form.querySelector('[name="accountUsername"]')?.value,
      reason: form.querySelector('[name="reason"]')?.value,
      confirmCheck: form.querySelector('[name="confirmCheck"]')?.checked
    };

    try {
      const res = await fetch('/api/data-deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Data deletion request received. Reference ID: ' + data.requestId, 'success');
        form.reset();
        const successBox = document.getElementById('deletionSuccessBox');
        if (successBox) {
          successBox.style.display = 'block';
          successBox.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        showToast(data.error || 'Failed to submit deletion request.', 'error');
      }
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

// AI Coach Demo Handler
function initAiCoachDemo() {
  const form = document.getElementById('aiCoachDemoForm');
  const responseBox = document.getElementById('aiCoachResponseBox');

  if (!form || !responseBox) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const promptInput = form.querySelector('[name="prompt"]');
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!promptInput || !promptInput.value.trim()) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> AI Thinking...';
    responseBox.innerHTML = '<div style="color: var(--text-muted);">⚡ Beyounge AI Engine analyzing goal & generating optimal response...</div>';

    try {
      const res = await fetch('/api/ai-coach-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptInput.value })
      });

      const data = await res.json();
      if (res.ok && data.response) {
        responseBox.innerHTML = `
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; color: #059669; font-weight: 700; margin-bottom: 0.5rem;">
              <span>🤖 Beyounge AI Coach</span>
              <span class="badge badge-emerald" style="font-size: 0.65rem;">Live AI Recommendation</span>
            </div>
            <div style="line-height: 1.6; color: var(--text-primary); white-space: pre-wrap;">${data.response}</div>
          </div>
        `;
      } else {
        responseBox.innerHTML = `<span style="color: #E11D48;">${data.error || 'Unable to generate recommendation at this moment.'}</span>`;
      }
    } catch (err) {
      responseBox.innerHTML = '<span style="color: #E11D48;">Error connecting to Beyounge AI service. Please try again.</span>';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Ask AI Coach';
    }
  });
}

// Callback Form Handler
function initCallbackForm() {
  const form = document.getElementById('callbackForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Scheduling Call...';

    const formData = {
      name: form.querySelector('[name="callbackName"]')?.value,
      phone: form.querySelector('[name="callbackPhone"]')?.value,
      preferredTime: form.querySelector('[name="callbackTime"]')?.value,
      topic: form.querySelector('[name="callbackTopic"]')?.value
    };

    try {
      const res = await fetch('/api/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, 'success');
        form.reset();
        const successBox = document.getElementById('callbackSuccessBox');
        if (successBox) {
          successBox.style.display = 'block';
          const successMsg = document.getElementById('callbackSuccessMsg');
          if (successMsg) successMsg.innerText = data.message;
        }
      } else {
        showToast(data.error || 'Failed to schedule callback.', 'error');
      }
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

// Office Location Map Switcher
function initOfficeLocationTabs() {
  const tabBtns = document.querySelectorAll('.location-tab-btn');
  const mapIframe = document.getElementById('officeMapIframe');
  const locTitle = document.getElementById('officeTitle');
  const locAddress = document.getElementById('officeAddress');
  const locHours = document.getElementById('officeHours');
  const locDirLink = document.getElementById('officeDirLink');

  if (!tabBtns.length || !mapIframe) return;

  const locations = {
    sf: {
      title: 'Americas HQ - San Francisco, CA',
      address: '500 Howard Street, San Francisco, CA 94105, USA',
      hours: 'Mon - Fri: 8:00 AM - 6:00 PM PST',
      mapUrl: 'https://maps.google.com/maps?q=500%20Howard%20Street%20San%20Francisco%20CA%2094105&t=&z=15&ie=UTF8&iwloc=&output=embed',
      dirUrl: 'https://maps.google.com/?q=500+Howard+Street+San+Francisco+CA'
    },
    london: {
      title: 'EMEA Regional Office - London, UK',
      address: '10 York Road, South Bank, London SE1 7ND, UK',
      hours: 'Mon - Fri: 9:00 AM - 5:30 PM GMT',
      mapUrl: 'https://maps.google.com/maps?q=10%20York%20Road%20London%20SE1%207ND&t=&z=15&ie=UTF8&iwloc=&output=embed',
      dirUrl: 'https://maps.google.com/?q=10+York+Road+London+SE1+7ND'
    },
    singapore: {
      title: 'APAC Regional Hub - Singapore',
      address: '1 Marina Boulevard, #28-00, Singapore 018989',
      hours: 'Mon - Fri: 9:00 AM - 6:00 PM SGT',
      mapUrl: 'https://maps.google.com/maps?q=1%20Marina%20Boulevard%20Singapore&t=&z=15&ie=UTF8&iwloc=&output=embed',
      dirUrl: 'https://maps.google.com/?q=1+Marina+Boulevard+Singapore'
    }
  };

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const locKey = btn.getAttribute('data-location');
      if (!locations[locKey]) return;

      tabBtns.forEach(b => {
        b.classList.remove('btn-primary', 'active');
        b.classList.add('btn-secondary');
      });

      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary', 'active');

      const locData = locations[locKey];
      if (locTitle) locTitle.innerText = locData.title;
      if (locAddress) locAddress.innerText = locData.address;
      if (locHours) locHours.innerText = locData.hours;
      if (locDirLink) locDirLink.setAttribute('href', locData.dirUrl);
      mapIframe.src = locData.mapUrl;
    });
  });
}
