// State tracking for the playground
let playgroundSettings = {
  mode: 'date',
  accentColor: '#3b82f6',
  darkMode: false,
  showWeekNumbers: false,
  highlightToday: true,
  inline: true,
  firstDayOfWeek: 0,
  minuteInterval: 1,
  datePickerVariant: 'calendar',
  timePickerVariant: 'wheel',
  is24Hour: false,
  showSeconds: false,
  disabled: false,
  locale: 'en-US',
  timezone: '',
  // Extended controls
  minDateEnabled: false,
  maxDateEnabled: false,
  showMarked: true,
  minTimeEnabled: false,
  maxTimeEnabled: false,
  modalPosition: 'center',
  placeholder: 'Select date',
  visible: false,
  maxMultiSelect: 0,
  confirmLabel: 'Confirm',
  clearLabel: 'Clear'
};

// Generate React Native JSX snippet based on playground options
function generateJSX() {
  const {
    mode,
    accentColor,
    darkMode,
    showWeekNumbers,
    highlightToday,
    inline,
    firstDayOfWeek,
    minuteInterval,
    datePickerVariant,
    timePickerVariant,
    is24Hour,
    showSeconds,
    disabled,
    locale,
    timezone,
    minDateEnabled,
    maxDateEnabled,
    showMarked,
    minTimeEnabled,
    maxTimeEnabled,
    modalPosition,
    placeholder,
    visible,
    maxMultiSelect,
    confirmLabel,
    clearLabel
  } = playgroundSettings;
  
  let snippet = `import React, { useState } from 'react';\n`;
  snippet += `import { DateTimePicker } from '@bhavishyjain/react-native-date-time-picker';\n\n`;
  
  // Value type declaration based on mode
  if (mode === 'range') {
    snippet += `// In 'range' mode, value is an object with start and end properties\n`;
    snippet += `const [value, setValue] = useState({ start: null, end: null });\n\n`;
  } else if (mode === 'multi') {
    snippet += `// In 'multi' mode, value is an array of Date objects\n`;
    snippet += `const [value, setValue] = useState([]);\n\n`;
  } else if (mode === 'month') {
    snippet += `// In 'month' mode, value is an object { year: number, month: number }\n`;
    snippet += `const [value, setValue] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() });\n\n`;
  } else if (mode === 'year') {
    snippet += `// In 'year' mode, value is a number (e.g. 2026)\n`;
    snippet += `const [value, setValue] = useState(new Date().getFullYear());\n\n`;
  } else {
    snippet += `const [value, setValue] = useState(new Date());\n\n`;
  }

  snippet += `return (\n`;
  snippet += `  <DateTimePicker\n`;
  snippet += `    mode="${mode}"\n`;
  snippet += `    value={value}\n`;
  snippet += `    onChange={(val) => setValue(val)}\n`;
  
  if (accentColor !== '#3b82f6') {
    snippet += `    accentColor="${accentColor}"\n`;
  }
  if (darkMode) {
    snippet += `    darkMode={true}\n`;
  }
  if (!inline) {
    snippet += `    inline={false}\n`;
    if (modalPosition !== 'bottom') {
      snippet += `    modalPosition="${modalPosition}"\n`;
    }
    if (placeholder !== '') {
      snippet += `    placeholder="${placeholder}"\n`;
    }
    snippet += `    visible={${visible}}\n`;
    if (confirmLabel !== 'Confirm') {
      snippet += `    confirmLabel="${confirmLabel}"\n`;
    }
    if (clearLabel !== 'Clear') {
      snippet += `    clearLabel="${clearLabel}"\n`;
    }
  }
  if (disabled) {
    snippet += `    disabled={true}\n`;
  }
  
  const isDateMode = ['date', 'datetime', 'range', 'multi', 'month'].includes(mode);
  const isTimeMode = ['time', 'datetime'].includes(mode);
  const isCalendarGridActive = (['range', 'multi'].includes(mode)) || (['date', 'datetime'].includes(mode) && datePickerVariant === 'calendar');
  
  if (isDateMode) {
    if (['date', 'datetime'].includes(mode) && datePickerVariant !== 'calendar') {
      snippet += `    datePickerVariant="${datePickerVariant}"\n`;
    }
    if (isCalendarGridActive) {
      if (showWeekNumbers) {
        snippet += `    showWeekNumbers={true}\n`;
      }
      if (!highlightToday) {
        snippet += `    highlightToday={false}\n`;
      }
      if (firstDayOfWeek !== 0) {
        snippet += `    firstDayOfWeek={${firstDayOfWeek}}\n`;
      }
      if (showMarked) {
        snippet += `    markedDates={[\n`;
        snippet += `      { date: new Date(), dot: "${accentColor}" },\n`;
        snippet += `      { date: new Date(Date.now() + 864e5), dot: "#10b981" },\n`;
        snippet += `      { date: new Date(Date.now() - 864e5 * 2), dot: "#f43f5e" }\n`;
        snippet += `    ]}\n`;
      }
    }
    if (minDateEnabled) {
      snippet += `    minDate={new Date(Date.now() - 14 * 864e5)}\n`;
    }
    if (maxDateEnabled) {
      snippet += `    maxDate={new Date(Date.now() + 14 * 864e5)}\n`;
    }
  }
  
  if (isTimeMode) {
    if (timePickerVariant !== 'wheel') {
      snippet += `    timePickerVariant="${timePickerVariant}"\n`;
    }
    if (is24Hour) {
      snippet += `    is24Hour={true}\n`;
    }
    if (showSeconds) {
      snippet += `    showSeconds={true}\n`;
    }
    if (timePickerVariant === 'wheel' && minuteInterval !== 1) {
      snippet += `    minuteInterval={${minuteInterval}}\n`;
    }
    if (minTimeEnabled) {
      snippet += `    minTime="08:00:00"\n`;
    }
    if (maxTimeEnabled) {
      snippet += `    maxTime="20:00:00"\n`;
    }
  }
  
  if (mode === 'multi' && maxMultiSelect > 0) {
    snippet += `    maxMultiSelect={${maxMultiSelect}}\n`;
  }
  
  if (locale !== 'en-US') {
    snippet += `    locale="${locale}"\n`;
  }
  if (timezone !== '') {
    snippet += `    timezone="${timezone}"\n`;
  }
  
  snippet += `  />\n`;
  snippet += `);`;

  document.getElementById('jsx-output').textContent = snippet;
}

// Update settings and notify iframe
function updateDemoSettings() {
  const modeSelect = document.getElementById('picker-mode');
  const darkCheck = document.getElementById('toggle-dark');
  const weeknumsCheck = document.getElementById('toggle-weeknums');
  const todayCheck = document.getElementById('toggle-today');
  const inlineCheck = document.getElementById('toggle-inline');
  const disabledCheck = document.getElementById('toggle-disabled');
  const format24Check = document.getElementById('toggle-24h');
  const secondsCheck = document.getElementById('toggle-seconds');
  const dateVariantSelect = document.getElementById('date-variant');
  const timeVariantSelect = document.getElementById('time-variant');
  const firstDaySelect = document.getElementById('first-day');
  const minuteIntervalSelect = document.getElementById('minute-interval');
  const localeSelect = document.getElementById('picker-locale');
  const timezoneSelect = document.getElementById('picker-timezone');

  // Extended controls
  const dateLimitsCheck = document.getElementById('toggle-date-limits');
  const markedCheck = document.getElementById('toggle-marked');
  const timeLimitsCheck = document.getElementById('toggle-time-limits');
  const maxMultiSelectSelect = document.getElementById('max-multi-select');
  const modalPositionSelect = document.getElementById('modal-position');
  const placeholderInput = document.getElementById('input-placeholder');
  const modalVisibleCheck = document.getElementById('toggle-modal-visible');
  const confirmLabelInput = document.getElementById('input-confirm-label');
  const clearLabelInput = document.getElementById('input-clear-label');

  playgroundSettings.mode = modeSelect.value;
  playgroundSettings.darkMode = darkCheck.checked;
  playgroundSettings.showWeekNumbers = weeknumsCheck.checked;
  playgroundSettings.highlightToday = todayCheck.checked;
  playgroundSettings.inline = inlineCheck.checked;
  playgroundSettings.disabled = disabledCheck.checked;
  playgroundSettings.is24Hour = format24Check.checked;
  playgroundSettings.showSeconds = secondsCheck.checked;
  playgroundSettings.datePickerVariant = dateVariantSelect.value;
  playgroundSettings.timePickerVariant = timeVariantSelect.value;
  playgroundSettings.firstDayOfWeek = parseInt(firstDaySelect.value, 10);
  playgroundSettings.minuteInterval = parseInt(minuteIntervalSelect.value, 10);
  playgroundSettings.locale = localeSelect.value;
  playgroundSettings.timezone = timezoneSelect.value;

  // Sync extended controls
  playgroundSettings.minDateEnabled = dateLimitsCheck.checked;
  playgroundSettings.maxDateEnabled = dateLimitsCheck.checked;
  playgroundSettings.showMarked = markedCheck.checked;
  playgroundSettings.minTimeEnabled = timeLimitsCheck.checked;
  playgroundSettings.maxTimeEnabled = timeLimitsCheck.checked;
  playgroundSettings.maxMultiSelect = parseInt(maxMultiSelectSelect.value, 10);
  playgroundSettings.modalPosition = modalPositionSelect.value;
  playgroundSettings.placeholder = placeholderInput.value;
  playgroundSettings.visible = modalVisibleCheck.checked;
  playgroundSettings.confirmLabel = confirmLabelInput.value;
  playgroundSettings.clearLabel = clearLabelInput.value;

  // Show/Hide irrelevant options dynamically
  const mode = playgroundSettings.mode;
  const isDateMode = ['date', 'datetime', 'range', 'multi', 'month'].includes(mode);
  const isTimeMode = ['time', 'datetime'].includes(mode);
  const isCalendarGridActive = (['range', 'multi'].includes(mode)) || (['date', 'datetime'].includes(mode) && playgroundSettings.datePickerVariant === 'calendar');
  const isTimeActive = isTimeMode;
  const isModalActive = !playgroundSettings.inline;

  const setVisible = (id, visible) => {
    const el = document.getElementById(id);
    if (el) el.style.display = visible ? 'flex' : 'none';
  };

  // 1. DatePicker Style selector and limits: visible if mode has a date element
  setVisible('group-date-variant', ['date', 'datetime'].includes(mode));
  setVisible('group-date-limits', isDateMode);

  // 2. Calendar Grid features (Show Week Numbers, Highlight Today, First Day of Week):
  // visible ONLY if isCalendarGridActive is true
  setVisible('row-weeknums', isCalendarGridActive);
  setVisible('row-today', isCalendarGridActive);
  setVisible('group-first-day', isCalendarGridActive);

  // 3. Time Picker Style, 24h format, seconds toggle, minute interval, and time limits:
  // visible ONLY if isTimeActive is true
  setVisible('group-time-variant', isTimeActive);
  setVisible('row-24h', isTimeActive);
  setVisible('row-seconds', isTimeActive);
  // Minute interval is only relevant if Timepicker Style is "wheel"
  setVisible('group-minute-interval', isTimeActive && playgroundSettings.timePickerVariant === 'wheel');
  setVisible('group-time-limits', isTimeActive);

  // 4. Modal configuration (Position, Placeholder, Modal Visible):
  // visible ONLY if inline Mode is off (isModalActive is true)
  setVisible('group-modal-config', isModalActive);

  // 5. Multi-select settings (Max Multi Select):
  // visible ONLY if mode is 'multi'
  setVisible('group-multi-config', mode === 'multi');

  // 6. Custom button labels: only relevant if inline Mode is off (isModalActive is true)
  setVisible('group-button-labels', isModalActive);

  // Send message to Iframe for real-time config updates without re-loading!
  try {
    const iframe = document.getElementById('demo-iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'UPDATE_SETTINGS',
        settings: playgroundSettings
      }, '*');
    }
  } catch (e) {
    console.error('Error posting message to iframe:', e);
  }

  // Update JSX output
  generateJSX();
}

// Set active accent color button
function setAccent(color, element) {
  playgroundSettings.accentColor = color;
  
  // Update UI active state
  const buttons = document.querySelectorAll('.color-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  element.classList.add('active');

  // Dynamically update root color variables for style syncing on the host page
  document.documentElement.style.setProperty('--color-primary', color);
  
  // Helper to convert hex to rgb
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  document.documentElement.style.setProperty('--color-primary-rgb', `${r}, ${g}, ${b}`);

  // Send to iframe
  try {
    const iframe = document.getElementById('demo-iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'UPDATE_SETTINGS',
        settings: playgroundSettings
      }, '*');
    }
  } catch (e) {
    console.error('Error posting message to iframe:', e);
  }

  generateJSX();
}

// Initialise the playground state on load
window.addEventListener('DOMContentLoaded', () => {
  // Sync HTML inputs with initial state
  document.getElementById('picker-mode').value = playgroundSettings.mode;
  document.getElementById('toggle-dark').checked = playgroundSettings.darkMode;
  document.getElementById('toggle-weeknums').checked = playgroundSettings.showWeekNumbers;
  document.getElementById('toggle-today').checked = playgroundSettings.highlightToday;
  document.getElementById('toggle-inline').checked = playgroundSettings.inline;
  document.getElementById('toggle-disabled').checked = playgroundSettings.disabled;
  document.getElementById('toggle-24h').checked = playgroundSettings.is24Hour;
  document.getElementById('toggle-seconds').checked = playgroundSettings.showSeconds;
  document.getElementById('date-variant').value = playgroundSettings.datePickerVariant;
  document.getElementById('time-variant').value = playgroundSettings.timePickerVariant;
  document.getElementById('first-day').value = playgroundSettings.firstDayOfWeek;
  document.getElementById('minute-interval').value = playgroundSettings.minuteInterval;
  document.getElementById('picker-locale').value = playgroundSettings.locale;
  document.getElementById('picker-timezone').value = playgroundSettings.timezone;

  // Sync new options
  document.getElementById('toggle-date-limits').checked = playgroundSettings.minDateEnabled;
  document.getElementById('toggle-marked').checked = playgroundSettings.showMarked;
  document.getElementById('toggle-time-limits').checked = playgroundSettings.minTimeEnabled;
  document.getElementById('max-multi-select').value = playgroundSettings.maxMultiSelect;
  document.getElementById('modal-position').value = playgroundSettings.modalPosition;
  document.getElementById('input-placeholder').value = playgroundSettings.placeholder;
  document.getElementById('toggle-modal-visible').checked = playgroundSettings.visible;
  document.getElementById('input-confirm-label').value = playgroundSettings.confirmLabel;
  document.getElementById('input-clear-label').value = playgroundSettings.clearLabel;

  // Update visibility on initial load (conditional layout rules)
  updateDemoSettings();
  
  // Set up iframe fallback in case communication needs to wait for mount
  const iframe = document.getElementById('demo-iframe');
  let iframeLoaded = false;
  
  if (iframe) {
    iframe.addEventListener('load', () => {
      let isAppLoaded = false;
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        if (doc && doc.getElementById('root')) {
          isAppLoaded = true;
        }
      } catch (e) {
        // A CORS/cross-origin error here means the iframe loaded a page from a different origin.
        // This usually happens when the user runs the Expo dev server on http://localhost:8081
        // and inputs that URL in the fallback. If so, it is successfully loaded!
        isAppLoaded = true;
      }

      if (isAppLoaded) {
        iframeLoaded = true;
        document.getElementById('iframe-fallback').classList.add('hidden');
        // Sync options right after iframe finishes loading
        setTimeout(() => {
          updateDemoSettings();
        }, 500);
      } else {
        // If doc is accessible but has no #root, it's likely a 404 page or blank page.
        // Keep the fallback overlay visible!
        document.getElementById('iframe-fallback').classList.remove('hidden');
      }
    });

    // Check if the iframe successfully loaded or needs fallback
    setTimeout(() => {
      if (window.location.protocol === 'file:') {
        // file:// protocol always blocks iframe cross-origin, show fallback
        document.getElementById('iframe-fallback').classList.remove('hidden');
      } else {
        try {
          if (!iframeLoaded) {
            let isFallback = true;
            try {
              const doc = iframe.contentDocument || iframe.contentWindow.document;
              if (doc && doc.getElementById('root')) {
                isFallback = false;
              }
            } catch (e) {
              // CORS error means it loaded cross-origin (e.g. localhost:8081)
              isFallback = false;
            }
            if (isFallback) {
              document.getElementById('iframe-fallback').classList.remove('hidden');
            }
          }
        } catch (e) {
          // If we hit a CORS error reading contentWindow.location.href, it means it successfully loaded a cross-origin page!
          document.getElementById('iframe-fallback').classList.add('hidden');
        }
      }
    }, 2500);
  }
});

// Load custom dev server or user-configured iframe URL
function loadCustomIframeUrl() {
  const urlInput = document.getElementById('fallback-url-input');
  const iframe = document.getElementById('demo-iframe');
  if (urlInput && iframe) {
    let url = urlInput.value.trim();
    if (url) {
      if (!/^https?:\/\//i.test(url)) {
        url = 'http://' + url;
      }
      iframe.src = url;
      document.getElementById('iframe-fallback').classList.add('hidden');
    }
  }
}

// Copy installation command to clipboard
function copyInstallCommand() {
  const copyText = document.getElementById('install-text').innerText;
  
  navigator.clipboard.writeText(copyText).then(() => {
    const copyIcon = document.getElementById('copy-icon');
    const checkIcon = document.getElementById('check-icon');
    const card = document.getElementById('install-command-card');
    
    copyIcon.classList.add('hidden');
    checkIcon.classList.remove('hidden');
    card.style.borderColor = '#10b981';
    
    setTimeout(() => {
      copyIcon.classList.remove('hidden');
      checkIcon.classList.add('hidden');
      card.style.borderColor = '#27272a';
    }, 2000);
  });
}

// Copy JSX snippet to clipboard
function copySnippet() {
  const codeText = document.getElementById('jsx-output').textContent;
  navigator.clipboard.writeText(codeText).then(() => {
    const button = document.querySelector('.snippet-header button');
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    button.style.color = '#10b981';
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.color = '';
    }, 2000);
  });
}
