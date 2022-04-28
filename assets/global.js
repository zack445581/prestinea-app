function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}

document.querySelectorAll('[id^="Details-"] summary').forEach((summary) => {
  summary.setAttribute('role', 'button');
  summary.setAttribute('aria-expanded', summary.parentNode.hasAttribute('open'));

  if(summary.nextElementSibling.getAttribute('id')) {
    summary.setAttribute('aria-controls', summary.nextElementSibling.id);
  }

  summary.addEventListener('click', (event) => {
    event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
  });

  if (summary.closest('header-drawer')) return;
  summary.parentElement.addEventListener('keyup', onKeyUpEscape);
});

const trapFocusHandlers = {};

function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (event) => {
    if (
      event.target !== container &&
      event.target !== last &&
      event.target !== first
    )
      return;

    document.addEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function() {
    document.removeEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function(event) {
    if (event.code.toUpperCase() !== 'TAB') return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if (
      (event.target === container || event.target === first) &&
      event.shiftKey
    ) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener('focusout', trapFocusHandlers.focusout);
  document.addEventListener('focusin', trapFocusHandlers.focusin);

  elementToFocus.focus();
}

// Here run the querySelector to figure out if the browser supports :focus-visible or not and run code based on it.
try {
  document.querySelector(":focus-visible");
} catch(e) {
  focusVisiblePolyfill();
}

function focusVisiblePolyfill() {
  const navKeys = ['ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWRIGHT', 'TAB', 'ENTER', 'SPACE', 'ESCAPE', 'HOME', 'END', 'PAGEUP', 'PAGEDOWN']
  let currentFocusedElement = null;
  let mouseClick = null;

  window.addEventListener('keydown', (event) => {
    if(navKeys.includes(event.code.toUpperCase())) {
      mouseClick = false;
    }
  });

  window.addEventListener('mousedown', (event) => {
    mouseClick = true;
  });

  window.addEventListener('focus', () => {
    if (currentFocusedElement) currentFocusedElement.classList.remove('focused');

    if (mouseClick) return;

    currentFocusedElement = document.activeElement;
    currentFocusedElement.classList.add('focused');

  }, true);
}

function pauseAllMedia() {
  document.querySelectorAll('.js-youtube').forEach((video) => {
    video.contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
  });
  document.querySelectorAll('.js-vimeo').forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', '*');
  });
  document.querySelectorAll('video').forEach((video) => video.pause());
  document.querySelectorAll('product-model').forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener('focusin', trapFocusHandlers.focusin);
  document.removeEventListener('focusout', trapFocusHandlers.focusout);
  document.removeEventListener('keydown', trapFocusHandlers.keydown);

  if (elementToFocus) elementToFocus.focus();
}

function onKeyUpEscape(event) {
  if (event.code.toUpperCase() !== 'ESCAPE') return;

  const openDetailsElement = event.target.closest('details[open]');
  if (!openDetailsElement) return;

  const summaryElement = openDetailsElement.querySelector('summary');
  openDetailsElement.removeAttribute('open');
  summaryElement.setAttribute('aria-expanded', false);
  summaryElement.focus();
}

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true })

    this.querySelectorAll('button').forEach(
      (button) => button.addEventListener('click', this.onButtonClick.bind(this))
    );
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    event.target.name === 'plus' ? this.input.stepUp() : this.input.stepDown();
    if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
  }
}

customElements.define('quantity-input', QuantityInput);

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function fetchConfig(type = 'json') {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': `application/${type}` }
  };
}

/*
 * Shopify Common JS
 *
 */
if ((typeof window.Shopify) == 'undefined') {
  window.Shopify = {};
}

Shopify.bind = function(fn, scope) {
  return function() {
    return fn.apply(scope, arguments);
  }
};

Shopify.setSelectorByValue = function(selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function(target, eventName, callback) {
  target.addEventListener ? target.addEventListener(eventName, callback, false) : target.attachEvent('on'+eventName, callback);
};

Shopify.postLink = function(path, options) {
  options = options || {};
  var method = options['method'] || 'post';
  var params = options['parameters'] || {};

  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);

  for(var key in params) {
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function(country_domid, province_domid, options) {
  this.countryEl         = document.getElementById(country_domid);
  this.provinceEl        = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(options['hideElement'] || province_domid);

  Shopify.addListener(this.countryEl, 'change', Shopify.bind(this.countryHandler,this));

  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function() {
    var value = this.countryEl.getAttribute('data-default');
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function() {
    var value = this.provinceEl.getAttribute('data-default');
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function(e) {
    var opt       = this.countryEl.options[this.countryEl.selectedIndex];
    var raw       = opt.getAttribute('data-provinces');
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = 'none';
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement('option');
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = "";
    }
  },

  clearOptions: function(selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function(selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement('option');
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  }
};

class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector('details');

    if (navigator.platform === 'iPhone') document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);

    this.addEventListener('keyup', this.onKeyUp.bind(this));
    this.addEventListener('focusout', this.onFocusOut.bind(this));
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll('summary').forEach(summary => summary.addEventListener('click', this.onSummaryClick.bind(this)));
    this.querySelectorAll('button').forEach(button => button.addEventListener('click', this.onCloseButtonClick.bind(this)));
  }

  onKeyUp(event) {
    if(event.code.toUpperCase() !== 'ESCAPE') return;

    const openDetailsElement = event.target.closest('details[open]');
    if(!openDetailsElement) return;

    openDetailsElement === this.mainDetailsToggle ? this.closeMenuDrawer(event, this.mainDetailsToggle.querySelector('summary')) : this.closeSubmenu(openDetailsElement);
  }

  onSummaryClick(event) {
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const parentMenuElement = detailsElement.closest('.has-submenu');
    const isOpen = detailsElement.hasAttribute('open');
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function addTrapFocus() {
      trapFocus(summaryElement.nextElementSibling, detailsElement.querySelector('button'));
      summaryElement.nextElementSibling.removeEventListener('transitionend', addTrapFocus);
    }

    if (detailsElement === this.mainDetailsToggle) {
      if(isOpen) event.preventDefault();
      isOpen ? this.closeMenuDrawer(event, summaryElement) : this.openMenuDrawer(summaryElement);
    } else {
      setTimeout(() => {
        detailsElement.classList.add('menu-opening');
        summaryElement.setAttribute('aria-expanded', true);
        parentMenuElement && parentMenuElement.classList.add('submenu-open');
        !reducedMotion || reducedMotion.matches ? addTrapFocus() : summaryElement.nextElementSibling.addEventListener('transitionend', addTrapFocus);
      }, 100);
    }
  }

  openMenuDrawer(summaryElement) {
    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
    });
    summaryElement.setAttribute('aria-expanded', true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus = false) {
    if (event === undefined) return;

    this.mainDetailsToggle.classList.remove('menu-opening');
    this.mainDetailsToggle.querySelectorAll('details').forEach(details => {
      details.removeAttribute('open');
      details.classList.remove('menu-opening');
    });
    this.mainDetailsToggle.querySelectorAll('.submenu-open').forEach(submenu => {
      submenu.classList.remove('submenu-open');
    });
    document.body.classList.remove(`overflow-hidden-${this.dataset.breakpoint}`);
    removeTrapFocus(elementToFocus);
    this.closeAnimation(this.mainDetailsToggle);
  }

  onFocusOut(event) {
    setTimeout(() => {
      if (this.mainDetailsToggle.hasAttribute('open') && !this.mainDetailsToggle.contains(document.activeElement)) this.closeMenuDrawer();
    });
  }

  onCloseButtonClick(event) {
    const detailsElement = event.currentTarget.closest('details');
    this.closeSubmenu(detailsElement);
  }

  closeSubmenu(detailsElement) {
    const parentMenuElement = detailsElement.closest('.submenu-open');
    parentMenuElement && parentMenuElement.classList.remove('submenu-open');
    detailsElement.classList.remove('menu-opening');
    detailsElement.querySelector('summary').setAttribute('aria-expanded', false);
    removeTrapFocus(detailsElement.querySelector('summary'));
    this.closeAnimation(detailsElement);
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      } else {
        detailsElement.removeAttribute('open');
        if (detailsElement.closest('details[open]')) {
          trapFocus(detailsElement.closest('details[open]'), detailsElement.querySelector('summary'));
        }
      }
    }

    window.requestAnimationFrame(handleAnimation);
  }
}

customElements.define('menu-drawer', MenuDrawer);

class HeaderDrawer extends MenuDrawer {
  constructor() {
    super();
  }

  openMenuDrawer(summaryElement) {
    this.header = this.header || document.getElementById('shopify-section-header');
    this.borderOffset = this.borderOffset || this.closest('.header-wrapper').classList.contains('header-wrapper--border-bottom') ? 1 : 0;
    document.documentElement.style.setProperty('--header-bottom-position', `${parseInt(this.header.getBoundingClientRect().bottom - this.borderOffset)}px`);
    this.header.classList.add('menu-open');

    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
    });

    summaryElement.setAttribute('aria-expanded', true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus) {
    super.closeMenuDrawer(event, elementToFocus);
    this.header.classList.remove('menu-open');
  }
}

customElements.define('header-drawer', HeaderDrawer);

class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.querySelector('[id^="ModalClose-"]').addEventListener(
      'click',
      this.hide.bind(this, false)
    );
    this.addEventListener('keyup', (event) => {
      if (event.code.toUpperCase() === 'ESCAPE') this.hide();
    });
    if (this.classList.contains('media-modal')) {
      this.addEventListener('pointerup', (event) => {
        if (event.pointerType === 'mouse' && !event.target.closest('deferred-media, product-model')) this.hide();
      });
    } else {
      this.addEventListener('click', (event) => {
        if (event.target === this) this.hide();
      });
    }
  }

  connectedCallback() {
    if (this.moved) return;
    this.moved = true;
    document.body.appendChild(this);
  }

  show(opener) {
    this.openedBy = opener;
    const popup = this.querySelector('.template-popup');
    document.body.classList.add('overflow-hidden');
    this.setAttribute('open', '');
    if (popup) popup.loadContent();
    trapFocus(this, this.querySelector('[role="dialog"]'));
    window.pauseAllMedia();
  }

  hide() {
    document.body.classList.remove('overflow-hidden');
    document.body.dispatchEvent(new CustomEvent('modalClosed'));
    this.removeAttribute('open');
    removeTrapFocus(this.openedBy);
    window.pauseAllMedia();
  }
}
customElements.define('modal-dialog', ModalDialog);

class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button = this.querySelector('button');

    if (!button) return;
    button.addEventListener('click', () => {
      const modal = document.querySelector(this.getAttribute('data-modal'));
      if (modal) modal.show(button);
    });
  }
}
customElements.define('modal-opener', ModalOpener);

class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const poster = this.querySelector('[id^="Deferred-Poster-"]');
    if (!poster) return;
    poster.addEventListener('click', this.loadContent.bind(this));
  }

  loadContent(focus = true) {
    window.pauseAllMedia();
    if (!this.getAttribute('loaded')) {
      const content = document.createElement('div');
      content.appendChild(this.querySelector('template').content.firstElementChild.cloneNode(true));

      this.setAttribute('loaded', true);
      const deferredElement = this.appendChild(content.querySelector('video, model-viewer, iframe'));
      if (focus) deferredElement.focus();
    }
  }
}

customElements.define('deferred-media', DeferredMedia);

class SliderComponent extends HTMLElement {
  constructor() {
    super();
    this.slider = this.querySelector('[id^="Slider-"]');
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.enableSliderLooping = false;
    this.currentPageElement = this.querySelector('.slider-counter--current');
    this.pageTotalElement = this.querySelector('.slider-counter--total');
    this.prevButton = this.querySelector('button[name="previous"]');
    this.nextButton = this.querySelector('button[name="next"]');

    if (!this.slider || !this.nextButton) return;

    this.initPages();
    const resizeObserver = new ResizeObserver(entries => this.initPages());
    resizeObserver.observe(this.slider);

    this.slider.addEventListener('scroll', this.update.bind(this));
    this.prevButton.addEventListener('click', this.onButtonClick.bind(this));
    this.nextButton.addEventListener('click', this.onButtonClick.bind(this));
  }

  initPages() {
    this.sliderItemsToShow = Array.from(this.sliderItems).filter(element => element.clientWidth > 0);
    if (this.sliderItemsToShow.length < 2) return;
    this.sliderItemOffset = this.sliderItemsToShow[1].offsetLeft - this.sliderItemsToShow[0].offsetLeft;
    this.slidesPerPage = Math.floor((this.slider.clientWidth - this.sliderItemsToShow[0].offsetLeft) / this.sliderItemOffset);
    this.totalPages = this.sliderItemsToShow.length - this.slidesPerPage + 1;
    this.update();
  }

  resetPages() {
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.initPages();
  }

  update() {
    const previousPage = this.currentPage;
    this.currentPage = Math.round(this.slider.scrollLeft / this.sliderItemOffset) + 1;

    if (this.currentPageElement && this.pageTotalElement) {
      this.currentPageElement.textContent = this.currentPage;
      this.pageTotalElement.textContent = this.totalPages;
    }

    if (this.currentPage != previousPage) {
      this.dispatchEvent(new CustomEvent('slideChanged', { detail: {
        currentPage: this.currentPage,
        currentElement: this.sliderItemsToShow[this.currentPage - 1]
      }}));
    }

    if (this.enableSliderLooping) return;

    if (this.isSlideVisible(this.sliderItemsToShow[0]) && this.slider.scrollLeft === 0) {
      this.prevButton.setAttribute('disabled', 'disabled');
    } else {
      this.prevButton.removeAttribute('disabled');
    }

    if (this.isSlideVisible(this.sliderItemsToShow[this.sliderItemsToShow.length - 1])) {
      this.nextButton.setAttribute('disabled', 'disabled');
    } else {
      this.nextButton.removeAttribute('disabled');
    }
  }

  isSlideVisible(element, offset = 0) {
    const lastVisibleSlide = this.slider.clientWidth + this.slider.scrollLeft - offset;
    return (element.offsetLeft + element.clientWidth) <= lastVisibleSlide && element.offsetLeft >= this.slider.scrollLeft;
  }

  onButtonClick(event) {
    event.preventDefault();
    const step = event.currentTarget.dataset.step || 1;
    this.slideScrollPosition = event.currentTarget.name === 'next' ? this.slider.scrollLeft + (step * this.sliderItemOffset) : this.slider.scrollLeft - (step * this.sliderItemOffset);
    this.slider.scrollTo({
      left: this.slideScrollPosition
    });
  }
}

customElements.define('slider-component', SliderComponent);

class SlideshowComponent extends SliderComponent {
  constructor() {
    super();
    this.sliderControlWrapper = this.querySelector('.slider-buttons');
    this.enableSliderLooping = true;

    if (!this.sliderControlWrapper) return;

    this.sliderFirstItemNode = this.slider.querySelector('.slideshow__slide');
    if (this.sliderItemsToShow.length > 0) this.currentPage = 1;

    this.sliderControlLinksArray = Array.from(this.sliderControlWrapper.querySelectorAll('.slider-counter__link'));
    this.sliderControlLinksArray.forEach(link => link.addEventListener('click', this.linkToSlide.bind(this)));
    this.slider.addEventListener('scroll', this.setSlideVisibility.bind(this));
    this.setSlideVisibility();

    if (this.slider.getAttribute('data-autoplay') === 'true') this.setAutoPlay();
  }

  setAutoPlay() {
    this.sliderAutoplayButton = this.querySelector('.slideshow__autoplay');
    this.autoplaySpeed = this.slider.dataset.speed * 1000;

    this.sliderAutoplayButton.addEventListener('click', this.autoPlayToggle.bind(this));
    this.addEventListener('mouseover', this.focusInHandling.bind(this));
    this.addEventListener('mouseleave', this.focusOutHandling.bind(this));
    this.addEventListener('focusin', this.focusInHandling.bind(this));
    this.addEventListener('focusout', this.focusOutHandling.bind(this));

    this.play();
    this.autoplayButtonIsSetToPlay = true;
  }

  onButtonClick(event) {
    super.onButtonClick(event);
    const isFirstSlide = this.currentPage === 1;
    const isLastSlide = this.currentPage === this.sliderItemsToShow.length;

    if (!isFirstSlide && !isLastSlide) return;

    if (isFirstSlide && event.currentTarget.name === 'previous') {
      this.slideScrollPosition = this.slider.scrollLeft + this.sliderFirstItemNode.clientWidth * this.sliderItemsToShow.length;
    } else if (isLastSlide && event.currentTarget.name === 'next') {
      this.slideScrollPosition = 0;
    }
    this.slider.scrollTo({
      left: this.slideScrollPosition
    });
  }

  update() {
    super.update();
    this.sliderControlButtons = this.querySelectorAll('.slider-counter__link');
    this.prevButton.removeAttribute('disabled');

    if (!this.sliderControlButtons.length) return;

    this.sliderControlButtons.forEach(link => {
      link.classList.remove('slider-counter__link--active');
      link.removeAttribute('aria-current');
    });
    this.sliderControlButtons[this.currentPage - 1].classList.add('slider-counter__link--active');
    this.sliderControlButtons[this.currentPage - 1].setAttribute('aria-current', true);
  }

  autoPlayToggle() {
    this.togglePlayButtonState(this.autoplayButtonIsSetToPlay);
    this.autoplayButtonIsSetToPlay ? this.pause() : this.play();
    this.autoplayButtonIsSetToPlay = !this.autoplayButtonIsSetToPlay;
  }

  focusOutHandling(event) {
    const focusedOnAutoplayButton = event.target === this.sliderAutoplayButton || this.sliderAutoplayButton.contains(event.target);
    if (!this.autoplayButtonIsSetToPlay || focusedOnAutoplayButton) return;
    this.play();
  }

  focusInHandling(event) {
    const focusedOnAutoplayButton = event.target === this.sliderAutoplayButton || this.sliderAutoplayButton.contains(event.target);
    if (focusedOnAutoplayButton && this.autoplayButtonIsSetToPlay) {
      this.play();
    } else if (this.autoplayButtonIsSetToPlay) {
      this.pause();
    }
  }

  play() {
    this.slider.setAttribute('aria-live', 'off');
    clearInterval(this.autoplay);
    this.autoplay = setInterval(this.autoRotateSlides.bind(this), this.autoplaySpeed);
  }

  pause() {
    this.slider.setAttribute('aria-live', 'polite');
    clearInterval(this.autoplay);
  }

  togglePlayButtonState(pauseAutoplay) {
    if (pauseAutoplay) {
      this.sliderAutoplayButton.classList.add('slideshow__autoplay--paused');
      this.sliderAutoplayButton.setAttribute('aria-label', window.accessibilityStrings.playSlideshow);
    } else {
      this.sliderAutoplayButton.classList.remove('slideshow__autoplay--paused');
      this.sliderAutoplayButton.setAttribute('aria-label', window.accessibilityStrings.pauseSlideshow);
    }
  }

  autoRotateSlides() {
    const slideScrollPosition = this.currentPage === this.sliderItems.length ? 0 : this.slider.scrollLeft + this.slider.querySelector('.slideshow__slide').clientWidth;
    this.slider.scrollTo({
      left: slideScrollPosition
    });
  }

  setSlideVisibility() {
    this.sliderItemsToShow.forEach((item, index) => {
      const button = item.querySelector('a');
      if (index === this.currentPage - 1) {
        if (button) button.removeAttribute('tabindex');
        item.setAttribute('aria-hidden', 'false');
        item.removeAttribute('tabindex');
      } else {
        if (button) button.setAttribute('tabindex', '-1');
        item.setAttribute('aria-hidden', 'true');
        item.setAttribute('tabindex', '-1');
      }
    });
  }

  linkToSlide(event) {
    event.preventDefault();
    const slideScrollPosition = this.slider.scrollLeft + this.sliderFirstItemNode.clientWidth * (this.sliderControlLinksArray.indexOf(event.currentTarget) + 1 - this.currentPage);
    this.slider.scrollTo({
      left: slideScrollPosition
    });
  }
}

customElements.define('slideshow-component', SlideshowComponent);

class VariantSelects extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('change', this.onVariantChange);
  }

  onVariantChange() {
    this.updateOptions();
    this.updateMasterId();
    this.toggleAddButton(true, '', false);
    this.updatePickupAvailability();
    this.removeErrorMessage();

    if (!this.currentVariant) {
      this.toggleAddButton(true, '', true);
      this.setUnavailable();
    } else {
      this.updateMedia();
      this.updateURL();
      this.updateVariantInput();
      this.renderProductInfo();
      this.updateShareUrl();
    }
  }

  updateOptions() {
    this.options = Array.from(this.querySelectorAll('select'), (select) => select.value);
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options.map((option, index) => {
        return this.options[index] === option;
      }).includes(false);
    });
  }

  updateMedia() {
    if (!this.currentVariant) return;
    if (!this.currentVariant.featured_media) return;

    const mediaGallery = document.getElementById(`MediaGallery-${this.dataset.section}`);
    mediaGallery.setActiveMedia(`${this.dataset.section}-${this.currentVariant.featured_media.id}`, true);

    const modalContent = document.querySelector(`#ProductModal-${this.dataset.section} .product-media-modal__content`);
    if (!modalContent) return;
    const newMediaModal = modalContent.querySelector( `[data-media-id="${this.currentVariant.featured_media.id}"]`);
    modalContent.prepend(newMediaModal);
  }

  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
    window.history.replaceState({ }, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateShareUrl() {
    const shareButton = document.getElementById(`Share-${this.dataset.section}`);
    if (!shareButton || !shareButton.updateUrl) return;
    shareButton.updateUrl(`${window.shopUrl}${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(`#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`);
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  updatePickupAvailability() {
    const pickUpAvailability = document.querySelector('pickup-availability');
    if (!pickUpAvailability) return;

    if (this.currentVariant && this.currentVariant.available) {
      pickUpAvailability.fetchAvailability(this.currentVariant.id);
    } else {
      pickUpAvailability.removeAttribute('available');
      pickUpAvailability.innerHTML = '';
    }
  }

  removeErrorMessage() {
    const section = this.closest('section');
    if (!section) return;

    const productForm = section.querySelector('product-form');
    if (productForm) productForm.handleErrorMessage();
  }

  renderProductInfo() {
    fetch(`${this.dataset.url}?variant=${this.currentVariant.id}&section_id=${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`)
      .then((response) => response.text())
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, 'text/html')
        const destination = document.getElementById(`price-${this.dataset.section}`);
        const source = html.getElementById(`price-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
        if (source && destination) destination.innerHTML = source.innerHTML;

        const price = document.getElementById(`price-${this.dataset.section}`);

        if (price) price.classList.remove('visibility-hidden');
        this.toggleAddButton(!this.currentVariant.available, window.variantStrings.soldOut);
      });
  }

  toggleAddButton(disable = true, text, modifyClass = true) {
    const productForm = document.getElementById(`product-form-${this.dataset.section}`);
    if (!productForm) return;
    const addButton = productForm.querySelector('[name="add"]');
    const addButtonText = productForm.querySelector('[name="add"] > span');
    if (!addButton) return;

    if (disable) {
      addButton.setAttribute('disabled', 'disabled');
      if (text) addButtonText.textContent = text;
    } else {
      addButton.removeAttribute('disabled');
      addButtonText.textContent = window.variantStrings.addToCart;
    }

    if (!modifyClass) return;
  }

  setUnavailable() {
    const button = document.getElementById(`product-form-${this.dataset.section}`);
    const addButton = button.querySelector('[name="add"]');
    const addButtonText = button.querySelector('[name="add"] > span');
    const price = document.getElementById(`price-${this.dataset.section}`);
    if (!addButton) return;
    addButtonText.textContent = window.variantStrings.unavailable;
    if (price) price.classList.add('visibility-hidden');
  }

  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }
}

customElements.define('variant-selects', VariantSelects);

class VariantRadios extends VariantSelects {
  constructor() {
    super();
  }

  updateOptions() {
    const fieldsets = Array.from(this.querySelectorAll('fieldset'));
    this.options = fieldsets.map((fieldset) => {
      return Array.from(fieldset.querySelectorAll('input')).find((radio) => radio.checked).value;
    });
  }
}

customElements.define('variant-radios', VariantRadios);





/* ADDED JAVASCRIPT */


(function ($) {var _this2 = this;
  var $ = jQuery = $;

  var cc = {
    sections: [] };


  class ccComponent {
    constructor(name) {var cssSelector = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : ".cc-".concat(name);
      var _this = this;
      this.instances = [];

      // Initialise any instance of this component within a section
      $(document).on('cc:component:load', function (event, component, target) {
        if (component === name) {
          $(target).find("".concat(cssSelector, ":not(.cc-initialized)")).each(function () {
            _this.init(this);
          });
        }
      });

      // Destroy any instance of this component within a section
      $(document).on('cc:component:unload', function (event, component, target) {
        if (component === name) {
          $(target).find(cssSelector).each(function () {
            _this.destroy(this);
          });
        }
      });

      // Initialise any instance of this component
      $(cssSelector).each(function () {
        _this.init(this);
      });
    }

    init(container) {
      $(container).addClass('cc-initialized');
    }

    destroy(container) {
      $(container).removeClass('cc-initialized');
    }

    registerInstance(container, instance) {
      this.instances.push({
        container,
        instance });

    }

    destroyInstance(container) {
      this.instances = this.instances.filter((item) => {
        if (item.container === container) {
          if (typeof item.instance.destroy === 'function') {
            item.instance.destroy();
          }

          return item.container !== container;
        }
      });
    }}

  theme.cartNoteMonitor = {
    load: function load($notes) {
      $notes.on('change.themeCartNoteMonitor paste.themeCartNoteMonitor keyup.themeCartNoteMonitor', function () {
        theme.cartNoteMonitor.postUpdate($(this).val());
      });
    },

    unload: function unload($notes) {
      $notes.off('.themeCartNoteMonitor');
    },

    updateThrottleTimeoutId: -1,
    updateThrottleInterval: 500,

    postUpdate: function postUpdate(val) {
      clearTimeout(theme.cartNoteMonitor.updateThrottleTimeoutId);
      theme.cartNoteMonitor.updateThrottleTimeoutId = setTimeout(function () {
        $.post(theme.routes.cart_url + '/update.js', {
          note: val },
        function (data) {}, 'json');
      }, theme.cartNoteMonitor.updateThrottleInterval);
    } };

  theme.Shopify = {
    formatMoney: function formatMoney(t, r) {
      function e(t, r) {
        return void 0 === t ? r : t;
      }
      function a(t, r, a, o) {
        if (r = e(r, 2),
        a = e(a, ","),
        o = e(o, "."),
        isNaN(t) || null == t)
        return 0;
        t = (t / 100).toFixed(r);
        var n = t.split(".");
        return n[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + a) + (n[1] ? o + n[1] : "");
      }
      "string" == typeof t && (t = t.replace(".", ""));
      var o = "",
      n = /\{\{\s*(\w+)\s*\}\}/,
      i = r || this.money_format;
      switch (i.match(n)[1]) {
        case "amount":
          o = a(t, 2);
          break;
        case "amount_no_decimals":
          o = a(t, 0);
          break;
        case "amount_with_comma_separator":
          o = a(t, 2, ".", ",");
          break;
        case "amount_with_space_separator":
          o = a(t, 2, " ", ",");
          break;
        case "amount_with_period_and_space_separator":
          o = a(t, 2, " ", ".");
          break;
        case "amount_no_decimals_with_comma_separator":
          o = a(t, 0, ".", ",");
          break;
        case "amount_no_decimals_with_space_separator":
          o = a(t, 0, " ", "");
          break;
        case "amount_with_apostrophe_separator":
          o = a(t, 2, "'", ".");
          break;
        case "amount_with_decimal_separator":
          o = a(t, 2, ".", ".");}

      return i.replace(n, o);
    },
    formatImage: function formatImage(originalImageUrl, format) {
      return originalImageUrl ? originalImageUrl.replace(/^(.*)\.([^\.]*)$/g, '$1_' + format + '.$2') : '';
    },
    Image: {
      imageSize: function imageSize(t) {
        var e = t.match(/.+_((?:pico|icon|thumb|small|compact|medium|large|grande)|\d{1,4}x\d{0,4}|x\d{1,4})[_\.@]/);
        return null !== e ? e[1] : null;
      },
      getSizedImageUrl: function getSizedImageUrl(t, e) {
        if (null == e)
        return t;
        if ("master" == e)
        return this.removeProtocol(t);
        var o = t.match(/\.(jpg|jpeg|gif|png|bmp|bitmap|tiff|tif)(\?v=\d+)?$/i);
        if (null != o) {
          var i = t.split(o[0]),
          r = o[0];
          return this.removeProtocol(i[0] + "_" + e + r);
        }
        return null;
      },
      removeProtocol: function removeProtocol(t) {
        return t.replace(/http(s)?:/, "");
      } } };


  (function () {
    function throttle(callback, threshold) {
      var debounceTimeoutId = -1;
      var tick = false;

      return function () {
        clearTimeout(debounceTimeoutId);
        debounceTimeoutId = setTimeout(callback, threshold);

        if (!tick) {
          callback.call();
          tick = true;
          setTimeout(function () {
            tick = false;
          }, threshold);
        }
      };
    }

    var scrollEvent = document.createEvent('Event');
    scrollEvent.initEvent('throttled-scroll', true, true);

    window.addEventListener("scroll", throttle(function () {
      window.dispatchEvent(scrollEvent);
    }, 200));

  })();
  // requires: throttled-scroll, debouncedresize
  theme.Sections = new function () {
    var _ = this;

    _._instances = [];
    _._deferredSectionTargets = [];
    _._sections = [];
    _._deferredLoadViewportExcess = 300; // load defferred sections within this many px of viewport
    _._deferredWatcherRunning = false;

    _.init = function () {
      $(document).on('shopify:section:load', function (e) {
        // load a new section
        var target = _._themeSectionTargetFromShopifySectionTarget(e.target);
        if (target) {
          _.sectionLoad(target);
        }
      }).on('shopify:section:unload', function (e) {
        // unload existing section
        var target = _._themeSectionTargetFromShopifySectionTarget(e.target);
        if (target) {
          _.sectionUnload(target);
        }
      });
      $(window).on('throttled-scroll.themeSectionDeferredLoader debouncedresize.themeSectionDeferredLoader', _._processDeferredSections);
      _._deferredWatcherRunning = true;
    };

    // register a type of section
    _.register = function (type, section, options) {
      _._sections.push({
        type: type,
        section: section,
        afterSectionLoadCallback: options ? options.afterLoad : null,
        afterSectionUnloadCallback: options ? options.afterUnload : null });


      // load now
      $('[data-section-type="' + type + '"]').each(function () {
        if (Shopify.designMode || options && options.deferredLoad === false || !_._deferredWatcherRunning) {
          _.sectionLoad(this);
        } else {
          _.sectionDeferredLoad(this, options);
        }
      });
    };

    // prepare a section to load later
    _.sectionDeferredLoad = function (target, options) {
      _._deferredSectionTargets.push({
        target: target,
        deferredLoadViewportExcess: options && options.deferredLoadViewportExcess ? options.deferredLoadViewportExcess : _._deferredLoadViewportExcess });

      _._processDeferredSections(true);
    };

    // load deferred sections if in/near viewport
    _._processDeferredSections = function (firstRunCheck) {
      if (_._deferredSectionTargets.length) {
        var viewportTop = $(window).scrollTop(),
        viewportBottom = viewportTop + $(window).height(),
        loopStart = firstRunCheck === true ? _._deferredSectionTargets.length - 1 : 0;
        for (var i = loopStart; i < _._deferredSectionTargets.length; i++) {
          var target = _._deferredSectionTargets[i].target,
          viewportExcess = _._deferredSectionTargets[i].deferredLoadViewportExcess,
          sectionTop = $(target).offset().top - viewportExcess,
          doLoad = sectionTop > viewportTop && sectionTop < viewportBottom;
          if (!doLoad) {
            var sectionBottom = sectionTop + $(target).outerHeight() + viewportExcess * 2;
            doLoad = sectionBottom > viewportTop && sectionBottom < viewportBottom;
          }
          if (doLoad || sectionTop < viewportTop && sectionBottom > viewportBottom) {
            // in viewport, load
            _.sectionLoad(target);
            // remove from deferred queue and resume checks
            _._deferredSectionTargets.splice(i, 1);
            i--;
          }
        }
      }

      // remove event if no more deferred targets left, if not on first run
      if (firstRunCheck !== true && _._deferredSectionTargets.length === 0) {
        _._deferredWatcherRunning = false;
        $(window).off('.themeSectionDeferredLoader');
      }
    };

    // load in a section
    _.sectionLoad = function (target) {
      var target = target,
      sectionObj = _._sectionForTarget(target),
      section = false;

      if (sectionObj.section) {
        section = sectionObj.section;
      } else {
        section = sectionObj;
      }

      if (section !== false) {
        var instance = {
          target: target,
          section: section,
          $shopifySectionContainer: $(target).closest('.shopify-section'),
          thisContext: {
            functions: section.functions } };


        _._instances.push(instance);

        //Initialise any components
        if ($(target).data('components')) {
          //Init each component
          var components = $(target).data('components').split(',');
          components.forEach((component) => {
            $(document).trigger('cc:component:load', [component, target]);
          });
        }

        _._callSectionWith(section, 'onSectionLoad', target, instance.thisContext);
        _._callSectionWith(section, 'afterSectionLoadCallback', target, instance.thisContext);

        // attach additional UI events if defined
        if (section.onSectionSelect) {
          instance.$shopifySectionContainer.on('shopify:section:select', function (e) {
            _._callSectionWith(section, 'onSectionSelect', e.target, instance.thisContext);
          });
        }
        if (section.onSectionDeselect) {
          instance.$shopifySectionContainer.on('shopify:section:deselect', function (e) {
            _._callSectionWith(section, 'onSectionDeselect', e.target, instance.thisContext);
          });
        }
        if (section.onBlockSelect) {
          $(target).on('shopify:block:select', function (e) {
            _._callSectionWith(section, 'onBlockSelect', e.target, instance.thisContext);
          });
        }
        if (section.onBlockDeselect) {
          $(target).on('shopify:block:deselect', function (e) {
            _._callSectionWith(section, 'onBlockDeselect', e.target, instance.thisContext);
          });
        }
      }
    };

    // unload a section
    _.sectionUnload = function (target) {
      var sectionObj = _._sectionForTarget(target);
      var instanceIndex = -1;
      for (var i = 0; i < _._instances.length; i++) {
        if (_._instances[i].target == target) {
          instanceIndex = i;
        }
      }
      if (instanceIndex > -1) {
        var instance = _._instances[instanceIndex];
        // remove events and call unload, if loaded
        $(target).off('shopify:block:select shopify:block:deselect');
        instance.$shopifySectionContainer.off('shopify:section:select shopify:section:deselect');
        _._callSectionWith(instance.section, 'onSectionUnload', target, instance.thisContext);
        _._callSectionWith(sectionObj, 'afterSectionUnloadCallback', target, instance.thisContext);
        _._instances.splice(instanceIndex);

        //Destroy any components
        if ($(target).data('components')) {
          //Init each component
          var components = $(target).data('components').split(',');
          components.forEach((component) => {
            $(document).trigger('cc:component:unload', [component, target]);
          });
        }
      } else {
        // check if it was a deferred section
        for (var i = 0; i < _._deferredSectionTargets.length; i++) {
          if (_._deferredSectionTargets[i].target == target) {
            _._deferredSectionTargets[i].splice(i, 1);
            break;
          }
        }
      }
    };

    // helpers
    _._callSectionWith = function (section, method, container, thisContext) {
      if (typeof section[method] === 'function') {
        try {
          if (thisContext) {
            section[method].bind(thisContext)(container);
          } else {
            section[method](container);
          }
        } catch (ex) {
          var sectionType = container.dataset['sectionType'];
          console.log("Theme warning: '".concat(method, "' failed for section '").concat(sectionType, "'"));
          console.debug(container, ex.stack);
        }
      }
    };

    _._themeSectionTargetFromShopifySectionTarget = function (target) {
      var $target = $('[data-section-type]:first', target);
      if ($target.length > 0) {
        return $target[0];
      } else {
        return false;
      }
    };

    _._sectionForTarget = function (target) {
      var type = $(target).attr('data-section-type');
      for (var i = 0; i < _._sections.length; i++) {
        if (_._sections[i].type == type) {
          return _._sections[i];
        }
      }
      return false;
    };

    _._sectionAlreadyRegistered = function (type) {
      for (var i = 0; i < _._sections.length; i++) {
        if (_._sections[i].type == type) {
          return true;
        }
      }
      return false;
    };
  }();
  // Loading third party scripts
  theme.scriptsLoaded = {};
  theme.loadScriptOnce = function (src, callback, beforeRun, sync) {
    if (typeof theme.scriptsLoaded[src] === 'undefined') {
      theme.scriptsLoaded[src] = [];
      var tag = document.createElement('script');
      tag.src = src;

      if (sync || beforeRun) {
        tag.async = false;
      }

      if (beforeRun) {
        beforeRun();
      }

      if (typeof callback === 'function') {
        theme.scriptsLoaded[src].push(callback);
        if (tag.readyState) {// IE, incl. IE9
          tag.onreadystatechange = function () {
            if (tag.readyState == "loaded" || tag.readyState == "complete") {
              tag.onreadystatechange = null;
              for (var i = 0; i < theme.scriptsLoaded[this].length; i++) {
                theme.scriptsLoaded[this][i]();
              }
              theme.scriptsLoaded[this] = true;
            }
          }.bind(src);
        } else {
          tag.onload = function () {// Other browsers
            for (var i = 0; i < theme.scriptsLoaded[this].length; i++) {
              theme.scriptsLoaded[this][i]();
            }
            theme.scriptsLoaded[this] = true;
          }.bind(src);
        }
      }

      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      return true;
    } else if (typeof theme.scriptsLoaded[src] === 'object' && typeof callback === 'function') {
      theme.scriptsLoaded[src].push(callback);
    } else {
      if (typeof callback === 'function') {
        callback();
      }
      return false;
    }
  };

  theme.loadStyleOnce = function (src) {
    var srcWithoutProtocol = src.replace(/^https?:/, '');
    if (!document.querySelector('link[href="' + encodeURI(srcWithoutProtocol) + '"]')) {
      var tag = document.createElement('link');
      tag.href = srcWithoutProtocol;
      tag.rel = 'stylesheet';
      tag.type = 'text/css';
      var firstTag = document.getElementsByTagName('link')[0];
      firstTag.parentNode.insertBefore(tag, firstTag);
    }
  };theme.Disclosure = function () {
    var selectors = {
      disclosureList: '[data-disclosure-list]',
      disclosureToggle: '[data-disclosure-toggle]',
      disclosureInput: '[data-disclosure-input]',
      disclosureOptions: '[data-disclosure-option]' };


    var classes = {
      listVisible: 'disclosure-list--visible' };


    function Disclosure($disclosure) {
      this.$container = $disclosure;
      this.cache = {};
      this._cacheSelectors();
      this._connectOptions();
      this._connectToggle();
      this._onFocusOut();
    }

    Disclosure.prototype = $.extend({}, Disclosure.prototype, {
      _cacheSelectors: function _cacheSelectors() {
        this.cache = {
          $disclosureList: this.$container.find(selectors.disclosureList),
          $disclosureToggle: this.$container.find(selectors.disclosureToggle),
          $disclosureInput: this.$container.find(selectors.disclosureInput),
          $disclosureOptions: this.$container.find(selectors.disclosureOptions) };

      },

      _connectToggle: function _connectToggle() {
        this.cache.$disclosureToggle.on(
        'click',
        function (evt) {
          var ariaExpanded =
          $(evt.currentTarget).attr('aria-expanded') === 'true';
          $(evt.currentTarget).attr('aria-expanded', !ariaExpanded);

          this.cache.$disclosureList.toggleClass(classes.listVisible);
        }.bind(this));

      },

      _connectOptions: function _connectOptions() {
        this.cache.$disclosureOptions.on(
        'click',
        function (evt) {
          evt.preventDefault();
          this._submitForm($(evt.currentTarget).data('value'));
        }.bind(this));

      },

      _onFocusOut: function _onFocusOut() {
        this.cache.$disclosureToggle.on(
        'focusout',
        function (evt) {
          var disclosureLostFocus =
          this.$container.has(evt.relatedTarget).length === 0;

          if (disclosureLostFocus) {
            this._hideList();
          }
        }.bind(this));


        this.cache.$disclosureList.on(
        'focusout',
        function (evt) {
          var childInFocus =
          $(evt.currentTarget).has(evt.relatedTarget).length > 0;
          var isVisible = this.cache.$disclosureList.hasClass(
          classes.listVisible);


          if (isVisible && !childInFocus) {
            this._hideList();
          }
        }.bind(this));


        this.$container.on(
        'keyup',
        function (evt) {
          if (evt.which !== 27) return; // escape
          this._hideList();
          this.cache.$disclosureToggle.focus();
        }.bind(this));


        this.bodyOnClick = function (evt) {
          var isOption = this.$container.has(evt.target).length > 0;
          var isVisible = this.cache.$disclosureList.hasClass(
          classes.listVisible);


          if (isVisible && !isOption) {
            this._hideList();
          }
        }.bind(this);

        $('body').on('click', this.bodyOnClick);
      },

      _submitForm: function _submitForm(value) {
        this.cache.$disclosureInput.val(value);
        this.$container.parents('form').submit();
      },

      _hideList: function _hideList() {
        this.cache.$disclosureList.removeClass(classes.listVisible);
        this.cache.$disclosureToggle.attr('aria-expanded', false);
      },

      unload: function unload() {
        $('body').off('click', this.bodyOnClick);
        this.cache.$disclosureOptions.off();
        this.cache.$disclosureToggle.off();
        this.cache.$disclosureList.off();
        this.$container.off();
      } });


    return Disclosure;
  }();
  /// Show a short-lived text popup above an element
  theme.showQuickPopup = function (message, $origin) {
    var $popup = $('<div class="simple-popup"/>');
    var offs = $origin.offset();
    $popup.html(message).css({ 'left': offs.left, 'top': offs.top }).hide();
    $('body').append($popup);
    $popup.css({ marginTop: -$popup.outerHeight() - 10, marginLeft: -($popup.outerWidth() - $origin.outerWidth()) / 2 });
    $popup.fadeIn(200).delay(3500).fadeOut(400, function () {
      $(this).remove();
    });
  };
  // v1.0
  //Find out how wide scrollbars are on this browser
  $.scrollBarWidth = function () {
    var $temp = $('<div/>').css({
      width: 100,
      height: 100,
      overflow: 'scroll',
      position: 'absolute',
      top: -9999 }).
    prependTo('body');
    var w = $temp[0].offsetWidth - $temp[0].clientWidth;
    $temp.remove();
    return w;
  };class AccordionInstance {
    constructor(container) {
      this.accordion = container;
      this.itemClass = '.cc-accordion-item';
      this.titleClass = '.cc-accordion-item__title';
      this.panelClass = '.cc-accordion-item__panel';
      this.allowMultiOpen = this.accordion.dataset.allowMultiOpen === 'true';

      // If multiple open items not allowed, set open item as active (if there is one)
      if (!this.allowMultiOpen) {
        this.activeItem = this.accordion.querySelector("".concat(this.itemClass, "[open]"));
      }

      this.bindEvents();
    }

    /**
     * Adds inline 'height' style to a panel, to trigger open transition
     * @param {HTMLDivElement} panel - The accordion item content panel
     */
    static addPanelHeight(panel) {
      panel.style.height = "".concat(panel.scrollHeight, "px");
    }

    /**
     * Removes inline 'height' style from a panel, to trigger close transition
     * @param {HTMLDivElement} panel - The accordion item content panel
     */
    static removePanelHeight(panel) {
      panel.getAttribute('style'); // Fix Safari bug (doesn't remove attribute without this first!)
      panel.removeAttribute('style');
    }

    /**
     * Opens an accordion item
     * @param {HTMLDetailsElement} item - The accordion item
     * @param {HTMLDivElement} panel - The accordion item content panel
     */
    open(item, panel) {
      panel.style.height = '0';

      // Set item to open. Blocking the default click action and opening it this way prevents a
      // slight delay which causes the panel height to be set to '0' (because item's not open yet)
      item.open = true;

      AccordionInstance.addPanelHeight(panel);

      // Slight delay required before starting transitions
      setTimeout(() => {
        item.classList.add('is-open');
      }, 10);

      if (!this.allowMultiOpen) {
        // If there's an active item and it's not the opened item, close it
        if (this.activeItem && this.activeItem !== item) {
          var activePanel = this.activeItem.querySelector(this.panelClass);
          this.close(this.activeItem, activePanel);
        }

        this.activeItem = item;
      }
    }

    /**
     * Closes an accordion item
     * @param {HTMLDetailsElement} item - The accordion item
     * @param {HTMLDivElement} panel - The accordion item content panel
     */
    close(item, panel) {
      AccordionInstance.addPanelHeight(panel);

      item.classList.remove('is-open');
      item.classList.add('is-closing');

      if (this.activeItem === item) {
        this.activeItem = null;
      }

      // Slight delay required to allow scroll height to be applied before changing to '0'
      setTimeout(() => {
        panel.style.height = '0';
      }, 10);
    }

    /**
     * Handles 'click' event on the accordion
     * @param {Object} e - The event object
     */
    handleClick(e) {
      // Ignore clicks outside a toggle (<summary> element)
      var toggle = e.target.closest(this.titleClass);
      if (!toggle) return;

      // Prevent the default action
      // We'll trigger it manually after open transition initiated or close transition complete
      e.preventDefault();

      var item = toggle.parentNode;
      var panel = toggle.nextElementSibling;

      if (item.open) {
        this.close(item, panel);
      } else {
        this.open(item, panel);
      }
    }

    /**
     * Handles 'transitionend' event in the accordion
     * @param {Object} e - The event object
     */
    handleTransition(e) {
      // Ignore transitions not on a panel element
      if (!e.target.matches(this.panelClass)) return;

      var panel = e.target;
      var item = panel.parentNode;

      if (item.classList.contains('is-closing')) {
        item.classList.remove('is-closing');
        item.open = false;
      }

      AccordionInstance.removePanelHeight(panel);
    }

    bindEvents() {
      // Need to assign the function calls to variables because bind creates a new function,
      // which means the event listeners can't be removed in the usual way
      this.clickHandler = this.handleClick.bind(this);
      this.transitionHandler = this.handleTransition.bind(this);

      this.accordion.addEventListener('click', this.clickHandler);
      this.accordion.addEventListener('transitionend', this.transitionHandler);
    }

    destroy() {
      this.accordion.removeEventListener('click', this.clickHandler);
      this.accordion.removeEventListener('transitionend', this.transitionHandler);
    }}


  class Accordion extends ccComponent {
    constructor() {var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'accordion';var cssSelector = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : ".cc-".concat(name);
      super(name, cssSelector);
    }

    init(container) {
      super.init(container);
      this.registerInstance(container, new AccordionInstance(container));
    }

    destroy(container) {
      this.destroyInstance(container);
      super.destroy(container);
    }}


  new Accordion();
  (() => {
    theme.initAnimateOnScroll = function () {
      if (document.body.classList.contains('cc-animate-enabled') && window.innerWidth >= 768) {
        var animationTimeout = typeof document.body.dataset.ccAnimateTimeout !== "undefined" ? document.body.dataset.ccAnimateTimeout : 200;

        if ('IntersectionObserver' in window) {
          var intersectionObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
              // In view and hasn't been animated yet
              if (entry.isIntersecting && !entry.target.classList.contains("cc-animate-complete")) {
                setTimeout(() => {
                  entry.target.classList.add("-in", "cc-animate-complete");
                }, animationTimeout);

                setTimeout(() => {
                  //Once the animation is complete (assume 5 seconds), remove the animate attribute to remove all css
                  entry.target.classList.remove("data-cc-animate");
                  entry.target.style.transitionDuration = null;
                  entry.target.style.transitionDelay = null;
                }, 5000);

                // Remove observer after animation
                observer.unobserve(entry.target);
              }
            });
          });

          document.querySelectorAll('[data-cc-animate]:not(.cc-animate-init)').forEach((elem) => {
            //Set the animation delay
            if (elem.dataset.ccAnimateDelay) {
              elem.style.transitionDelay = elem.dataset.ccAnimateDelay;
            }

            ///Set the animation duration
            if (elem.dataset.ccAnimateDuration) {
              elem.style.transitionDuration = elem.dataset.ccAnimateDuration;
            }

            //Init the animation
            if (elem.dataset.ccAnimate) {
              elem.classList.add(elem.dataset.ccAnimate);
            }

            elem.classList.add("cc-animate-init");

            //Watch for elem
            intersectionObserver.observe(elem);
          });
        } else {
          //Fallback, load all the animations now
          var elems = document.querySelectorAll('[data-cc-animate]:not(.cc-animate-init)');
          for (var i = 0; i < elems.length; i++) {
            elems[i].classList.add("-in", "cc-animate-complete");
          }
        }
      }
    };

    theme.initAnimateOnScroll();

    document.addEventListener('shopify:section:load', () => {
      setTimeout(theme.initAnimateOnScroll, 100);
    });

    //Reload animations when changing from mobile to desktop
    try {
      window.matchMedia('(min-width: 768px)').addEventListener('change', (event) => {
        if (event.matches) {
          setTimeout(theme.initAnimateOnScroll, 100);
        }
      });
    } catch (e) {}
  })();


  class CustomSelectInstance {
    constructor(el) {
      this.el = el;
      this.button = el.querySelector('.cc-select__btn');
      this.listbox = el.querySelector('.cc-select__listbox');
      this.options = el.querySelectorAll('.cc-select__option');
      this.selectedOption = el.querySelector('[aria-selected="true"]');
      this.nativeSelect = document.getElementById("".concat(el.id, "-native"));
      this.swatches = 'swatch' in this.options[this.options.length - 1].dataset;
      this.focusedClass = 'is-focused';
      this.searchString = '';
      this.listboxOpen = false;

      // Set the selected option
      if (!this.selectedOption) {
        this.selectedOption = this.listbox.firstElementChild;
      }

      this.bindEvents();
      this.setButtonWidth();
    }

    bindEvents() {
      this.el.addEventListener('keydown', this.handleKeydown.bind(this));
      this.button.addEventListener('mousedown', this.handleMousedown.bind(this));
    }

    /**
     * Adds event listeners when the options list is visible
     */
    addListboxOpenEvents() {
      this.mouseoverHandler = this.handleMouseover.bind(this);
      this.mouseleaveHandler = this.handleMouseleave.bind(this);
      this.clickHandler = this.handleClick.bind(this);
      this.blurHandler = this.handleBlur.bind(this);

      this.listbox.addEventListener('mouseover', this.mouseoverHandler);
      this.listbox.addEventListener('mouseleave', this.mouseleaveHandler);
      this.listbox.addEventListener('click', this.clickHandler);
      this.listbox.addEventListener('blur', this.blurHandler);
    }

    /**
     * Removes event listeners added when the options list was visible
     */
    removeListboxOpenEvents() {
      this.listbox.removeEventListener('mouseover', this.mouseoverHandler);
      this.listbox.removeEventListener('mouseleave', this.mouseleaveHandler);
      this.listbox.removeEventListener('click', this.clickHandler);
      this.listbox.removeEventListener('blur', this.blurHandler);
    }

    /**
     * Handles a 'keydown' event on the custom select element
     * @param {Object} e - The event object
     */
    handleKeydown(e) {
      if (this.listboxOpen) {
        this.handleKeyboardNav(e);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        this.showListbox();
      }
    }

    /**
     * Handles a 'mousedown' event on the button element
     * @param {Object} e - The event object
     */
    handleMousedown(e) {
      if (!this.listboxOpen && e.button === 0) {
        this.showListbox();
      }
    }

    /**
     * Handles a 'mouseover' event on the options list
     * @param {Object} e - The event object
     */
    handleMouseover(e) {
      if (e.target.matches('li')) {
        this.focusOption(e.target);
      }
    }

    /**
     * Handles a 'mouseleave' event on the options list
     */
    handleMouseleave() {
      this.focusOption(this.selectedOption);
    }

    /**
     * Handles a 'click' event on the options list
     * @param {Object} e - The event object
     */
    handleClick(e) {
      if (e.target.matches('.js-option')) {
        this.selectOption(e.target);
      }
    }

    /**
     * Handles a 'blur' event on the options list
     */
    handleBlur() {
      if (this.listboxOpen) {
        this.hideListbox();
      }
    }

    /**
     * Handles a 'keydown' event on the options list
     * @param {Object} e - The event object
     */
    handleKeyboardNav(e) {
      var optionToFocus;

      // Disable tabbing if options list is open (as per native select element)
      if (e.key === 'Tab') {
        e.preventDefault();
      }

      switch (e.key) {
        // Focus an option
        case 'ArrowUp':
        case 'ArrowDown':
          e.preventDefault();

          if (e.key === 'ArrowUp') {
            optionToFocus = this.focusedOption.previousElementSibling;
          } else {
            optionToFocus = this.focusedOption.nextElementSibling;
          }

          if (optionToFocus && !optionToFocus.classList.contains('is-disabled')) {
            this.focusOption(optionToFocus);
          }
          break;

        // Select an option
        case 'Enter':
        case ' ':
          e.preventDefault();
          this.selectOption(this.focusedOption);
          break;

        // Cancel and close the options list
        case 'Escape':
          e.preventDefault();
          this.hideListbox();
          break;

        // Search for an option and focus the first match (if one exists)
        default:
          optionToFocus = this.findOption(e.key);

          if (optionToFocus) {
            this.focusOption(optionToFocus);
          }
          break;}

    }

    /**
     * Sets the button width to the same as the longest option, to prevent
     * the button width from changing depending on the option selected
     */
    setButtonWidth() {
      // Get the width of an element without side padding
      var getUnpaddedWidth = (el) => {
        var elStyle = getComputedStyle(el);
        return parseFloat(elStyle.paddingLeft) + parseFloat(elStyle.paddingRight);
      };

      var buttonPadding = getUnpaddedWidth(this.button);
      var optionPadding = getUnpaddedWidth(this.selectedOption);
      var buttonBorder = this.button.offsetWidth - this.button.clientWidth;
      var optionWidth = Math.ceil(this.selectedOption.getBoundingClientRect().width);

      this.button.style.width = "".concat(optionWidth - optionPadding + buttonPadding + buttonBorder, "px");
    }

    /**
     * Shows the options list
     */
    showListbox() {
      this.listbox.hidden = false;
      this.listboxOpen = true;

      this.el.classList.add('is-open');
      this.button.setAttribute('aria-expanded', 'true');
      this.listbox.setAttribute('aria-hidden', 'false');

      // Slight delay required to prevent blur event being fired immediately
      setTimeout(() => {
        this.focusOption(this.selectedOption);
        this.listbox.focus();

        this.addListboxOpenEvents();
      }, 10);
    }

    /**
     * Hides the options list
     */
    hideListbox() {
      if (!this.listboxOpen) return;

      this.listbox.hidden = true;
      this.listboxOpen = false;

      this.el.classList.remove('is-open');
      this.button.setAttribute('aria-expanded', 'false');
      this.listbox.setAttribute('aria-hidden', 'true');

      if (this.focusedOption) {
        this.focusedOption.classList.remove(this.focusedClass);
        this.focusedOption = null;
      }

      this.button.focus();
      this.removeListboxOpenEvents();
    }

    /**
     * Finds a matching option from a typed string
     * @param {string} key - The key pressed
     * @returns {?HTMLElement}
     */
    findOption(key) {
      this.searchString += key;

      // If there's a timer already running, clear it
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }

      // Wait 500ms to see if another key is pressed, if not then clear the search string
      this.searchTimer = setTimeout(() => {
        this.searchString = '';
      }, 500);

      // Find an option that contains the search string (if there is one)
      var matchingOption = [...this.options].find((option) => {
        var label = option.innerText.toLowerCase();
        return label.includes(this.searchString) && !option.classList.contains('is-disabled');
      });

      return matchingOption;
    }

    /**
     * Focuses an option
     * @param {HTMLElement} option - The <li> element of the option to focus
     */
    focusOption(option) {
      // Remove focus on currently focused option (if there is one)
      if (this.focusedOption) {
        this.focusedOption.classList.remove(this.focusedClass);
      }

      // Set focus on the option
      this.focusedOption = option;
      this.focusedOption.classList.add(this.focusedClass);

      // If option is out of view, scroll the list
      if (this.listbox.scrollHeight > this.listbox.clientHeight) {
        var scrollBottom = this.listbox.clientHeight + this.listbox.scrollTop;
        var optionBottom = option.offsetTop + option.offsetHeight;

        if (optionBottom > scrollBottom) {
          this.listbox.scrollTop = optionBottom - this.listbox.clientHeight;
        } else if (option.offsetTop < this.listbox.scrollTop) {
          this.listbox.scrollTop = option.offsetTop;
        }
      }
    }

    /**
     * Selects an option
     * @param {HTMLElement} option - The option <li> element
     */
    selectOption(option) {
      if (option !== this.selectedOption) {
        // Switch aria-selected attribute to selected option
        option.setAttribute('aria-selected', 'true');
        this.selectedOption.setAttribute('aria-selected', 'false');

        // Update swatch colour in the button
        if (this.swatches) {
          if (option.dataset.swatch) {
            this.button.dataset.swatch = option.dataset.swatch;
          } else {
            this.button.removeAttribute('data-swatch');
          }
        }

        // Update the button text and set the option as active
        this.button.firstChild.textContent = option.firstElementChild.textContent;
        this.listbox.setAttribute('aria-activedescendant', option.id);
        this.selectedOption = document.getElementById(option.id);

        // If a native select element exists, update its selected value and trigger a 'change' event
        if (this.nativeSelect) {
          this.nativeSelect.value = option.dataset.value;
          this.nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          // Trigger a 'change' event on the custom select element
          var detail = { selectedValue: option.dataset.value };
          this.el.dispatchEvent(new CustomEvent('change', { bubbles: true, detail }));
        }
      }

      this.hideListbox();
    }}


  class CustomSelect extends ccComponent {
    constructor() {var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'custom-select';var cssSelector = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : ".cc-select";
      super(name, cssSelector);
    }

    init(container) {
      super.init(container);
      this.registerInstance(container, new CustomSelectInstance(container));
    }

    destroy(container) {
      this.destroyInstance(container);
      super.destroy(container);
    }}


  new CustomSelect();
  class ccPopup {
    constructor($container, namespace) {
      this.$container = $container;
      this.namespace = namespace;
      this.cssClasses = {
        visible: 'cc-popup--visible',
        bodyNoScroll: 'cc-popup-no-scroll',
        bodyNoScrollPadRight: 'cc-popup-no-scroll-pad-right' };

    }

    /**
     * Open popup on timer / local storage - move focus to input ensure you can tab to submit and close
     * Add the cc-popup--visible class
     * Update aria to visible
     */
    open(callback) {
      // Prevent the body from scrolling
      if (this.$container.data('freeze-scroll')) {
        $('body').addClass(this.cssClasses.bodyNoScroll);

        // Add any padding necessary to the body to compensate for the scrollbar that just disappeared
        var scrollDiv = document.createElement('div');
        scrollDiv.className = 'popup-scrollbar-measure';
        document.body.appendChild(scrollDiv);
        var scrollbarWidth = scrollDiv.getBoundingClientRect().width - scrollDiv.clientWidth;
        document.body.removeChild(scrollDiv);
        if (scrollbarWidth > 0) {
          $('body').css('padding-right', scrollbarWidth + 'px').addClass(this.cssClasses.bodyNoScrollPadRight);
        }
      }

      // Add reveal class
      this.$container.addClass(this.cssClasses.visible);

      // Track previously focused element
      this.previouslyActiveElement = document.activeElement;

      // Focus on the close button after the animation in has completed
      setTimeout(() => {
        this.$container.find('.cc-popup-close')[0].focus();
      }, 500);

      // Pressing escape closes the modal
      $(window).on('keydown' + this.namespace, (event) => {
        if (event.keyCode === 27) {
          this.close();
        }
      });

      if (callback) {
        callback();
      }
    }

    /**
     * Close popup on click of close button or background - where does the focus go back to?
     * Remove the cc-popup--visible class
     */
    close(callback) {
      // Remove reveal class
      this.$container.removeClass(this.cssClasses.visible);

      // Revert focus
      if (this.previouslyActiveElement) {
        $(this.previouslyActiveElement).focus();
      }

      // Destroy the escape event listener
      $(window).off('keydown' + this.namespace);

      // Allow the body to scroll and remove any scrollbar-compensating padding
      if (this.$container.data('freeze-scroll')) {
        var transitionDuration = 500;

        var $innerModal = this.$container.find('.cc-popup-modal');
        if ($innerModal.length) {
          transitionDuration = parseFloat(getComputedStyle($innerModal[0])['transitionDuration']);
          if (transitionDuration && transitionDuration > 0) {
            transitionDuration *= 1000;
          }
        }

        setTimeout(() => {
          $('body').removeClass(this.cssClasses.bodyNoScroll).removeClass(this.cssClasses.bodyNoScrollPadRight).css('padding-right', '0');
        }, transitionDuration);
      }

      if (callback) {
        callback();
      }
    }}
  ;


  // Manage videos
  theme.VideoManager = new function () {
    var _ = this;

    _._permitPlayback = function (container) {
      return !($(container).hasClass('video-container--background') && $(window).outerWidth() < 768);
    };

    // Youtube
    _.youtubeVars = {
      incrementor: 0,
      apiReady: false,
      videoData: {},
      toProcessSelector: '.video-container[data-video-type="youtube"]:not(.video--init)' };


    _.youtubeApiReady = function () {
      _.youtubeVars.apiReady = true;
      _._loadYoutubeVideos();
    };

    _._loadYoutubeVideos = function (container) {
      if ($(_.youtubeVars.toProcessSelector, container).length) {
        if (_.youtubeVars.apiReady) {

          // play those videos
          $(_.youtubeVars.toProcessSelector, container).each(function () {
            // Don't init background videos on mobile
            if (_._permitPlayback($(this))) {
              $(this).addClass('video--init');
              _.youtubeVars.incrementor++;
              var containerId = 'theme-yt-video-' + _.youtubeVars.incrementor;
              $(this).data('video-container-id', containerId);
              var videoElement = $('<div class="video-container__video-element">').attr('id', containerId).
              appendTo($('.video-container__video', this));
              var autoplay = $(this).data('video-autoplay');
              var loop = $(this).data('video-loop');
              var player = new YT.Player(containerId, {
                height: '360',
                width: '640',
                videoId: $(this).data('video-id'),
                playerVars: {
                  iv_load_policy: 3,
                  modestbranding: 1,
                  autoplay: 0,
                  loop: loop ? 1 : 0,
                  playlist: $(this).data('video-id'),
                  rel: 0,
                  showinfo: 0 },

                events: {
                  onReady: _._onYoutubePlayerReady.bind({ autoplay: autoplay, loop: loop, $container: $(this) }),
                  onStateChange: _._onYoutubePlayerStateChange.bind({ autoplay: autoplay, loop: loop, $container: $(this) }) } });


              _.youtubeVars.videoData[containerId] = {
                id: containerId,
                container: this,
                videoElement: videoElement,
                player: player };

            }
          });
        } else {
          // load api
          theme.loadScriptOnce('https://www.youtube.com/iframe_api');
        }
      }
    };

    _._onYoutubePlayerReady = function (event) {
      event.target.setPlaybackQuality('hd1080');
      if (this.autoplay) {
        event.target.mute();
        event.target.playVideo();
      }

      _._initBackgroundVideo(this.$container);
    };

    _._onYoutubePlayerStateChange = function (event) {
      if (event.data == YT.PlayerState.PLAYING) {
        this.$container.addClass('video--play-started');

        if (this.autoplay) {
          event.target.mute();
        }

        if (this.loop) {
          // 4 times a second, check if we're in the final second of the video. If so, loop it for a more seamless loop
          var finalSecond = event.target.getDuration() - 1;
          if (finalSecond > 2) {
            function loopTheVideo() {
              if (event.target.getCurrentTime() > finalSecond) {
                event.target.seekTo(0);
              }
              setTimeout(loopTheVideo, 250);
            }
            loopTheVideo();
          }
        }
      }
    };

    _._unloadYoutubeVideos = function (container) {
      for (var dataKey in _.youtubeVars.videoData) {
        var data = _.youtubeVars.videoData[dataKey];
        if ($(container).find(data.container).length) {
          data.player.destroy();
          delete _.youtubeVars.videoData[dataKey];
          return;
        }
      }
    };

    // Vimeo
    _.vimeoVars = {
      incrementor: 0,
      apiReady: false,
      videoData: {},
      toProcessSelector: '.video-container[data-video-type="vimeo"]:not(.video--init)' };


    _.vimeoApiReady = function () {
      _.vimeoVars.apiReady = true;
      _._loadVimeoVideos();
    };

    _._loadVimeoVideos = function (container) {
      if ($(_.vimeoVars.toProcessSelector, container).length) {
        if (_.vimeoVars.apiReady) {
          // play those videos

          $(_.vimeoVars.toProcessSelector, container).each(function () {
            // Don't init background videos on mobile
            if (_._permitPlayback($(this))) {
              $(this).addClass('video--init');
              _.vimeoVars.incrementor++;
              var $this = $(this);
              var containerId = 'theme-vi-video-' + _.vimeoVars.incrementor;
              $(this).data('video-container-id', containerId);
              var videoElement = $('<div class="video-container__video-element">').attr('id', containerId).
              appendTo($('.video-container__video', this));
              var autoplay = !!$(this).data('video-autoplay');
              var player = new Vimeo.Player(containerId, {
                url: $(this).data('video-url'),
                width: 640,
                loop: $(this).data('video-autoplay'),
                autoplay: autoplay,
                muted: $this.hasClass('video-container--background') || autoplay });

              player.on('playing', function () {
                $(this).addClass('video--play-started');
              }.bind(this));
              player.ready().then(function () {
                if (autoplay) {
                  player.setVolume(0);
                  player.play();
                }
                if (player.element && player.element.width && player.element.height) {
                  var ratio = parseInt(player.element.height) / parseInt(player.element.width);
                  $this.find('.video-container__video').css('padding-bottom', ratio * 100 + '%');
                }
                _._initBackgroundVideo($this);
              });
              _.vimeoVars.videoData[containerId] = {
                id: containerId,
                container: this,
                videoElement: videoElement,
                player: player,
                autoPlay: autoplay };

            }
          });
        } else {
          // load api
          if (window.define) {
            // workaround for third parties using RequireJS
            theme.loadScriptOnce('https://player.vimeo.com/api/player.js', function () {
              _.vimeoVars.apiReady = true;
              _._loadVimeoVideos();
              window.define = window.tempDefine;
            }, function () {
              window.tempDefine = window.define;
              window.define = null;
            });
          } else {
            theme.loadScriptOnce('https://player.vimeo.com/api/player.js', function () {
              _.vimeoVars.apiReady = true;
              _._loadVimeoVideos();
            });
          }
        }
      }
    };

    _._unloadVimeoVideos = function (container) {
      for (var dataKey in _.vimeoVars.videoData) {
        var data = _.vimeoVars.videoData[dataKey];
        if ($(container).find(data.container).length) {
          data.player.unload();
          delete _.vimeoVars.videoData[dataKey];
          return;
        }
      }
    };

    // Init third party apis - Youtube and Vimeo
    _._loadThirdPartyApis = function (container) {
      //Don't init youtube or vimeo background videos on mobile
      if (_._permitPlayback($('.video-container', container))) {
        _._loadYoutubeVideos(container);
        _._loadVimeoVideos(container);
      }
    };

    // Mp4
    _.mp4Vars = {
      incrementor: 0,
      videoData: {},
      toProcessSelector: '.video-container[data-video-type="mp4"]:not(.video--init)' };


    _._loadMp4Videos = function (container) {
      if ($(_.mp4Vars.toProcessSelector, container).length) {
        // play those videos
        $(_.mp4Vars.toProcessSelector, container).addClass('video--init').each(function () {
          _.mp4Vars.incrementor++;
          var $this = $(this);
          var containerId = 'theme-mp-video-' + _.mp4Vars.incrementor;
          $(this).data('video-container-id', containerId);
          var videoElement = $('<div class="video-container__video-element">').attr('id', containerId).
          appendTo($('.video-container__video', this));

          var $video = $('<video playsinline>');
          if ($(this).data('video-loop')) {
            $video.attr('loop', 'loop');
          }
          if (!$(this).hasClass('video-container--background')) {
            $video.attr('controls', 'controls');
          }
          if ($(this).data('video-autoplay')) {
            $video.attr({ autoplay: 'autoplay', muted: 'muted' });
            $video[0].muted = true; // required by Chrome - ignores attribute
            $video.one('loadeddata', function () {
              this.play();
            });
          }
          $video.on('playing', function () {
            $(this).addClass('video--play-started');
          }.bind(this));
          $video.attr('src', $(this).data('video-url')).appendTo(videoElement);
          _.mp4Vars.videoData[containerId] = {
            element: $video[0] };

        });
      }
    };

    _._unloadMp4Videos = function (container) {
    };

    // background video placement for iframes
    _._initBackgroundVideo = function ($container) {
      if ($container.hasClass('video-container--background') && $container.find('.video-container__video iframe').length) {
        function assessBackgroundVideo() {
          var $media = $('.video-container__media', this),
          $container = $media.length ? $media : this,
          cw = $container.width(),
          ch = $container.height(),
          cr = cw / ch,
          $frame = $('.video-container__video iframe', this),
          vr = $frame.attr('width') / $frame.attr('height'),
          $pan = $('.video-container__video', this),
          vCrop = 75; // pushes video outside container to hide controls
          if (cr > vr) {
            var vh = cw / vr + vCrop * 2;
            $pan.css({
              marginTop: (ch - vh) / 2 - vCrop,
              marginLeft: '',
              height: vh + vCrop * 2,
              width: '' });

          } else {
            var vw = cw * vr + vCrop * 2 * vr;
            $pan.css({
              marginTop: -vCrop,
              marginLeft: (cw - vw) / 2,
              height: ch + vCrop * 2,
              width: vw });

          }
        }
        assessBackgroundVideo.bind($container)();
        $(window).on('debouncedresize.' + $container.data('video-container-id'), assessBackgroundVideo.bind($container));
      }
    };

    // Compatibility with Sections
    this.onSectionLoad = function (container) {
      // url only - infer type
      $('.video-container[data-video-url]:not([data-video-type])').each(function () {
        var url = $(this).data('video-url');

        if (url.indexOf('.mp4') > -1) {
          $(this).attr('data-video-type', 'mp4');
        }

        if (url.indexOf('vimeo.com') > -1) {
          $(this).attr('data-video-type', 'vimeo');
          $(this).attr('data-video-id', url.split('?')[0].split('/').pop());
        }

        if (url.indexOf('youtu.be') > -1 || url.indexOf('youtube.com') > -1) {
          $(this).attr('data-video-type', 'youtube');
          if (url.indexOf('v=') > -1) {
            $(this).attr('data-video-id', url.split('v=').pop().split('&')[0]);
          } else {
            $(this).attr('data-video-id', url.split('?')[0].split('/').pop());
          }
        }
      });

      _._loadThirdPartyApis(container);
      _._loadMp4Videos(container);

      $(window).on('debouncedresize.video-manager-resize', function () {
        _._loadThirdPartyApis(container);
      });

      // play button
      $('.video-container__play', container).on('click', function (evt) {
        evt.preventDefault();
        var $container = $(this).closest('.video-container');
        // reveal
        $container.addClass('video-container--playing');

        // broadcast a play event on the section container
        $(container).trigger("cc:video:play");

        // play
        var id = $container.data('video-container-id');
        if (id.indexOf('theme-yt-video') === 0) {
          _.youtubeVars.videoData[id].player.playVideo();
        } else if (id.indexOf('theme-vi-video') === 0) {
          _.vimeoVars.videoData[id].player.play();
        } else if (id.indexOf('theme-mp-video') === 0) {
          _.mp4Vars.videoData[id].element.play();
        }
      });

      // modal close button
      $('.video-container__stop', container).on('click', function (evt) {
        evt.preventDefault();
        var $container = $(this).closest('.video-container');
        // hide
        $container.removeClass('video-container--playing');

        // broadcast a stop event on the section container
        $(container).trigger("cc:video:stop");

        // play
        var id = $container.data('video-container-id');
        if (id.indexOf('theme-yt-video') === 0) {
          _.youtubeVars.videoData[id].player.stopVideo();
        } else {
          _.vimeoVars.videoData[id].player.pause();
          _.vimeoVars.videoData[id].player.setCurrentTime(0);
        }
      });
    };

    this.onSectionUnload = function (container) {
      $('.video-container__play, .video-container__stop', container).off('click');
      $(window).off('.' + $('.video-container').data('video-container-id'));
      $(window).off('debouncedresize.video-manager-resize');
      _._unloadYoutubeVideos(container);
      _._unloadVimeoVideos(container);
      _._unloadMp4Videos(container);
      $(container).trigger("cc:video:stop");
    };
  }();

  // Youtube API callback
  window.onYouTubeIframeAPIReady = function () {
    theme.VideoManager.youtubeApiReady();
  };

  // Register the section
  cc.sections.push({
    name: 'video',
    section: theme.VideoManager });

  theme.MapSection = new function () {
    var _ = this;
    _.config = {
      zoom: 14,
      styles: {
        default: [],
        silver: [{ "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] }, { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] }, { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] }, { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] }, { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] }, { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] }, { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] }, { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] }, { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] }, { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] }, { "featureType": "road.arterial", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] }, { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#dadada" }] }, { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] }, { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] }, { "featureType": "transit.line", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] }, { "featureType": "transit.station", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] }, { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c9c9c9" }] }, { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] }],
        retro: [{ "elementType": "geometry", "stylers": [{ "color": "#ebe3cd" }] }, { "elementType": "labels.text.fill", "stylers": [{ "color": "#523735" }] }, { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f1e6" }] }, { "featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{ "color": "#c9b2a6" }] }, { "featureType": "administrative.land_parcel", "elementType": "geometry.stroke", "stylers": [{ "color": "#dcd2be" }] }, { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#ae9e90" }] }, { "featureType": "landscape.natural", "elementType": "geometry", "stylers": [{ "color": "#dfd2ae" }] }, { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#dfd2ae" }] }, { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#93817c" }] }, { "featureType": "poi.park", "elementType": "geometry.fill", "stylers": [{ "color": "#a5b076" }] }, { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#447530" }] }, { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#f5f1e6" }] }, { "featureType": "road.arterial", "elementType": "geometry", "stylers": [{ "color": "#fdfcf8" }] }, { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#f8c967" }] }, { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#e9bc62" }] }, { "featureType": "road.highway.controlled_access", "elementType": "geometry", "stylers": [{ "color": "#e98d58" }] }, { "featureType": "road.highway.controlled_access", "elementType": "geometry.stroke", "stylers": [{ "color": "#db8555" }] }, { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#806b63" }] }, { "featureType": "transit.line", "elementType": "geometry", "stylers": [{ "color": "#dfd2ae" }] }, { "featureType": "transit.line", "elementType": "labels.text.fill", "stylers": [{ "color": "#8f7d77" }] }, { "featureType": "transit.line", "elementType": "labels.text.stroke", "stylers": [{ "color": "#ebe3cd" }] }, { "featureType": "transit.station", "elementType": "geometry", "stylers": [{ "color": "#dfd2ae" }] }, { "featureType": "water", "elementType": "geometry.fill", "stylers": [{ "color": "#b9d3c2" }] }, { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#92998d" }] }],
        dark: [{ "elementType": "geometry", "stylers": [{ "color": "#212121" }] }, { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] }, { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] }, { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] }, { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] }, { "featureType": "administrative.country", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] }, { "featureType": "administrative.land_parcel", "stylers": [{ "visibility": "off" }] }, { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] }, { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] }, { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#181818" }] }, { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] }, { "featureType": "poi.park", "elementType": "labels.text.stroke", "stylers": [{ "color": "#1b1b1b" }] }, { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] }, { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#8a8a8a" }] }, { "featureType": "road.arterial", "elementType": "geometry", "stylers": [{ "color": "#373737" }] }, { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#3c3c3c" }] }, { "featureType": "road.highway.controlled_access", "elementType": "geometry", "stylers": [{ "color": "#4e4e4e" }] }, { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] }, { "featureType": "transit", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] }, { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }, { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#3d3d3d" }] }],
        night: [{ "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] }, { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] }, { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] }, { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] }, { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] }, { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#263c3f" }] }, { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#6b9a76" }] }, { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] }, { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] }, { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] }, { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#746855" }] }, { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1f2835" }] }, { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#f3d19c" }] }, { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#2f3948" }] }, { "featureType": "transit.station", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] }, { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] }, { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#515c6d" }] }, { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#17263c" }] }],
        aubergine: [{ "elementType": "geometry", "stylers": [{ "color": "#1d2c4d" }] }, { "elementType": "labels.text.fill", "stylers": [{ "color": "#8ec3b9" }] }, { "elementType": "labels.text.stroke", "stylers": [{ "color": "#1a3646" }] }, { "featureType": "administrative.country", "elementType": "geometry.stroke", "stylers": [{ "color": "#4b6878" }] }, { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#64779e" }] }, { "featureType": "administrative.province", "elementType": "geometry.stroke", "stylers": [{ "color": "#4b6878" }] }, { "featureType": "landscape.man_made", "elementType": "geometry.stroke", "stylers": [{ "color": "#334e87" }] }, { "featureType": "landscape.natural", "elementType": "geometry", "stylers": [{ "color": "#023e58" }] }, { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#283d6a" }] }, { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#6f9ba5" }] }, { "featureType": "poi", "elementType": "labels.text.stroke", "stylers": [{ "color": "#1d2c4d" }] }, { "featureType": "poi.park", "elementType": "geometry.fill", "stylers": [{ "color": "#023e58" }] }, { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#3C7680" }] }, { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#304a7d" }] }, { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#98a5be" }] }, { "featureType": "road", "elementType": "labels.text.stroke", "stylers": [{ "color": "#1d2c4d" }] }, { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#2c6675" }] }, { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#255763" }] }, { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#b0d5ce" }] }, { "featureType": "road.highway", "elementType": "labels.text.stroke", "stylers": [{ "color": "#023e58" }] }, { "featureType": "transit", "elementType": "labels.text.fill", "stylers": [{ "color": "#98a5be" }] }, { "featureType": "transit", "elementType": "labels.text.stroke", "stylers": [{ "color": "#1d2c4d" }] }, { "featureType": "transit.line", "elementType": "geometry.fill", "stylers": [{ "color": "#283d6a" }] }, { "featureType": "transit.station", "elementType": "geometry", "stylers": [{ "color": "#3a4762" }] }, { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0e1626" }] }, { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#4e6d70" }] }] } };


    _.apiStatus = null;

    this.geolocate = function ($map) {
      var deferred = $.Deferred();
      var geocoder = new google.maps.Geocoder();
      var address = $map.data('address-setting');

      geocoder.geocode({ address: address }, function (results, status) {
        if (status !== google.maps.GeocoderStatus.OK) {
          deferred.reject(status);
        }

        deferred.resolve(results);
      });

      return deferred;
    };

    this.createMap = function (container) {
      var $map = $('.map-section__map-container', container);

      return _.geolocate($map).
      then(
      function (results) {
        var mapOptions = {
          zoom: _.config.zoom,
          styles: _.config.styles[$(container).data('map-style')],
          center: results[0].geometry.location,
          scrollwheel: false,
          disableDoubleClickZoom: true,
          disableDefaultUI: true,
          zoomControl: true };


        _.map = new google.maps.Map($map[0], mapOptions);
        _.center = _.map.getCenter();

        var marker = new google.maps.Marker({
          map: _.map,
          position: _.center,
          clickable: false });


        google.maps.event.addDomListener(window, 'resize', function () {
          google.maps.event.trigger(_.map, 'resize');
          _.map.setCenter(_.center);
        });
      }.bind(this)).

      fail(function () {
        var errorMessage;

        switch (status) {
          case 'ZERO_RESULTS':
            errorMessage = theme.strings.addressNoResults;
            break;
          case 'OVER_QUERY_LIMIT':
            errorMessage = theme.strings.addressQueryLimit;
            break;
          default:
            errorMessage = theme.strings.addressError;
            break;}


        // Only show error in the theme editor
        if (Shopify.designMode) {
          var $mapContainer = $map.parents('.map-section');

          $mapContainer.addClass('page-width map-section--load-error');
          $mapContainer.
          find('.map-section__wrapper').
          html(
          '<div class="errors text-center">' + errorMessage + '</div>');

        }
      });
    };

    this.onSectionLoad = function (target) {
      var $container = $(target);
      // Global function called by Google on auth errors
      window.gm_authFailure = function () {
        if (!Shopify.designMode) return;

        $container.addClass('page-width map-section--load-error');
        $container.
        find('.map-section__wrapper').
        html(
        '<div class="errors text-center">' + theme.strings.authError + '</div>');

      };

      // create maps
      var key = $container.data('api-key');

      if (typeof key !== 'string' || key === '') {
        return;
      }

      // load map
      theme.loadScriptOnce('https://maps.googleapis.com/maps/api/js?key=' + key, function () {
        _.createMap($container);
      });
    };

    this.onSectionUnload = function (target) {
      if (typeof window.google !== 'undefined' && typeof google.maps !== 'undefined') {
        google.maps.event.clearListeners(_.map, 'resize');
      }
    };
  }();

  // Register the section
  cc.sections.push({
    name: 'map',
    section: theme.MapSection });

  /**
   * Popup Section Script
   * ------------------------------------------------------------------------------
   *
   * @namespace Popup
   */

  theme.Popup = new function () {
    /**
     * Popup section constructor. Runs on page load as well as Theme Editor
     * `section:load` events.
     * @param {string} container - selector for the section container DOM element
     */

    var dismissedStorageKey = 'cc-theme-popup-dismissed';

    this.onSectionLoad = function (container) {
      this.namespace = theme.namespaceFromSection(container);
      this.$container = $(container);
      this.popup = new ccPopup(this.$container, this.namespace);

      var dismissForDays = this.$container.data('dismiss-for-days'),
      delaySeconds = this.$container.data('delay-seconds'),
      showPopup = true,
      testMode = this.$container.data('test-mode'),
      lastDismissed = window.localStorage.getItem(dismissedStorageKey);

      // Should we show it during this page view?
      // Check when it was last dismissed
      if (lastDismissed) {
        var dismissedDaysAgo = (new Date().getTime() - lastDismissed) / (1000 * 60 * 60 * 24);
        if (dismissedDaysAgo < dismissForDays) {
          showPopup = false;
        }
      }

      // Check for error or success messages
      if (this.$container.find('.cc-popup-form__response').length) {
        showPopup = true;
        delaySeconds = 1;

        // If success, set as dismissed
        if (this.$container.find('.cc-popup-form__response--success').length) {
          this.functions.popupSetAsDismissed.call(this);
        }
      }

      // Prevent popup on Shopify robot challenge page
      if (document.querySelector('.shopify-challenge__container')) {
        showPopup = false;
      }

      // Show popup, if appropriate
      if (showPopup || testMode) {
        setTimeout(() => {
          this.popup.open();
        }, delaySeconds * 1000);
      }

      // Click on close button or modal background
      this.$container.on('click' + this.namespace, '.cc-popup-close, .cc-popup-background', () => {
        this.popup.close(() => {
          this.functions.popupSetAsDismissed.call(this);
        });
      });
    };

    this.onSectionSelect = function () {
      this.popup.open();
    };

    this.functions = {
      /**
       * Use localStorage to set as dismissed
       */
      popupSetAsDismissed: function popupSetAsDismissed() {
        window.localStorage.setItem(dismissedStorageKey, new Date().getTime());
      } };


    /**
     * Event callback for Theme Editor `section:unload` event
     */
    this.onSectionUnload = function () {
      this.$container.off(this.namespace);
    };
  }();

  // Register section
  cc.sections.push({
    name: 'newsletter-popup',
    section: theme.Popup });

  /**
   * StoreAvailability Section Script
   * ------------------------------------------------------------------------------
   *
   * @namespace StoreAvailability
   */

  theme.StoreAvailability = function (container) {
    var loadingClass = 'store-availability-loading';
    var initClass = 'store-availability-initialized';
    var storageKey = 'cc-location';

    this.onSectionLoad = function (container) {
      this.namespace = theme.namespaceFromSection(container);
      this.$container = $(container);
      this.productId = this.$container.data('store-availability-container');
      this.sectionUrl = this.$container.data('section-url');
      this.$modal;

      var firstRun = true;

      // Handle when a variant is selected
      $(window).on("cc-variant-updated".concat(this.namespace).concat(this.productId), (e, args) => {
        if (args.product.id === this.productId) {
          this.functions.updateContent.bind(this)(
          args.variant ? args.variant.id : null,
          args.product.title,
          firstRun,
          this.$container.data('has-only-default-variant'),
          args.variant && typeof args.variant.available !== "undefined");

          firstRun = false;
        }
      });

      // Handle single variant products
      if (this.$container.data('single-variant-id')) {
        this.functions.updateContent.bind(this)(
        this.$container.data('single-variant-id'),
        this.$container.data('single-variant-product-title'),
        firstRun,
        this.$container.data('has-only-default-variant'),
        this.$container.data('single-variant-product-available'));

        firstRun = false;
      }
    };

    this.onSectionUnload = function () {
      $(window).off("cc-variant-updated".concat(this.namespace).concat(this.productId));
      this.$container.off('click');
      if (this.$modal) {
        this.$modal.off('click');
      }
    };

    this.functions = {
      // Returns the users location data (if allowed)
      getUserLocation: function getUserLocation() {
        return new Promise((resolve, reject) => {
          var storedCoords;

          if (sessionStorage[storageKey]) {
            storedCoords = JSON.parse(sessionStorage[storageKey]);
          }

          if (storedCoords) {
            resolve(storedCoords);

          } else {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
              function (position) {
                var coords = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude };


                //Set the localization api
                fetch('/localization.json', {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json' },

                  body: JSON.stringify(coords) });


                //Write to a session storage
                sessionStorage[storageKey] = JSON.stringify(coords);

                resolve(coords);
              }, function () {
                resolve(false);
              }, {
                maximumAge: 3600000, // 1 hour
                timeout: 5000 });


            } else {
              resolve(false);
            }
          }
        });
      },

      // Requests the available stores and calls the callback
      getAvailableStores: function getAvailableStores(variantId, cb) {
        return $.get(this.sectionUrl.replace('VARIANT_ID', variantId), cb);
      },

      // Haversine Distance
      // The haversine formula is an equation giving great-circle distances between
      // two points on a sphere from their longitudes and latitudes
      calculateDistance: function calculateDistance(coords1, coords2, unitSystem) {
        var dtor = Math.PI / 180;
        var radius = unitSystem === 'metric' ? 6378.14 : 3959;

        var rlat1 = coords1.latitude * dtor;
        var rlong1 = coords1.longitude * dtor;
        var rlat2 = coords2.latitude * dtor;
        var rlong2 = coords2.longitude * dtor;

        var dlon = rlong1 - rlong2;
        var dlat = rlat1 - rlat2;

        var a =
        Math.pow(Math.sin(dlat / 2), 2) +
        Math.cos(rlat1) * Math.cos(rlat2) * Math.pow(Math.sin(dlon / 2), 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return radius * c;
      },

      // Updates the existing modal pickup with locations with distances from the user
      updateLocationDistances: function updateLocationDistances(coords) {
        var unitSystem = this.$modal.find('[data-unit-system]').data('unit-system');
        var self = this;

        this.$modal.find('[data-distance="false"]').each(function () {
          var thisCoords = {
            latitude: parseFloat($(this).data('latitude')),
            longitude: parseFloat($(this).data('longitude')) };


          if (thisCoords.latitude && thisCoords.longitude) {
            var distance = self.functions.calculateDistance(
            coords, thisCoords, unitSystem).toFixed(1);

            $(this).html(distance);

            //Timeout to trigger animation
            setTimeout(() => {
              $(this).closest('.store-availability-list__location__distance').addClass('-in');
            }, 0);
          }

          $(this).attr('data-distance', 'true');
        });
      },

      // Requests the available stores and updates the page with info below Add to Basket, and append the modal to the page
      updateContent: function updateContent(variantId, productTitle, firstRun, isSingleDefaultVariant, isVariantAvailable) {
        this.$container.off('click', '[data-store-availability-modal-open]');
        this.$container.off('click' + this.namespace, '.cc-popup-close, .cc-popup-background');
        $('.store-availabilities-modal').remove();

        if (firstRun) {
          this.$container.hide();
        } else if (!isVariantAvailable) {
          //If the variant is Unavailable (not the same as Out of Stock) - hide the store pickup completely
          this.$container.addClass(loadingClass).addClass(initClass);
          this.$container.css('height', '0px');
        } else {
          this.$container.addClass(loadingClass).addClass(initClass);
          this.$container.css('height', this.$container.outerHeight() > 0 ? this.$container.outerHeight() + 'px' : 'auto');
        }

        if (isVariantAvailable) {
          this.functions.getAvailableStores.call(this, variantId, (response) => {
            if (response.trim().length > 0 && !response.includes('NO_PICKUP')) {
              this.$container.html(response);
              this.$container.html(this.$container.children().first().html()); // editor bug workaround

              this.$container.find('[data-store-availability-modal-product-title]').html(productTitle);

              if (isSingleDefaultVariant) {
                this.$container.find('.store-availabilities-modal__variant-title').remove();
              }

              this.$container.find('.cc-popup').appendTo('body');

              this.$modal = $('body').find('.store-availabilities-modal');
              var popup = new ccPopup(this.$modal, this.namespace);

              this.$container.on('click', '[data-store-availability-modal-open]', () => {
                popup.open();

                //When the modal is opened, try and get the users location
                this.functions.getUserLocation().then((coords) => {
                  if (coords && this.$modal.find('[data-distance="false"]').length) {
                    //Re-retrieve the available stores location modal contents
                    this.functions.getAvailableStores.call(this, variantId, (response) => {
                      this.$modal.find('.store-availabilities-list').html($(response).find('.store-availabilities-list').html());
                      this.functions.updateLocationDistances.bind(this)(coords);
                    });
                  }
                });

                return false;
              });

              this.$modal.on('click' + this.namespace, '.cc-popup-close, .cc-popup-background', () => {
                popup.close();
              });

              if (firstRun) {
                this.$container.slideDown(300);
              } else {
                this.$container.removeClass(loadingClass);

                var newHeight = this.$container.find('.store-availability-container').outerHeight();

                this.$container.css('height', newHeight > 0 ? newHeight + 'px' : 'auto');
              }
            }
          });
        }
      } };


    // Initialise the section when it's instantiated
    this.onSectionLoad(container);
  };

  // Register section
  cc.sections.push({
    name: 'store-availability',
    section: theme.StoreAvailability });



  class PriceRangeInstance {
    constructor(container) {
      this.container = container;

      this.selectors = {
        inputMin: '.cc-price-range__input--min',
        inputMax: '.cc-price-range__input--max',
        control: '.cc-price-range__control',
        controlMin: '.cc-price-range__control--min',
        controlMax: '.cc-price-range__control--max',
        bar: '.cc-price-range__bar',
        activeBar: '.cc-price-range__bar-active' };


      this.controls = {
        min: {
          barControl: container.querySelector(this.selectors.controlMin),
          input: container.querySelector(this.selectors.inputMin) },

        max: {
          barControl: container.querySelector(this.selectors.controlMax),
          input: container.querySelector(this.selectors.inputMax) } };



      this.controls.min.value = parseInt(
      this.controls.min.input.value === '' ? this.controls.min.input.placeholder : this.controls.min.input.value);


      this.controls.max.value = parseInt(
      this.controls.max.input.value === '' ? this.controls.max.input.placeholder : this.controls.max.input.value);


      this.valueMin = this.controls.min.input.min;
      this.valueMax = this.controls.min.input.max;
      this.valueRange = this.valueMax - this.valueMin;

      [this.controls.min, this.controls.max].forEach((item) => {
        item.barControl.setAttribute('aria-valuemin', this.valueMin);
        item.barControl.setAttribute('aria-valuemax', this.valueMax);
      });

      this.controls.min.barControl.setAttribute('aria-valuenow', this.controls.min.value);
      this.controls.max.barControl.setAttribute('aria-valuenow', this.controls.max.value);

      this.bar = container.querySelector(this.selectors.bar);
      this.activeBar = container.querySelector(this.selectors.activeBar);
      this.inDrag = false;

      this.bindEvents();
      this.render();
    }

    getPxToValueRatio() {
      return this.bar.clientWidth / (this.valueMax - this.valueMin);
    }

    getPcToValueRatio() {
      return 100.0 / (this.valueMax - this.valueMin);
    }

    setActiveControlValue(value, reset) {
      // Clamp & default
      if (this.activeControl === this.controls.min) {
        if (value === '') {
          value = this.valueMin;
        }

        value = Math.max(this.valueMin, value);
        value = Math.min(value, this.controls.max.value);
      } else {
        if (value === '') {
          value = this.valueMax;
        }

        value = Math.min(this.valueMax, value);
        value = Math.max(value, this.controls.min.value);
      }

      // Round
      this.activeControl.value = Math.round(value);

      // Update input
      if (this.activeControl.input.value != this.activeControl.value) {
        if (this.activeControl.value == this.activeControl.input.placeholder) {
          this.activeControl.input.value = '';
        } else {
          this.activeControl.input.value = this.activeControl.value;
        }

        if (!reset) {
          this.activeControl.input.dispatchEvent(
          new CustomEvent('change', { bubbles: true, detail: { sender: 'theme:component:price_range' } }));

        }
      }

      // A11y
      this.activeControl.barControl.setAttribute('aria-valuenow', this.activeControl.value);
    }

    render() {
      this.drawControl(this.controls.min);
      this.drawControl(this.controls.max);
      this.drawActiveBar();
    }

    drawControl(control) {
      control.barControl.style.left = "".concat((control.value - this.valueMin) * this.getPcToValueRatio(), "%");
    }

    drawActiveBar() {
      this.activeBar.style.left = "".concat((this.controls.min.value - this.valueMin) * this.getPcToValueRatio(), "%");
      this.activeBar.style.right = "".concat((this.valueMax - this.controls.max.value) * this.getPcToValueRatio(), "%");
    }

    handleControlTouchStart(e) {
      e.preventDefault();
      this.startDrag(e.target, e.touches[0].clientX);
      this.boundControlTouchMoveEvent = this.handleControlTouchMove.bind(this);
      this.boundControlTouchEndEvent = this.handleControlTouchEnd.bind(this);
      window.addEventListener('touchmove', this.boundControlTouchMoveEvent);
      window.addEventListener('touchend', this.boundControlTouchEndEvent);
    }

    handleControlTouchMove(e) {
      this.moveDrag(e.touches[0].clientX);
    }

    handleControlTouchEnd(e) {
      e.preventDefault();
      window.removeEventListener('touchmove', this.boundControlTouchMoveEvent);
      window.removeEventListener('touchend', this.boundControlTouchEndEvent);
      this.stopDrag();
    }

    handleControlMouseDown(e) {
      e.preventDefault();
      this.startDrag(e.target, e.clientX);
      this.boundControlMouseMoveEvent = this.handleControlMouseMove.bind(this);
      this.boundControlMouseUpEvent = this.handleControlMouseUp.bind(this);
      window.addEventListener('mousemove', this.boundControlMouseMoveEvent);
      window.addEventListener('mouseup', this.boundControlMouseUpEvent);
    }

    handleControlMouseMove(e) {
      this.moveDrag(e.clientX);
    }

    handleControlMouseUp(e) {
      e.preventDefault();
      window.removeEventListener('mousemove', this.boundControlMouseMoveEvent);
      window.removeEventListener('mouseup', this.boundControlMouseUpEvent);
      this.stopDrag();
    }

    startDrag(target, startX) {
      this.activeControl = this.controls.min.barControl === target ? this.controls.min : this.controls.max;
      this.dragStartX = startX;
      this.dragStartValue = this.activeControl.value;
      this.inDrag = true;
    }

    moveDrag(moveX) {
      if (this.inDrag) {
        var value = this.dragStartValue + (moveX - this.dragStartX) / this.getPxToValueRatio();
        this.setActiveControlValue(value);
        this.render();
      }
    }

    stopDrag() {
      this.inDrag = false;
    }

    handleInputChange(e) {
      if (e.target.tagName !== 'INPUT') return;

      if (!e.detail || e.detail.sender !== 'theme:component:price_range') {
        var reset = e.detail && e.detail.sender === 'reset';

        this.activeControl = this.controls.min.input === e.target ? this.controls.min : this.controls.max;
        this.setActiveControlValue(e.target.value, reset);
        this.render();
      }
    }

    bindEvents() {
      [this.controls.min, this.controls.max].forEach((item) => {
        item.barControl.addEventListener('touchstart', this.handleControlTouchStart.bind(this));
        item.barControl.addEventListener('mousedown', this.handleControlMouseDown.bind(this));
      });

      this.container.addEventListener('change', this.handleInputChange.bind(this));
    }

    destroy() {}}


  class PriceRange extends ccComponent {
    constructor() {var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'price-range';var cssSelector = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : ".cc-".concat(name);
      super(name, cssSelector);
    }

    init(container) {
      super.init(container);
      this.registerInstance(container, new PriceRangeInstance(container));
    }

    destroy(container) {
      this.destroyInstance(container);
      super.destroy(container);
    }}


  new PriceRange();


  theme.icons = {
    chevronLightLeft: '<svg fill="currentColor" viewBox="0 0 24 24" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M 14.51,6.51 14,6 8,12 14,18 14.51,17.49 9.03,12 Z"></path></svg>',
    chevronLightRight: '<svg fill="currentColor" viewBox="0 0 24 24" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M 10,6 9.49,6.51 14.97,12 9.49,17.49 10,18 16,12 Z"></path></svg>',
    arrowLeft: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-left"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>',
    arrowRight: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-right"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>',
    close: '<svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>' };


  theme.viewport = {
    isXs: () => {
      return $(window).outerWidth() < 768;
    },
    isSm: () => {
      return $(window).outerWidth() >= 768;
    },
    isMd: () => {
      return $(window).outerWidth() >= 992;
    } };


  theme.nav = {
    bar: {
      isInlineNavEnabled: () => {
        return $('.pageheader__contents[data-nav-inline]').length > 0;
      },
      changeToInline: () => {
        $('.pageheader__contents').addClass('pageheader__contents--inline--visible');
      },
      changeToBurger: () => {
        $('.pageheader__contents').removeClass('pageheader__contents--inline--visible');
      },
      height: () => {
        return $('.pageheader__contents').outerHeight();
      } } };



  // Lightbox
  theme.lightbox_min_window_width = 768;
  theme.lightbox_min_window_height = 580;

  // Get Shopify feature support
  try {
    theme.Shopify.features = JSON.parse(document.documentElement.querySelector('#shopify-features').textContent);
  } catch (e) {
    theme.Shopify.features = {};
  }

  theme.debounce = (fn, wait) => {
    var t;
    return function () {for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {args[_key] = arguments[_key];}
      clearTimeout(t);
      t = setTimeout(() => fn.apply(_this2, args), wait);
    };
  };

  theme.checkMenuPadding = function () {
    if ($('html').hasClass('open-menu')) {
      var $announcementBar = $('#shopify-section-announcement');
      var headerHeight = parseInt(theme.nav.bar.height() / 2) + 42;

      if ($announcementBar && !$('body').hasClass('scrolled-down')) {
        headerHeight = headerHeight + parseInt($announcementBar.outerHeight());
      }

      if (headerHeight > 90) {
        $('#main-menu').css('border-top-width', headerHeight + 'px');
      } else {
        $('#main-menu').removeAttr('style');
      }
    }
  };

  theme.buildGalleryViewer = function (config) {
    // Create viewer
    var $allContainer = $('<div class="gallery-viewer gallery-viewer--pre-reveal">');
    var $zoomContainer = $('<div class="gallery-viewer__zoom">').appendTo($allContainer);
    var $thumbContainer = $('<div class="gallery-viewer__thumbs">').appendTo($allContainer);
    var $controlsContainer = $('<div class="gallery-viewer__controls">').appendTo($allContainer);
    var $close = $('<a class="gallery-viewer__button gallery-viewer__close" href="#">').attr('aria-label', theme.strings.close).html(config.close).appendTo($controlsContainer);
    var $right = $('<a class="gallery-viewer__button gallery-viewer__prev" href="#">').attr('aria-label', theme.strings.previous).html(config.prev).appendTo($controlsContainer);
    var $left = $('<a class="gallery-viewer__button gallery-viewer__next" href="#">').attr('aria-label', theme.strings.next).html(config.next).appendTo($controlsContainer);
    var $currentZoomImage = null;

    // Add images
    for (var i = 0; i < config.images.length; i++) {
      var img = config.images[i];
      $('<a class="gallery-viewer__thumb" href="#">').data('zoom-url', img.zoomUrl).
      html(img.thumbTag).
      appendTo($thumbContainer);
    }

    if (config.images.length === 1) {
      $allContainer.addClass('gallery-viewer--single-image');
    }

    // Helper function for panning an image
    var panZoomImage = function panZoomImage(inputX, inputY) {
      // Do nothing if the image fits, pan if not
      var doPanX = $currentZoomImage.width() > $allContainer.width();
      var doPanY = $currentZoomImage.height() > $allContainer.height();
      if (doPanX || doPanY) {
        var midX = $allContainer.width() / 2;
        var midY = $allContainer.height() / 2;

        var offsetFromCentreX = inputX - midX,
        offsetFromCentreY = inputY - midY;

        // The offsetMultipler ensures it can only pan to the edge of the image, no further
        var finalOffsetX = 0;
        var finalOffsetY = 0;
        if (doPanX) {
          var offsetMultiplierX = ($currentZoomImage.width() - $allContainer.width()) / 2 / midX;
          finalOffsetX = Math.round(-offsetFromCentreX * offsetMultiplierX);
        }
        if (doPanY) {
          var offsetMultiplierY = ($currentZoomImage.height() - $allContainer.height()) / 2 / midY;
          finalOffsetY = Math.round(-offsetFromCentreY * offsetMultiplierY);
        }

        $currentZoomImage.css(
        'transform', [
        'translate3d(', finalOffsetX, 'px, ', finalOffsetY, 'px, 0)'].
        join(''));

      }
    };

    // Show next image
    var showNextImage = function showNextImage(e) {
      e.preventDefault();
      var $next = $thumbContainer.find('.gallery-viewer__thumb--active').next();
      if ($next.length === 0) {
        $next = $thumbContainer.find('.gallery-viewer__thumb:first');
      }
      $next.trigger('select');
    };

    // Show previous image
    var showPrevImage = function showPrevImage(e) {
      e.preventDefault();
      var $prev = $thumbContainer.find('.gallery-viewer__thumb--active').prev();
      if ($prev.length === 0) {
        $prev = $thumbContainer.find('.gallery-viewer__thumb:last');
      }
      $prev.trigger('select');
    };

    // Close gallery viewer
    var closeGalleryViewer = function closeGalleryViewer(e) {
      e.preventDefault();
      // Destroy events
      $allContainer.off('.galleryViewer');
      // Begin exit transition
      $allContainer.addClass('gallery-viewer--transition-out');
      // Remove after transition
      var transitionDelay = $allContainer.css('transition-duration');
      transitionDelay = transitionDelay.indexOf('ms') > -1 ? parseFloat(transitionDelay) : parseFloat(transitionDelay) * 1000;
      setTimeout(function () {
        $allContainer.remove();
        $('html').removeClass('gallery-viewer-open');
      }, transitionDelay);
    };

    // Set up events
    // event: select thumbnail - zoom it
    $allContainer.on('click.galleryViewer select.galleryViewer', '.gallery-viewer__thumb', function (e) {
      e.preventDefault();

      // Set active
      $(this).addClass('gallery-viewer__thumb--active').
      siblings('.gallery-viewer__thumb--active').
      removeClass('gallery-viewer__thumb--active');

      // Replace zoom image
      $currentZoomImage = $('<img class="gallery-viewer__zoom-image" alt="" style="visibility: hidden">');

      $currentZoomImage.on('load', function () {
        $(this).off('load');
        if (config.zoom) {
          $(this).css({
            visibility: '',
            top: $allContainer.height() / 2 - $(this).height() / 2,
            left: $allContainer.width() / 2 - $(this).width() / 2 });

          panZoomImage(e.clientX, e.clientY);
        } else {
          $(this).css({
            visibility: '',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transform: 'none' });

        }
      }).attr('src', $(this).data('zoom-url'));

      $zoomContainer.html($currentZoomImage);
    });

    // event: pan
    $allContainer.on('mousemove.galleryViewer touchmove.galleryViewer', function (e) {
      if (e.type === 'touchmove') {
        var touch = e.touches[0];
        panZoomImage(touch.clientX, touch.clientY);
      } else {
        panZoomImage(e.clientX, e.clientY);
      }
    });

    // event: prevent pan while swiping thumbnails
    $allContainer.on('touchmove.galleryViewer', '.gallery-viewer__thumbs', function (e) {
      e.stopPropagation();
    });

    // event: next image
    $allContainer.on('click.galleryViewer', '.gallery-viewer__next', showNextImage);

    // event: previous image
    $allContainer.on('click.galleryViewer', '.gallery-viewer__prev', showPrevImage);

    // event: close
    $allContainer.on('click.galleryViewer', '.gallery-viewer__close', closeGalleryViewer);

    // event: keypress
    $allContainer.on('keydown.galleryViewer', function (e) {
      if (e.which === 39) {// right arrow key
        showNextImage(e);
      } else if (e.which === 37) {// left arrow key
        showPrevImage(e);
      } else if (e.which === 27) {// esc key
        closeGalleryViewer(e);
      }
    });

    // Initialise

    // Clear any remnants of failed previous closure
    $('html').removeClass('gallery-viewer-open');
    $('.gallery-viewer').remove();

    // Insert into page
    $('html').addClass('gallery-viewer-open');
    $allContainer.attr('tabindex', -1).appendTo('body').focus();

    // Select first thumbnail
    $thumbContainer.find('.gallery-viewer__thumb:eq(' + (config.current > 0 ? config.current : 0) + ')').trigger('select');

    // Reveal
    setTimeout(function () {
      $allContainer.removeClass('gallery-viewer--pre-reveal');
    }, 10);
  };

  theme.ProductMediaGallery = function ($gallery) {
    var _this = this;
    var initialisedMedia = {};
    var $allMedia = $gallery.find('.product-media');
    var $currentMedia = $gallery.find('.product-media--image:first-of-type');
    var $thumbScroller = $gallery.find('.thumbnails__scroller');
    var $viewInSpaceButton = $gallery.find('.view-in-space');
    var vimeoApiReady = false;

    $gallery.addClass('media-gallery--initialized');

    this.Image = function ($elem) {
      this.show = function () {
        $elem.show();
      };

      this.destroy = function () {};
      this.pause = function () {};

      this.hide = function () {
        $elem.hide();
      };

      // Init the image
      this.show();
    };

    this.Video = function ($elem, autoplay) {
      var _video = this;
      var playerObj = {
        play: function play() {},
        pause: function pause() {},
        destroy: function destroy() {} };

      var videoElement = $elem.find('video')[0];

      this.show = function () {
        $elem.show();
      };

      this.play = function () {
        _video.show();
        playerObj.play();
      };

      this.pause = function () {
        playerObj.pause();
      };

      this.hide = function () {
        playerObj.pause();
        $elem.hide();
      };

      this.destroy = function () {
        playerObj.destroy();
        $(videoElement).off('playing', _this.pauseAllMedia);
      };

      // Init the video
      theme.loadStyleOnce('https://cdn.shopify.com/shopifycloud/shopify-plyr/v1.0/shopify-plyr.css');

      // Set up a controller for Plyr video
      window.Shopify.loadFeatures([{
        name: 'video-ui',
        version: '1.0',
        onLoad: function () {
          playerObj = {
            playerType: 'html5',
            element: videoElement,
            plyr: new Shopify.Plyr(videoElement, {
              controls: [
              'play',
              'progress',
              'mute',
              'volume',
              'play-large',
              'fullscreen'],

              loop: {
                active: $elem.data('enable-video-looping') },

              autoplay: $(window).width() >= 768 && autoplay,
              hideControlsOnPause: true,
              iconUrl: '//cdn.shopify.com/shopifycloud/shopify-plyr/v1.0/shopify-plyr.svg',
              tooltips: {
                controls: false,
                seek: true } }),


            play: function play() {
              this.plyr.play();
            },
            pause: function pause() {
              this.plyr.pause();
            },
            destroy: function destroy() {
              this.plyr.destroy();
            } };


          $elem.addClass('product-media--video-loaded');

          initialisedMedia[$elem.data('media-id')] = _video;
        }.bind(this) }]);


      $(videoElement).on('playing', function () {
        _this.pauseAllMedia($elem.data('media-id'));
      });

      _video.show();
    };

    this.ExternalVideo = function ($elem, autoplay) {
      var _video = this;
      var playerObj = {
        play: function play() {},
        pause: function pause() {},
        destroy: function destroy() {} };

      var iframeElement = $elem.find('iframe')[0];

      this.play = function () {
        _video.show();
        playerObj.play();
      };

      this.pause = function () {
        playerObj.pause();
      };

      this.show = function () {
        $elem.show();
      };

      this.hide = function () {
        playerObj.pause();
        $elem.hide();
      };

      this.destroy = function () {
        playerObj.destroy();
      };

      // Init the external video
      if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtube-nocookie\.com|youtu\.?be)\/.+$/.test(iframeElement.src)) {

        var loadYoutubeVideo = function loadYoutubeVideo() {
          playerObj = {
            playerType: 'youtube',
            element: iframeElement,
            player: new YT.Player(iframeElement, {
              videoId: $elem.data('video-id'),
              events: {
                onReady: function onReady() {
                  initialisedMedia[$elem.data('media-id')] = _video;

                  $elem.addClass('product-media--video-loaded');

                  if (autoplay && $(window).width() >= 768) {
                    _video.play();
                  }
                },
                onStateChange: function onStateChange(event) {
                  if (event.data === 1) {
                    _this.pauseAllMedia($elem.data('media-id'));
                  }

                  if (event.data === 0 && $elem.data('enable-video-looping')) {
                    event.target.seekTo(0);
                  }
                } } }),


            play: function play() {
              this.player.playVideo();
            },
            pause: function pause() {
              this.player.pauseVideo();
            },
            destroy: function destroy() {
              this.player.destroy();
            } };

        };

        if (window.YT && window.YT.Player) {
          loadYoutubeVideo();
        } else {
          // Set up a controller for YouTube video
          var temp = window.onYouTubeIframeAPIReady;
          window.onYouTubeIframeAPIReady = function () {
            temp();
            loadYoutubeVideo();
          };

          theme.loadScriptOnce('https://www.youtube.com/iframe_api');
        }
      } else if (/vimeo\.com/.test(iframeElement.src)) {
        var loadVimeoVideo = function loadVimeoVideo() {
          if (vimeoApiReady) {
            if ($elem.data('enable-video-looping')) {
              iframeElement.src = iframeElement.src + '&loop=1';
            }

            if (autoplay && $(window).width() >= 768) {
              iframeElement.src = iframeElement.src + '&autoplay=1';
            }

            playerObj = {
              playerType: 'vimeo',
              element: iframeElement,
              player: new Vimeo.Player(iframeElement),
              play: function play() {
                this.player.play();
              },
              pause: function pause() {
                this.player.pause();
              },
              destroy: function destroy() {
                this.player.destroy();
              } };


            playerObj.player.ready().then(function () {
              initialisedMedia[$elem.data('media-id')] = _video;
              $elem.addClass('product-media--video-loaded');
            });

          } else {
            theme.loadScriptOnce('https://player.vimeo.com/api/player.js', function () {
              vimeoApiReady = true;
              loadVimeoVideo();
            });
          }
        };
        loadVimeoVideo();
      }

      _video.show();
    };

    this.Model = function ($elem, autoplay, dontShow) {
      var _model = this;
      var playerObj = {
        play: function play() {},
        pause: function pause() {},
        destroy: function destroy() {} };

      var modelElement = $elem.find('model-viewer')[0];

      this.show = function () {
        $elem.show();

        if (window.ShopifyXR && $viewInSpaceButton.length) {
          // Change the view in space button to launch this model
          $viewInSpaceButton.attr('data-shopify-model3d-id', $elem.data('media-id'));
          window.ShopifyXR.setupXRElements();
        }
      };

      this.play = function () {
        _model.show();
        playerObj.play();
      };

      this.pause = function () {
        playerObj.pause();
      };

      this.hide = function () {
        playerObj.pause();
        $elem.hide();

        if (window.ShopifyXR && $viewInSpaceButton.length) {
          // Reset the view in space button to launch the first model
          $viewInSpaceButton.attr('data-shopify-model3d-id', $viewInSpaceButton.data('shopify-model3d-first-id'));
          $viewInSpaceButton.attr('data-shopify-title', $viewInSpaceButton.data('shopify-first-title'));
          window.ShopifyXR.setupXRElements();
        }
      };

      this.destroy = function () {
        // Nothing needed
      };

      this.initAugmentedReality = function () {
        if ($('.model-json', $gallery).length) {
          var doInit = function doInit() {
            if (!window.ShopifyXR) {
              document.addEventListener('shopify_xr_initialized', function shopifyXrEventListener(event) {
                doInit();

                // Ensure this only fires once
                event.target.removeEventListener(event.type, shopifyXrEventListener);
              });

              return;
            }

            window.ShopifyXR.addModels(JSON.parse($('.model-json', $gallery).html()));
            window.ShopifyXR.setupXRElements();
          };

          window.Shopify.loadFeatures([{
            name: 'shopify-xr',
            version: '1.0',
            onLoad: doInit }]);

        }
      };

      // Init the model
      theme.loadStyleOnce('https://cdn.shopify.com/shopifycloud/model-viewer-ui/assets/v1.0/model-viewer-ui.css');

      window.Shopify.loadFeatures([
      {
        name: 'model-viewer-ui',
        version: '1.0',
        onLoad: function () {
          playerObj = new Shopify.ModelViewerUI(modelElement);
          $elem.addClass('product-media--model-loaded');

          if (autoplay && $(window).width() >= 768) {
            _model.play();
          }

          // Prevent the buttons from submitting the form
          $elem.find('button').attr('type', 'button');
        }.bind(this) }]);



      initialisedMedia[$elem.data('media-id')] = _model;

      if (!dontShow) {
        _model.show();
      }

      if (!window.ShopifyXR) {
        _model.initAugmentedReality();
      }
    };

    this.pauseAllMedia = function (ignoreKey) {
      for (var key in initialisedMedia) {
        if (initialisedMedia.hasOwnProperty(key) && (!ignoreKey || key != ignoreKey)) {
          initialisedMedia[key].pause();
        }
      }
    };

    this.showMedia = function ($mediaToShow, autoplay, preventHide) {
      // In with the new
      if ($mediaToShow.length) {
        // Out with the old
        if ($currentMedia && !preventHide) {
          $currentMedia.hide();
        }

        // Function to instantiate and return the relevant media
        var getMedia = function getMedia(MediaType) {
          var $media;

          if (initialisedMedia.hasOwnProperty($mediaToShow.data('media-id'))) {
            $media = initialisedMedia[$mediaToShow.data('media-id')];

            if (autoplay && $(window).width() >= 768) {
              $media.show();
              // Delay play so its easier for users to understand that it paused
              setTimeout($media.play, 250);
            } else {
              $media.show();
            }
          } else {
            $media = new MediaType($mediaToShow, autoplay);
          }

          return $media;
        };

        // Initialise the media
        if ($mediaToShow.data('media-type') === "image") {
          $currentMedia = getMedia(_this.Image);
        } else if ($mediaToShow.data('media-type') === "video") {
          $currentMedia = getMedia(_this.Video);
        } else if ($mediaToShow.data('media-type') === "external_video") {
          $currentMedia = getMedia(_this.ExternalVideo);
        } else if ($mediaToShow.data('media-type') === "model") {
          $currentMedia = getMedia(_this.Model);
        } else {
          console.warn('Media is unknown', $mediaToShow);
          $gallery.find('.product-media:visible').hide();
          $mediaToShow.show();
        }
      }
    };

    this.destroy = function () {
      for (var i = 0; i < initialisedMedia.length; i++) {
        initialisedMedia[i].destroy();
      }

      $gallery.off('click');
      $(window).off('debouncedresize.gallery', updateThumbArrowStates);
    };

    var $activeThumb = $gallery.find('.thumb.is-active');
    var $mediaToInit = $gallery.find('.product-media:first');

    if ($activeThumb.length) {
      $mediaToInit = $gallery.find('.product-media[data-media-id="' + $activeThumb.data('media-id') + '"]');
    }

    // Init the first media item
    this.showMedia($mediaToInit, false);

    // On mobile, init the first model (without showing it) to init the view in your space button
    if ($mediaToInit.data('media-type') !== 'model' && $(window).width() < 768) {
      var $firstModel = $gallery.find('.product-media[data-media-type="model"]:first');
      if ($firstModel.length) {
        new _this.Model($firstModel, false, true);
      }
    }

    if ($thumbScroller.length) {
      // Click a thumbnail
      $gallery.on('click', '.thumb', function (e) {
        e.preventDefault();
        if ($(this).hasClass('is-active')) return;

        var $mediaToShow = $gallery.find('.product-media[data-media-id="' + $(this).data('media-id') + '"]');

        if ($gallery.hasClass('media-gallery--expanded')) {
          $('html, body').animate({
            scrollTop: $mediaToShow.offset().top - 90 },
          500, 'swing');
        } else {
          _this.showMedia($mediaToShow, true);
          $activeThumb.removeClass('is-active');
          $activeThumb = $(this).addClass('is-active');
          $mediaToShow.addClass('is-active').siblings('.is-active').removeClass('is-active').hide();
        }
      });

      // Click next/prev
      $gallery.on('click', '.thumbnails__prev,.thumbnails__next', function (e) {
        e.preventDefault();
        if (window.innerWidth >= 992) {
          if ($(this).hasClass('thumbnails__prev')) {
            // Scroll thumbs upwards
            $thumbScroller.animate({
              scrollTop: $thumbScroller.scrollTop() - $thumbScroller.outerHeight() * 0.8 },
            500);
          } else {
            // Scroll thumbs downwards
            $thumbScroller.animate({
              scrollTop: $thumbScroller.outerHeight() * 0.8 + $thumbScroller.scrollTop() },
            500);
          }
        } else {
          if ($(this).hasClass('thumbnails__prev')) {
            // Scroll thumbs backwards
            $thumbScroller.animate({
              scrollLeft: $thumbScroller.scrollLeft() - $thumbScroller.outerWidth() * 0.8 },
            500);
          } else {
            // Scroll thumbs forwards
            $thumbScroller.animate({
              scrollLeft: $thumbScroller.outerWidth() * 0.8 + $thumbScroller.scrollLeft() },
            500);
          }
        }
      });

      var $prevArrow = $gallery.find('.thumbnails__prev');
      var $nextArrow = $gallery.find('.thumbnails__next');
      var $thumbs = $thumbScroller.find('.thumbnails__thumbs');

      // Update the state of the arrows (enabled/disabled) based on the scroll position of the thumbs;
      function updateThumbArrowStates() {
        var disableBoth = $thumbs.outerWidth() < $thumbScroller.outerWidth();
        var disablePrev = $thumbScroller.scrollLeft() === 0;
        var disableNext = $thumbScroller.innerWidth() + $thumbScroller.scrollLeft() === $thumbs.outerWidth();

        if (window.innerWidth >= 992) {
          disableBoth = $thumbs.outerHeight() < $thumbScroller.outerHeight();
          disablePrev = $thumbScroller.scrollTop() === 0;
          disableNext = $thumbScroller.innerHeight() + $thumbScroller.scrollTop() === Math.round($thumbs.outerHeight());
        }

        if (disableBoth) {
          $prevArrow[0].disabled = true;
          $nextArrow[0].disabled = true;
        } else if (disablePrev) {
          $prevArrow[0].disabled = true;
          $nextArrow[0].disabled = false;
        } else if (disableNext) {
          $prevArrow[0].disabled = false;
          $nextArrow[0].disabled = true;
        } else {
          $prevArrow[0].disabled = false;
          $nextArrow[0].disabled = false;
        }
      };

      updateThumbArrowStates();

      // Detect when scroll has finished
      var thumbScrollTimer;
      $thumbScroller.scroll(function () {
        clearTimeout(thumbScrollTimer);
        thumbScrollTimer = setTimeout(updateThumbArrowStates, 100);
      });

      // Update arrows on window resize
      $(window).on('debouncedresize.gallery', updateThumbArrowStates);
    }

    // Expand all thumbs into large images
    var $toggleAllMediaBtn = $gallery.parent().find('.expand-media-btn');
    if ($toggleAllMediaBtn.length) {
      $toggleAllMediaBtn.on('click', function () {
        $gallery.toggleClass('media-gallery--expanded');

        if ($gallery.hasClass('media-gallery--expanded')) {
          $allMedia.each(function () {
            _this.showMedia($(this), false, true);
          });
        } else {
          $allMedia.each(function () {
            if ($(this).data('media-id') !== $activeThumb.data('media-id')) {
              $(this).hide();
            }
          });

          $('html, body').animate({
            scrollTop: 0 },
          500, 'swing');
        }
      });
    }

    // Click on main image
    $gallery.on('click', '.product-media__link', function (e) {
      e.preventDefault();

      var images = [];
      var currentIndex = 0;
      var $thumbs = $gallery.find('.thumb--media-image');

      if ($thumbs.length) {
        var clickedMediaId = e.currentTarget.closest('.product-media').dataset.mediaId;

        $thumbs.each(function () {
          var $imgThumb = $(this).find('.thumb__image').clone();
          images.push({
            thumbTag: $imgThumb,
            zoomUrl: $(this).attr('href') });

        });

        $thumbs.each(function (thisIndex) {
          if (this.dataset.mediaId === clickedMediaId) {
            currentIndex = thisIndex;
            return;
          }
        });
      } else {
        var $imgThumb = $(this).find('.thumb__image').clone();
        images.push({
          thumbTag: $imgThumb,
          zoomUrl: $(this).attr('href') });

      }

      theme.buildGalleryViewer({
        images: images,
        current: currentIndex,
        zoom: $(this).data('enable-zoom'),
        prev: theme.icons.arrowLeft,
        next: theme.icons.arrowRight,
        close: theme.icons.close });

    });
  };

  theme.applyAjaxToProductForm = function ($form_param) {
    var shopifyAjaxAddURL = theme.routes.cart_add_url + '.js';
    var shopifyAjaxStorePageURL = theme.routes.search_url;

    $form_param.filter('[data-ajax-add-to-cart="true"]').on('submit', function (e) {
      e.preventDefault();
      var $form = $(this);

      // Disable add button
      $form.find('button[type="submit"]').attr('disabled', 'disabled').each(function () {
        $(this).data('previous-value', $(this).html()).html(theme.strings.addingToCart);
      });

      // Add to cart
      $.post(shopifyAjaxAddURL, $form.serialize(), function (itemData) {
        // Enable add button
        $form.find('button[type="submit"]').each(function () {
          var $btn = $(this);
          // Set to 'DONE', alter button style, wait a few secs, revert to normal
          $btn.html(theme.strings.addedToCart);
          setTimeout(function () {
            $btn.removeAttr('disabled').html($btn.data('previous-value'));
          }, 4000);
        });

        // Update header summary
        $.get(shopifyAjaxStorePageURL, function (data) {
          var $newDoc = $($.parseHTML('<div>' + data + '</div>'));
          var sels = ['.pageheader .header-items'];
          for (var i = 0; i < sels.length; i++) {
            var cartSummarySelector = sels[i];
            var $newCartObj = $newDoc.find(cartSummarySelector);
            var $currCart = $(cartSummarySelector);
            $currCart.replaceWith($newCartObj);
          }
        });

      }, 'text').fail(function (data) {
        // Enable add button
        var $firstBtn = $form.find('button[type="submit"]').removeAttr('disabled').each(function () {
          $(this).html($(this).data('previous-value'));
        }).first();

        // Not added, show message
        if (typeof data != 'undefined' && typeof data.status != 'undefined') {
          var jsonRes = $.parseJSON(data.responseText);
          theme.showQuickPopup(jsonRes.description, $firstBtn);
        } else {
          // Some unknown error? Disable ajax and submit the old-fashioned way.
          $form.attr('ajax-add-to-cart', 'false').submit();
        }
      });
    });
  };

  theme.removeAjaxFromProductForm = function ($form_param) {
    $form_param.off('submit');
  };

  theme.ProductResultsSection = new function () {var _this3 = this;
    this.onSectionLoad = (el) => {
      this.filteringEnabled = el.dataset.filtering === 'true';
      this.sortingEnabled = el.dataset.sorting === 'true';

      this.resultsCountEl = document.getElementById('results-count');
      this.resultsListEl = document.querySelector('.filters-results');

      if (!this.filteringEnabled && !this.sortingEnabled || !this.resultsListEl) return;

      if (this.filteringEnabled) {
        var showFiltersBtn = document.querySelector('.js-show-filters');
        var hideFiltersBtn = document.querySelector('.js-hide-filters');
        var clearFiltersBtn = document.querySelector('.js-reset-filters');
        this.filtersForm = document.getElementById('filters');
        this.filtersEl = document.querySelector('.filters');
        this.filterEls = document.querySelectorAll('.js-filter');
        this.activeFiltersEl = document.querySelector('.active-filters');
        this.resultsBtn = document.querySelector('.js-apply-filters');
        this.filtersOpen = this.filtersEl.dataset.filtersOpen;

        // Show/hide filter buttons clicked
        showFiltersBtn.addEventListener('click', this.toggleFilters.bind(this));
        hideFiltersBtn.addEventListener('click', this.toggleFilters.bind(this));

        // 'Clear all' button clicked
        clearFiltersBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.applyFilters(new URL(e.target.href).searchParams.toString(), e);
        });

        this.filtersEl.addEventListener('input', theme.debounce(this.handleFilterChange.bind(this), 500));
        this.filtersEl.addEventListener('change', theme.debounce(this.handleFilterChange.bind(this), 500));
        this.activeFiltersEl.addEventListener('click', this.handleActiveFiltersClick.bind(this));
        this.resultsBtn.addEventListener('click', this.toggleFilters.bind(this));

        window.addEventListener('popstate', this.handleHistoryChange.bind(this));
        window.addEventListener('resize', theme.debounce(this.handleWindowResize.bind(this), 500));

        this.handleWindowResize();
      }

      if (this.sortingEnabled) {
        this.desktopSortBy = document.getElementById('sort-by');
        var mobileSortBy = document.getElementById('mobile-sort-by');

        this.desktopSortBy.addEventListener('change', (e) => {
          if (mobileSortBy) {
            mobileSortBy.querySelector("input[value=\"".concat(e.detail.selectedValue, "\"]")).checked = true;
          }

          this.handleSortChange(e);
        });
      }
    };

    this.toggleFilters = (e) => {
      var open = false;

      if (e) {
        e.preventDefault();
        open = e.target.classList.contains('js-show-filters');
      }

      document.documentElement.classList.toggle('open-side-drawer', open);

      if (this.filteringEnabled) {
        this.filtersEl.classList.toggle('is-open', open);
      }
    };

    this.handleFilterChange = (e) => {
      // Ignore 'change' events not triggered by user moving the price range slider
      if (e.type === 'change' && (!e.detail || e.detail.sender !== 'theme:component:price_range')) return;

      // If price min/max input value changed, dispatch 'change' event to trigger update of the slider
      if (e.type == 'input' && e.target.classList.contains('cc-price-range__input')) {
        e.target.dispatchEvent(new Event('change', { bubbles: true }));
      }

      var formData = new FormData(this.filtersForm);
      var searchParams = new URLSearchParams(formData);

      this.applyFilters(searchParams.toString(), e);
    };

    this.handleSortChange = (e) => {
      var searchParams;

      if (this.filteringEnabled) {
        var formData = new FormData(this.filtersForm);
        searchParams = new URLSearchParams(formData);
      } else {
        var currentOption = this.desktopSortBy.querySelector('[aria-selected="true"]');
        searchParams = new URLSearchParams(window.location.search);
        searchParams.set('sort_by', currentOption.dataset.value);
      }

      this.applyFilters(searchParams.toString(), e);
    };

    this.handleActiveFiltersClick = (e) => {
      e.preventDefault();

      if (e.target.tagName === 'A') {
        this.applyFilters(new URL(e.target.href).searchParams.toString(), e);
      }
    };

    this.handleHistoryChange = (e) => {
      var searchParams = '';

      if (e.state && e.state.searchParams) {
        searchParams = e.state.searchParams;
      }

      this.applyFilters(searchParams, null, false);
    };

    this.handleWindowResize = () => {
      if (window.innerWidth < 768) {
        this.filterEls.forEach((el) => {
          el.open = false;
          el.classList.remove('is-open');
        });
      } else {
        this.filterEls.forEach((el, index) => {
          if (this.filtersOpen === 'all' || this.filtersOpen === 'some' && index < 5) {
            el.open = true;
            el.classList.add('is-open');
          }
        });
      }
    };

    this.applyFilters = function (searchParams, e) {var updateUrl = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
      _this3.resultsListEl.classList.add('is-loading');

      fetch("".concat(window.location.pathname, "?").concat(searchParams)).
      then((response) => response.text()).
      then((responseText) => {
        var fetchedHTML = document.implementation.createHTMLDocument();
        fetchedHTML.documentElement.innerHTML = responseText;

        _this3.updateFilters(fetchedHTML, e);
        _this3.resultsListEl.innerHTML = fetchedHTML.querySelector('.filters-results').innerHTML;

        if (_this3.resultsCountEl) {
          _this3.resultsCountEl.innerHTML = fetchedHTML.getElementById('results-count').innerHTML;
        }

        _this3.resultsListEl.classList.remove('is-loading');
      });

      if (updateUrl) {
        _this3.updateURL(searchParams);
      }
    };

    this.updateFilters = (fetchedHTML, e) => {
      if (e && e.target.type === 'radio' && e.target.name === 'sort_by') {
        this.updateSortByDropdown(e.target.value);
      }

      if (!this.filteringEnabled) return;

      var filters = fetchedHTML.querySelectorAll('.js-filter');
      var matchesIndex = (el) => {
        if (!e) return false;
        var filter = e.target.closest('.js-filter');

        if (filter) {
          return el.dataset.index === filter.dataset.index;
        } else {
          return false;
        }
      };

      var filtersToUpdate = Array.from(filters).filter((el) => !matchesIndex(el));

      filtersToUpdate.forEach((fetchedFilter) => {
        var filter = document.querySelector(".js-filter[data-index=\"".concat(fetchedFilter.dataset.index, "\"]"));

        if (filter.dataset.type === 'price_range') {
          if (!e || e.target.tagName !== 'INPUT') {
            filter.querySelectorAll('input').forEach((input) => {
              input.value = fetchedHTML.getElementById(input.id).value;
              input.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { sender: 'reset' } }));
            });
          }
        } else {
          filter.innerHTML = fetchedFilter.innerHTML;
        }
      });

      this.updateActiveFilters(fetchedHTML);
      this.resultsBtn.textContent = fetchedHTML.querySelector('.js-apply-filters').innerHTML;
    };

    this.updateActiveFilters = (fetchedHTML) => {
      this.activeFiltersEl.innerHTML = fetchedHTML.querySelector('.active-filters').innerHTML;
      this.activeFiltersEl.hidden = !this.activeFiltersEl.querySelector('.active-filters__item');
    };

    this.updateURL = (searchParams) => {
      history.pushState({ searchParams }, '', "".concat(window.location.pathname).concat(searchParams && '?'.concat(searchParams)));
    };

    this.updateSortByDropdown = (sortByValue) => {
      var currentOption = this.desktopSortBy.querySelector('[aria-selected="true"]');
      var selectedOption = this.desktopSortBy.querySelector("[data-value=\"".concat(sortByValue, "\""));

      this.desktopSortBy.querySelector('.cc-select__btn').firstChild.textContent = selectedOption.textContent;
      this.desktopSortBy.querySelector('.cc-select__listbox').setAttribute('aria-activedescendant', selectedOption.id);

      currentOption.setAttribute('aria-selected', 'false');
      selectedOption.setAttribute('aria-selected', 'true');
    };

    this.onSectionUnload = () => {
      this.toggleFilters();
    };
  }();

  // Manage option dropdowns
  theme.productData = {};

  theme.OptionManager = new function () {
    var _ = this;

    _._getVariantOptionElement = function (variant, $container) {
      return $container.find('select[name="id"] option[value="' + variant.id + '"]');
    };

    _.selectors = {
      container: '.product',
      gallery: '.media-gallery',
      priceArea: '.product-price',
      submitButton: 'input[type=submit], button[type=submit]',
      multiOption: '.product-options' };


    _.strings = {
      priceNonExistent: theme.strings.priceNonExistent,
      priceSoldOut: '<span class="productlabel soldout"><span>' + theme.strings.buttonNoStock + '</span></span>',
      buttonDefault: theme.strings.buttonDefault,
      buttonNoStock: theme.strings.buttonNoStock,
      buttonNoVariant: theme.strings.buttonNoVariant,
      unitPriceSeparator: theme.strings.products_product_unit_price_separator,
      inventoryNotice: theme.strings.onlyXLeft };


    _._getString = function (key, variant) {
      var string = _.strings[key];
      if (variant) {
        string = string.replace('[PRICE]', '<span class="product-price__amount theme-money">' + theme.Shopify.formatMoney(variant.price, theme.money_format) + '</span>');
      }
      return string;
    };

    _.getProductData = function (productId) {
      var data = null;
      if (!theme.productData[productId]) {
        theme.productData[productId] = JSON.parse(document.getElementById('ProductJson-' + productId).innerHTML);
      }
      data = theme.productData[productId];
      if (!data) {
        console.log('Product data missing (id: ' + productId + ')');
      }
      return data;
    };

    _.getBaseUnit = function (variant) {
      return variant.unit_price_measurement.reference_value === 1 ?
      variant.unit_price_measurement.reference_unit :
      variant.unit_price_measurement.reference_value +
      variant.unit_price_measurement.reference_unit;
    },

    _.addVariantUrlToHistory = function (variant) {
      if (variant) {
        var newurl = window.location.protocol + '//' + window.location.host + window.location.pathname + '?variant=' + variant.id;
        window.history.replaceState({ path: newurl }, '', newurl);
      }
    };

    _.updateSku = function (variant, $container) {
      $container.find('.sku .sku__value').html(variant ? variant.sku : '');
      $container.find('.sku').toggleClass('sku--no-sku', !variant || !variant.sku);
    };

    _.updateBarcode = function (variant, $container) {
      $container.find('.barcode .barcode__value').html(variant ? variant.barcode : '');
      $container.find('.barcode').toggleClass('barcode--no-barcode', !variant || !variant.barcode);
    };

    _.updateInventoryNotice = function (variant, $container) {
      var inventoryData = _._getVariantOptionElement(variant, $container).data('inventory');
      if (inventoryData) {
        $container.find('.product-inventory-notice').removeClass('product-inventory-notice--no-inventory').html(
        _._getString('inventoryNotice').replace('[[ quantity ]]', inventoryData));

      } else {
        $container.find('.product-inventory-notice').addClass('product-inventory-notice--no-inventory').empty();
      }
    };

    _.updateBackorder = function (variant, $container) {
      var $backorder = $container.find('.backorder');
      if ($backorder.length) {
        if (variant && variant.available) {
          if (variant.inventory_management && _._getVariantOptionElement(variant, $container).data('stock') == 'out') {
            var productData = _.getProductData($container.data('product-id'));
            $backorder.find('.backorder__variant').html(productData.title + (variant.title.indexOf('Default') >= 0 ? '' : ' - ' + variant.title));
            $backorder.show();
          } else {
            $backorder.hide();
          }
        } else {
          $backorder.hide();
        }
      }
    };

    _.updatePrice = function (variant, $container) {
      var $priceArea = $container.find(_.selectors.priceArea);
      if (!$priceArea.length) return;

      $priceArea.removeClass('on-sale');

      if (variant && variant.available == true) {
        var $newPriceArea = $('<div>');
        $('<span class="product-price__amount theme-money">').html(theme.Shopify.formatMoney(variant.price, theme.money_format)).appendTo($newPriceArea);
        if (variant.compare_at_price > variant.price) {
          $newPriceArea.append(' ');
          $('<span class="product-price__compare theme-money">').html(theme.Shopify.formatMoney(variant.compare_at_price, theme.money_format)).appendTo($newPriceArea);
          $priceArea.addClass('on-sale');
        }
        if (variant.unit_price_measurement) {
          var $newUnitPriceArea = $('<div class="unit-price">').appendTo($newPriceArea);
          $('<span class="unit-price__price theme-money">').html(theme.Shopify.formatMoney(variant.unit_price, theme.money_format)).appendTo($newUnitPriceArea);
          $('<span class="unit-price__separator">').html(_._getString('unitPriceSeparator')).appendTo($newUnitPriceArea);
          $('<span class="unit-price__unit">').html(_.getBaseUnit(variant)).appendTo($newUnitPriceArea);
        }
        $priceArea.html($newPriceArea.html());
      } else {
        if (variant) {
          $priceArea.html(_._getString('priceSoldOut', variant));
        } else {
          $priceArea.html(_._getString('priceNonExistent', variant));
        }
      }

      var input = $container[0].querySelector('input[name="id"]');
      input.value = variant.id;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };

    _._updateButtonText = function ($button, string, variant) {
      $button.each(function () {
        var newVal;
        newVal = _._getString('button' + string, variant);
        if (newVal !== false) {
          if ($(this).is('input')) {
            $(this).val(newVal);
          } else {
            $(this).html(newVal);
          }
        }
      });
    };

    _.updateButtons = function (variant, $container) {
      var $button = $container.find(_.selectors.submitButton);

      if (variant && variant.available == true) {
        $button.removeAttr('disabled');
        _._updateButtonText($button, 'Default', variant);
      } else {
        $button.attr('disabled', 'disabled');
        if (variant) {
          _._updateButtonText($button, 'NoStock', variant);
        } else {
          _._updateButtonText($button, 'NoVariant', variant);
        }
      }
    };

    _.updateContainerStatusClasses = function (variant, $container) {
      $container.toggleClass('variant-status--unavailable', !variant.available);
      $container.toggleClass('variant-status--backorder', variant.available &&
      variant.inventory_management &&
      _._getVariantOptionElement(variant, $container).data('stock') == 'out');
    };

    _.getSelectedOptions = function (optionSelectors, selectorType) {
      var selectedOptions = [];

      optionSelectors.forEach((selector) => {
        if (selectorType === 'dropdown') {
          selectedOptions.push(selector.querySelector('.cc-select__btn').textContent.trim());
        } else {
          selectedOptions.push(selector.querySelector('input:checked').value);
        }
      });

      return selectedOptions;
    };

    _.updateVariantAvailability = function (selectedVariant, $container, productData) {
      var optionSelectors = $container[0].querySelectorAll('.option-selector');
      var { selectorType } = optionSelectors[0].dataset;
      var currVariant = selectedVariant;

      if (!currVariant) {
        currVariant = {
          options: _.getSelectedOptions(optionSelectors, selectorType) };

      }

      var updateOptionAvailability = (optionEl, available, soldout) => {
        var text = soldout ? theme.strings.buttonNoStock : theme.strings.buttonNoVariant;
        optionEl.classList.toggle('is-unavailable', !available);

        if (selectorType === 'dropdown') {
          var em = optionEl.querySelector('em');

          if (em) {
            em.setAttribute('aria-hidden', available);
          }

          if (!available) {
            if (em) {
              em.textContent = text;
            } else {
              optionEl.innerHTML = "".concat(optionEl.innerHTML, " <em>").concat(text, "</em>");
            }
          }
        } else {
          if (!available) {
            optionEl.nextElementSibling.title = text;
          } else {
            optionEl.nextElementSibling.removeAttribute('title');
          }
        }
      };

      // Flag all options as unavailable
      $container[0].querySelectorAll('.js-option').forEach((optionEl) => {
        updateOptionAvailability(optionEl, false, false);
      });

      // Flag options in each selector as available or sold out, depending on the variant avilability 
      optionSelectors.forEach((selector, selectorIndex) => {
        productData.variants.forEach((variant) => {
          var matchCount = 0;

          variant.options.forEach((option, optionIndex) => {
            if (option === currVariant.options[optionIndex] && optionIndex !== selectorIndex) {
              matchCount += 1;
            }
          });

          if (matchCount === currVariant.options.length - 1) {
            var optionValue = variant.options[selectorIndex];
            // const attrSelector = selectorType === 'dropdown' ? `[data-value="${option}"]` : `[value="${option}"]`;
            // const optionEl = selector.querySelector(attrSelector);
            var options = selector.querySelectorAll('.js-option');
            var optionEl = [...options].find((el) => {
              if (selectorType === 'dropdown') {
                return el.firstElementChild.textContent === optionValue;
              } else {
                return el.nextElementSibling.textContent === optionValue;
              }
            });

            if (optionEl) {
              updateOptionAvailability(optionEl, variant.available, !variant.available);
            }
          }
        });
      });
    };

    _.updateProductDetails = function (variant, $container, firstrun) {
      var $productGallery = $container.find(_.selectors.gallery);
      var $productForm = $container.find('.js-product-form');
      var $productOptions = $container.find(_.selectors.multiOption);
      var productData = _.getProductData($container.data('product-id'));

      _.updatePrice(variant, $container);
      _.updateButtons(variant, $container);
      _.updateBarcode(variant, $container);
      _.updateSku(variant, $container);
      _.updateInventoryNotice(variant, $container);
      _.updateBackorder(variant, $container);
      _.updateContainerStatusClasses(variant, $container);

      // Update availability in option selectors
      if ($productOptions.length && $productOptions.data('show-availability')) {
        _.updateVariantAvailability(variant, $container, productData);
      }

      // Update media
      if (variant && variant.featured_media) {
        $productGallery.trigger('variantImageSelected', variant);
      }

      // Broadcast the variant update
      $(window).trigger('cc-variant-updated', {
        variant: variant,
        product: productData });


      // Add variant url to history
      if ($productForm.data('enable-history-state') && !firstrun) {
        _.addVariantUrlToHistory(variant);
      }
    };

    _.initProductOptions = function (section) {
      var $container = $(section);
      var $productForm = $container.find('.js-product-form');
      var $productOptions = $container.find(_.selectors.multiOption);
      var $variantSelector = $container.find('select[name="id"]');

      if ($productOptions.length) {
        var productData = _.getProductData(section.dataset.productId);
        var optionSelectors = section.querySelectorAll('.option-selector');
        var { selectorType } = optionSelectors[0].dataset;

        var handleVariantChange = (e) => {
          var selectedOptions = _.getSelectedOptions(optionSelectors, selectorType);

          // Get selected variant data (if variant exists)
          var variant = productData.variants.find(
          (v) => v.options.every((val, index) => val === selectedOptions[index]));


          if (variant) {
            $variantSelector.val(variant.id);
          } else {
            variant = false;
          }

          if (e.type === 'change' && selectorType === 'buttons' && e.target.nextElementSibling.hasAttribute('data-swatch')) {
            section.querySelector('.js-color-text').textContent = e.target.nextElementSibling.textContent;
          }

          _.updateProductDetails(variant, $container, e.type === 'firstrun');
        };

        $productOptions.on('change.themeProductOptions firstrun.themeProductOptions', handleVariantChange);
        $productOptions.trigger('firstrun');
      } else if ($variantSelector.length) {
        var _productData = _.getProductData(section.dataset.productId);
        var variant = _productData.variants.find((v) => v.id === Number($variantSelector.val()));
        _.updateProductDetails(variant, $container, true);
      }

      if ($productForm) {
        theme.applyAjaxToProductForm($productForm);
      }
    };

    _.unloadProductOptions = function (section) {
      var $container = $(section);
      var $productForm = $container.find('.js-product-form');
      var $productOptions = $container.find(_.selectors.multiOption);
      var $variantSelector = $container.find('select[name="id"]');

      if ($productOptions.length) {
        $productOptions.off('.themeProductOptions');
      }

      if ($productForm) {
        $variantSelector.off('.themeProductOptions');
        theme.removeAjaxFromProductForm($productForm);
      }
    };
  }();

  theme.SlideshowSection = new function () {
    var _ = this;

    this.onSectionLoad = function (target) {
      // Set up the slideshow
      $('.slideshow', target).each(function () {
        var isCarousel = $(this).data('carousel');
        var doFade = $(this).data('transition') === 'fade';

        $(this).on('init', function () {
          $('.lazyload-manual', this).removeClass('lazyload-manual').addClass('lazyload');

          if (theme.settings.enable_overlay_transition) {
            // Reveal overlays
            $('.slick-active .transition', this).removeClass('transition-out').each(function () {
              // Match clones
              $(this).closest('.slideshow').find('.slick-clone .block-' + $(this).closest('.slide').data('index') + ' .transition').removeClass('transition-out');
            });
          }
        }).on('afterChange setPosition', function () {
          if (theme.settings.enable_overlay_transition) {
            // Hide overlays when off screen
            $('.slick-slide:not(.slick-active):not(.slick-clone) .transition', this).addClass('transition-out').each(function () {
              // Match clones
              $(this).closest('.slideshow').find('.slick-clone:not(.slick-active) .block-' + $(this).closest('.slide').data('index') + ' .transition').addClass('transition-out');
            });
            // Reveal overlays
            $('.slick-active .transition', this).removeClass('transition-out').each(function () {
              // Match clones (a clone can be active in carousel)
              $(this).closest('.slideshow').find('.block-' + $(this).closest('.slide').data('index') + ' .transition').removeClass('transition-out');
            });
          }
        }).slick({
          autoplay: $(this).data('autoplay'),
          fade: !isCarousel && doFade,
          infinite: true,
          slidesToShow: isCarousel ? 2 : 1,
          slidesToScroll: isCarousel ? 2 : 1,
          speed: doFade ? 1000 : 400,
          cssEase: doFade ? 'ease' : 'cubic-bezier(0.86, 0, 0.07, 1)',
          arrows: true,
          dots: false,
          prevArrow: [
          '<button type="button" class="slick-prev" aria-label="', theme.strings.previous, '">',
          '<span class="hide-until-sm">',
          theme.icons.chevronLightLeft,
          '</span>',
          '<span class="show-until-sm">',
          theme.icons.arrowLeft,
          '</span>',
          '</button>'].
          join(''),
          nextArrow: [
          '<button type="button" class="slick-next" aria-label="', theme.strings.next, '">',
          '<span class="hide-until-sm">',
          theme.icons.chevronLightRight,
          '</span>',
          '<span class="show-until-sm">',
          theme.icons.arrowRight,
          '</span>',
          '</button>'].
          join(''),
          autoplaySpeed: $(this).data('autoplay-speed') * 1000, // milliseconds to wait between slides
          responsive: [
          {
            breakpoint: 960,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1 } },


          {
            breakpoint: 768,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
              cssEase: 'cubic-bezier(0.77, 0, 0.175, 1)',
              arrows: true,
              dots: true } }] });




      });
    };

    this.onSectionUnload = function (target) {
      $('.slick-slider', target).slick('unslick').off('init afterChange setPosition');
      $(window).off('.slideshowSection');
    };

    this.onBlockSelect = function (target) {
      $(target).closest('.slick-slider').
      slick('slickGoTo', $(target).data('slick-index')).
      slick('slickPause');
    };

    this.onBlockDeselect = function (target) {
      $(target).closest('.slick-slider').
      slick('slickPlay');
    };
  }();

  theme.SlideshowWithTextSection = new function () {
    this.onSectionLoad = function (target) {
      $('.slideshow', target).each(function () {
        $(this).on('init', function () {
          $('.lazyload-manual', this).removeClass('lazyload-manual').addClass('lazyload');
        }).slick({
          autoplay: $(this).data('autoplay'),
          fade: $(this).data('transition') === 'fade',
          autoplaySpeed: $(this).data('autoplay-speed') * 1000, // milliseconds to wait between slides
          infinite: true,
          arrows: true,
          prevArrow: [
          '<button type="button" class="slick-prev" aria-label="', theme.strings.previous, '">',
          '<span class="hide-until-sm">',
          theme.icons.chevronLightLeft,
          '</span>',
          '<span class="show-until-sm">',
          theme.icons.arrowLeft,
          '</span>',
          '</button>'].
          join(''),
          nextArrow: [
          '<button type="button" class="slick-next" aria-label="', theme.strings.next, '">',
          '<span class="hide-until-sm">',
          theme.icons.chevronLightRight,
          '</span>',
          '<span class="show-until-sm">',
          theme.icons.arrowRight,
          '</span>',
          '</button>'].
          join(''),
          dots: true });

      });
    };

    this.onSectionUnload = function (target) {
      $('.slick-slider', target).slick('unslick').off('init');
    };

    this.onBlockSelect = function (target) {
      $(target).closest('.slick-slider').
      slick('slickGoTo', $(target).data('slick-index')).
      slick('slickPause');
    };

    this.onBlockDeselect = function (target) {
      $(target).closest('.slick-slider').
      slick('slickPlay');
    };
  }();

  theme.MainProductSection = new function () {
    var galleries = [];

    this.onSectionLoad = function (target) {
      // Init store availability if applicable
      if ($('[data-store-availability-container]', target).length) {
        this.storeAvailability = new theme.StoreAvailability($('[data-store-availability-container]', target)[0]);
      }

      $('.media-gallery:not(.media-gallery--initialized)', target).each(function () {
        galleries.push(new theme.ProductMediaGallery($(this)));
      });

      theme.OptionManager.initProductOptions(target);

      var $reviewsLink = $('.product-reviews-link', target);
      var reviewsSection = document.getElementById('shopify-product-reviews');

      if ($reviewsLink.length && !reviewsSection) {
        $reviewsLink.attr('disabled', '');
      } else {
        $reviewsLink.on('click', function (e) {
          e.preventDefault();
          $('html, body').animate({
            scrollTop: $($(this).attr('href')).offset().top - 120 },
          500, 'swing');
        });
      }
    };

    this.onSectionUnload = function (target) {
      theme.OptionManager.unloadProductOptions(target);

      $('.size-chart-link', target).off('click');
      if (galleries.length) {
        for (var i = 0; i < galleries.length; i++) {
          galleries[i].destroy();
        }
      }

      if (this.storeAvailability) {
        this.storeAvailability.onSectionUnload();
      }
    };
  }();

  theme.FeaturedProductSection = new function () {
    var galleries = [];

    this.onSectionLoad = function (target) {
      $('.media-gallery:not(.media-gallery--initialized)', target).each(function () {
        galleries.push(new theme.ProductMediaGallery($(this)));
      });
      theme.OptionManager.initProductOptions(target);
    };

    this.onSectionUnload = function (target) {
      theme.OptionManager.unloadProductOptions(target);
      if (galleries.length) {
        for (var i = 0; i < galleries.length; i++) {
          galleries[i].destroy();
        }
      }
    };
  }();

  theme.TestimonialsSection = new function () {
    var _ = this;

    this.assessTestimonialCarouselLayout = function (target) {
      $('.testimonials-nav__list.slick-slider', target).each(function () {
        var containerWidth = $(this).width();
        var itemsSumWidth = 0;
        $(this).find('.slick-slide').each(function () {
          itemsSumWidth += $(this).outerWidth(true) + 1; // defensive rounding
        });
        $(this).toggleClass('slick-slider--center-carousel', itemsSumWidth < containerWidth);
      });
    };

    this.onSectionLoad = function (target) {
      var $carousel = $('.testimonials-nav__list', target);

      // Initialise carousel
      $carousel.on('afterChange', function (e, slideshow) {
        // Prepare for caption transition
        var $container = $(this).closest('.testimonials');
        clearTimeout($container.data('captionChangeTimeoutId'));
        clearTimeout($container.data('captionChangeTimeoutId2'));
        var captionToShowEl = $container.find('.testimonial')[$container.find('.slick-current').data('slick-index')];
        $container.find('.testimonial--active').addClass('testimonial--fade-out');
        $container.data(
        'captionChangeTimeoutId',
        setTimeout(function () {
          $(captionToShowEl).addClass('testimonial--active testimonial--fade-out').siblings('.testimonial--active').removeClass('testimonial--active');
          // Initiate fade-in after old one has faded out and new one is ready to fade in
          $container.data(
          'captionChangeTimeoutId2',
          setTimeout(function () {
            $(captionToShowEl).removeClass('testimonial--fade-out');
          }, 10));

        }, 400) // matches css transition
        );
      }).slick({
        autoplay: $carousel.data('autoplay'),
        autoplaySpeed: $carousel.data('autoplay-delay'),
        infinite: false,
        slidesToShow: 1,
        centerMode: true,
        variableWidth: true,
        useTransform: true,
        arrows: false,
        dots: false });


      // Focus on click
      $carousel.on('click keydown', '.testimonial-author', function (e) {
        if (e.type === 'keydown' && e.keyCode !== 13) return;
        $carousel.slick('slickGoTo', $(this).parent().data('slick-index'));
      });

      // Assess if we can centre the carousel or not
      $(window).off('.testimonialsSection').on('debouncedresize.testimonialsSection', function () {
        _.assessTestimonialCarouselLayout(target);
        $carousel.slick('setPosition');
      });
      _.assessTestimonialCarouselLayout(target);
    };

    this.onSectionUnload = function (target) {
      $('.slick-slider', target).slick('unslick').off('init afterChange click');
      $(window).off('.testimonialsSection');
    };

    this.onBlockSelect = function (target) {
      var $carousel = $(target).closest('.slick-slider');
      if ($carousel.data('autoplay')) {
        $carousel.slick('slickGoTo', $(target).data('slick-index')).slick('slickPause');
      }
    };

    this.onBlockDeselect = function (target) {
      var $carousel = $(target).closest('.slick-slider');
      if ($carousel.data('autoplay')) {
        $carousel.slick('slickPlay');
      }
    };
  }();

  theme.BlogSection = new function () {
    this.onSectionLoad = function (target) {

      $('#filter-tag', target).on('change', function () {
        window.location = $(this).val();
      });

      // Set up mobile filter reveal link
      $('.blog-filter-toggle', target).on('click', function (e) {
        e.preventDefault();

        // Hide btn
        var revealBtnContHeight = $(this).outerHeight(true) + 2; // plus 2 for underline style
        $(this).closest('.blog-filter-reveal').addClass('blog-filter-reveal--fade-out');

        // Prep filters
        var $filters = $(this).closest('.section-content').find('.blog-filter');
        $filters.height(revealBtnContHeight);

        // Show filters
        setTimeout(function () {
          $filters.addClass('filters--transition');
          setTimeout(function () {
            $filters.css({
              height: $filters.find('.blog-filter__inner').height() + 'px',
              opacity: 1 });

          }, 10);
        }, 250);
      });
    };

    this.onSectionUnload = function (target) {
      $('#filter-tag', target).off('change');
      $('.blog-filter-toggle', target).off('click');
    };
  }();

  theme.announcementHeight = 0;
  theme.HeaderSection = new function () {
    this.onSectionLoad = function (target) {
      // Search
      if (theme.settings.enable_search) {
        var $searchWrapper = $('.header-search__results-wrapper');
        var $searchContainer = $('.header-search__content', target);
        var $searchResultsContainer = $('.header-search__results', target);
        var currentReq = null;
        var searchThrottleDelay = 400;
        var searchThrottleTimeoutId = -1;
        var imageReplaceRegex = {
          search: /(\.[^\.]+)$/,
          replace: '_100x$1' };

        var removeResultsAndPrepForMore = function removeResultsAndPrepForMore() {
          var $oldResults = $searchResultsContainer.addClass('header-search__results--disband');
          setTimeout(function () {
            $oldResults.remove();
          }, 500);
          $searchResultsContainer = $('<div class="header-search__results">').insertAfter($searchResultsContainer);
        };
        $('.header-search .input-with-button__input', target).on('change.themeHeaderSection keyup.themeHeaderSection paste.themeHeaderSection', function (e) {
          var $input = $(this),
          $form = $(this).closest('form'),
          includeMeta = $searchWrapper.data('live-search-meta');

          // Has value changed?
          if ($input.val() == $input.data('previous-value')) {
            return;
          }

          // Set content state
          $searchContainer.toggleClass('header-search__content--input-entered', $input.val().length > 0);

          // Set loading state
          $searchContainer.addClass('header-search__content--loading');

          // Fetch after short timeout, to avoid multiple requests after rapid keypresses
          clearTimeout(searchThrottleTimeoutId);

          if ($input.val().length == 0) {
            removeResultsAndPrepForMore();
            $searchContainer.removeClass('header-search__content--has-results header-search__content--loading');
            return;
          }

          searchThrottleTimeoutId = setTimeout(function () {
            // Avoid overlapping requests - abort and fetch latest
            if (currentReq) {
              currentReq.abort();
            }
            // Fetch info
            $input.data('previous-value', $input.val());

            var ajaxUrl, ajaxData;
            if (theme.Shopify.features.predictiveSearch) {
              // Use the API
              ajaxUrl = theme.routes.search_url + '/suggest.json';
              ajaxData = {
                "q": $form.find('input[name="q"]').val(),
                "resources": {
                  "type": $form.find('input[name="type"]').val(),
                  "limit": 6,
                  "options": {
                    "unavailable_products": 'last',
                    "fields": includeMeta ? "title,product_type,variants.title,vendor,tag,variants.sku" : "title,product_type,variants.title,vendor" } } };



            } else {
              // Use the theme template fallback
              ajaxUrl = $form.attr('action') + ($form.attr('action').indexOf('?') > -1 ? '&' : '?') + $form.serialize() + '&view=data';
              ajaxData = null;
            }
            currentReq = $.ajax({
              url: ajaxUrl,
              data: ajaxData,
              dataType: "json",
              success: function success(response) {
                var resultsData = response.resources.results;

                removeResultsAndPrepForMore();
                $searchContainer.toggleClass('header-search__content--has-results', resultsData.products.length > 0);

                for (var i = 0; i < resultsData.products.length; i++) {
                  var p = resultsData.products[i];
                  var $result = $('<a class="search-result__link">').attr('href', p.url);
                  if (p.image) {
                    $('<div class="search-result__image">').append(
                    $('<img>').attr('src', p.image.replace(imageReplaceRegex.search, imageReplaceRegex.replace)).attr('alt', p.title)).
                    appendTo($result);
                  }
                  var $resultRight = $('<div class="search-result__detail">').appendTo($result);

                  var showVendor = $searchWrapper.data('live-search-vendor');

                  if (showVendor) {
                    $('<div class="search-result__vendor">').html(p.vendor).appendTo($resultRight);
                  }

                  $('<div class="search-result__title">').html(p.title).appendTo($resultRight);

                  var $price = $('<div class="search-result__price product-price">').appendTo($resultRight);
                  if (p.price_max != p.price_min) {
                    $('<span class="product-price__from">').html(theme.strings.productsListingFrom).appendTo($price);
                    $price.append(' ');
                  }
                  $('<span class="product-price__amount theme-money">').html(theme.Shopify.formatMoney(p.price_min, theme.money_format)).appendTo($price);
                  if (p.compare_at_price_min > p.price_min) {
                    $price.append(' ');
                    $('<span class="product-price__compare theme-money">').html(theme.Shopify.formatMoney(p.compare_at_price_min, theme.money_format)).appendTo($price);
                  }

                  $('<div class="search-result">').append($result).appendTo($searchResultsContainer);
                }

                if (resultsData.pages && resultsData.pages.length || resultsData.articles && resultsData.articles.length) {
                  var $pageResults = $('<div class="header-search__page-results">');
                  var addResults = function addResults(pageResultsData) {
                    for (var i = 0; i < pageResultsData.length; i++) {
                      var item = pageResultsData[i];
                      var $result = $('<a class="search-result__link">').attr('href', item.url).html(item.title);

                      $('<div class="search-result">').append($result).appendTo($pageResults);
                    }
                  };

                  $('<h3 class="header-search__small-heading meta">').html(theme.strings.searchResultsPages).appendTo($pageResults);

                  if (resultsData.pages) addResults(resultsData.pages);
                  if (resultsData.articles) addResults(resultsData.articles);

                  $pageResults.appendTo($searchResultsContainer);
                }

                if (resultsData.products.length > 0) {
                  $('<a class="feature-link">').attr('href', theme.routes.search_url + '?' + $input.closest('form').serialize()).
                  html(theme.strings.searchSeeAll).
                  appendTo($searchResultsContainer);
                }
                var $thisSearchResultsContainer = $searchResultsContainer;
                setTimeout(function () {
                  $thisSearchResultsContainer.addClass('header-search__results--show');
                }, 10);
              },
              error: function error(response) {
                console.log('Error', response);
              },
              complete: function complete(response) {
                currentReq = null;
                $searchContainer.removeClass('header-search__content--loading');
              } });

          }, searchThrottleDelay);
        });
      }

      // Set announcement offset for scroll checks
      var announcement = document.querySelector('.announcement');
      if (announcement) {
        theme.announcementHeight = announcement.clientHeight;
        $(window).on('debouncedresize.headerSection', function () {
          theme.announcementHeight = announcement.clientHeight;
        });
      } else {
        theme.announcementHeight = 0;
      }

      // Alter classes on scroll for sticky headers
      $('body').removeClass('scrolled-down');
      if ($('.pageheader__contents--sticky', target).length) {
        var setScrolledState = function setScrolledState() {
          if (!$('body').hasClass('scrolled-down') && $(window).scrollTop() > theme.announcementHeight) {
            $('body').css('overflow-anchor', 'none');
            clearTimeout(theme.debouncedWindowScrollOverflowAnchorTimeoutId);
            theme.debouncedWindowScrollOverflowAnchorTimeoutId = setTimeout(function () {
              $('body').css('overflow-anchor', '');
            }, 255);
          }
          $('body').toggleClass('scrolled-down', $(window).scrollTop() > theme.announcementHeight);
        };

        $(window).on('scroll.headerSection', setScrolledState);
        setScrolledState();
      }

      $('.disclosure', target).each(function () {
        $(this).data('disclosure', new theme.Disclosure($(this)));
      });

      var $inlineLinksContainer = $('.inline-header-nav > .nav-row');
      var $inlineLinks = $('.inline-header-nav .tier-1 > ul');

      function checkInlineNavWidth() {
        // Check when to show/hide the inline nav
        if (theme.nav.bar.isInlineNavEnabled() &&
        $inlineLinksContainer.outerWidth() > $inlineLinks.outerWidth()) {
          theme.nav.bar.changeToInline();
        } else {
          theme.nav.bar.changeToBurger();
        }
      }
      checkInlineNavWidth();
      $(window).on('debouncedresize.inlinenav', checkInlineNavWidth);
    };

    this.onSectionUnload = function (target) {
      if (theme.settings.enable_search) {
        $('.header-search .input-with-button__input', target).off('.themeHeaderSection');
      }

      $('.disclosure', target).each(function () {
        $(this).data('disclosure').unload();
      });

      $(window).off('.headerSection');
      $(window).off('debouncedresize.inlinenav');
    };
  }();

  theme.FooterSection = new function () {
    this.onSectionLoad = function (target) {
      $('.disclosure', target).each(function () {
        $(this).data('disclosure', new theme.Disclosure($(this)));
      });
    };

    this.onSectionUnload = function (target) {
      $('.disclosure', target).each(function () {
        $(this).data('disclosure').unload();
      });
    };
  }();

  theme.CartSection = new function () {
    this.onSectionLoad = function (target) {
      // Terms and conditions checkbox
      if ($('#cartform input#terms', target).length > 0) {
        $(document).on('click.cartSection', '#cartform [name="checkout"]:submit, a[href="/checkout"]', function () {
          if ($('#cartform input#terms:checked').length == 0) {
            alert(theme.strings.cartTermsConfirmation);
            return false;
          }
        });
      }

      theme.cartNoteMonitor.load($('.note-area [name="note"]', target));
    };

    this.onSectionUnload = function (target) {
      $(document).off('.cartSection');
      theme.cartNoteMonitor.unload($('.note-area [name="note"]', target));
    };
  }();

  theme.toggleNav = function () {
    if ($('html').hasClass('open-menu')) {
      $('#main-menu .lazyload-manual').removeClass('lazyload-manual').addClass('lazyload');
      theme.checkMenuPadding();
      $('body').css('padding-right', $.scrollBarWidth());
    } else {
      $('body').css('padding-right', '');
    }
  };

  theme.namespaceFromSection = function (container) {
    return ['.', $(container).data('section-type'), $(container).data('section-id')].join('');
  };

  $(function ($) {
    var nonTouch = window.matchMedia('(hover: hover)').matches && !window.matchMedia('(any-pointer: coarse)').matches;
    var winHeight = window.innerHeight;
    var isPortrait = window.matchMedia('(orientation: portrait)').matches;

    theme.setViewportHeight = () => {
      var announcementBar = document.getElementById('shopify-section-announcement');
      var viewportHeight = window.innerHeight;

      if (announcementBar) {
        viewportHeight -= announcementBar.offsetHeight;
      }

      document.documentElement.style.setProperty('--viewport-height', "".concat(viewportHeight, "px"));
    };
    theme.setViewportHeight();

    window.addEventListener('resize', theme.debounce(() => {
      if (window.innerHeight === winHeight) return;
      var isPortraitNow = window.matchMedia('(orientation: portrait)').matches;

      if (nonTouch || window.innerWidth > 1280) {
        theme.setViewportHeight();
      } else if (isPortraitNow !== isPortrait) {
        theme.setViewportHeight();
      }

      winHeight = window.innerHeight;
      isPortrait = isPortraitNow;
    }, 250));

    if (!document.documentElement.classList.contains('template-password')) {
      document.getElementById('main-menu-disclosure').open = true;

      theme.setHeaderHeight = () => {
        var pageHeader = document.getElementById('pageheader__contents');
        document.documentElement.style.setProperty('--header-height', "".concat(pageHeader.offsetHeight, "px"));
      };
      theme.setHeaderHeight();
      window.addEventListener('resize', theme.debounce(theme.setHeaderHeight, 250));

      // Persistent events for nav interaction
      $(document).on('keydown', '.main-menu-toggle:not(.main-menu-toggle--back)', function (e) {
        // Return or space - toggle menu and move focus
        if (e.which == 13 || e.which == 32) {
          e.preventDefault();
          e.stopPropagation();
          $('html').toggleClass('open-menu');
          theme.toggleNav();
          if ($('html').hasClass('open-menu')) {
            $('#main-menu .main-menu-links a:first').focus();
          } else {
            $('#pageheader .main-menu-toggle').focus();
          }
        }
      });

      $(document).on('click', '.main-menu-toggle', function (e) {
        e.preventDefault();

        // Only toggle nav if the button is not in 'back mode'
        if ($('html').hasClass('open-menu') && $(this).hasClass('main-menu-toggle--back')) {
          return;
        }

        $('html').toggleClass('open-menu');
        theme.toggleNav();
      });

      $(document).on('click', '.side-drawer__close-btn', function (e) {
        document.documentElement.classList.remove('open-side-drawer');
        e.target.closest('.side-drawer').classList.remove('is-open');
      });

      $(document).on('click', '.bg-overlay', function () {
        var rootClasses = document.documentElement.classList;

        if (rootClasses.contains('open-menu')) {
          rootClasses.remove('open-menu');
          theme.toggleNav();
        } else {
          rootClasses.remove('open-side-drawer');
          document.querySelector('.side-drawer.is-open').classList.remove('is-open');
        }
      });

      var menuPanelTransitionDelay = 300;
      $(document).on('click', '.has-children > .main-menu-link', function (e) {
        e.preventDefault();
        $(this).attr('aria-expanded', 'true');
        var $disappearing = $(this).closest('.main-menu-panel').addClass('main-menu-panel--inactive-left');
        var $appearing = $('#' + $(this).attr('aria-controls'));

        $disappearing.attr('aria-hidden', 'true');
        $appearing.attr('aria-hidden', 'false');

        $('.main-menu-toggle').addClass('main-menu-toggle--back');
        setTimeout(function () {
          $appearing.removeClass('main-menu-panel--inactive-right');
        }, menuPanelTransitionDelay);
      });

      $(document).on('click', '.open-menu .main-menu-toggle.main-menu-toggle--back', function (e) {
        e.preventDefault();
        var $activeNav = $('.main-menu-panel:not(.main-menu-panel--inactive-left):not(.main-menu-panel--inactive-right)');
        $activeNav.find('.main-menu-panel__back-link').trigger('click');

        setTimeout(function () {
          $('.main-menu-panel--inactive-right').attr('aria-hidden', 'true');
          $('.main-menu-panel:not(.main-menu-panel--inactive-left):not(.main-menu-panel--inactive-right)').
          attr('aria-hidden', 'false');
        }, menuPanelTransitionDelay);
        return false;
      });

      // Handle expanding nav
      theme.lastHoverInteractionTimestamp = -1;
      $(document).on('click', '.multi-level-nav .nav-rows .contains-children > a', function () {
        $(this).parent().find('ul:first').slideToggle(300);
        return false;
      });

      $(document).on('click forceopen forceclose', '.multi-level-nav .contains-mega-menu a.has-children', function (e) {
        // Skip column headings
        if ($(this).hasClass('column-title')) {
          return true;
        }

        /**
         * Done this way (checking for non-touch as opposed to touch) so that top level nav links
         * are only ENABLED if the device has hover capability AND no coarse pointer at all.
         * 
         * Checking for touch screen devices in this instance is flawed, because disabling links for
         * devices whose primary input is 'touch' would mean they were enabled for laptop and desktop
         * PCs with touchscreen capability. Using the touch facility on these devices would mean that
         * clicking a top level nav link would follow the link, rather than opening the mega menu.
         * 
         * Unfortunately top level links won't be enabled on laptops/desktops with a touchscreen,
         * but that's preferable to not being able to open the mega menu via the touchscreen!
         * 
         * We could just disable links for (any-pointer: coarse), but doing it this way is safer.
         */
        if (!nonTouch) {
          e.preventDefault();
        }

        var navAnimSpeed = 200;

        // Check if mouse + click events occurred in same event chain
        var thisInteractionTimestamp = Date.now();
        if (e.type == 'click' && thisInteractionTimestamp - theme.lastHoverInteractionTimestamp < 500) {
          return false;
        }
        if (e.type == 'forceopen' || e.type == 'forceclose') {
          theme.lastHoverInteractionTimestamp = thisInteractionTimestamp;
        }

        // Set some useful vars
        var $tierEl = $(this).closest('[class^="tier-"]');
        var $tierCont = $tierEl.parent();
        var targetTierNum = parseInt($tierEl.attr('class').split('-')[1]) + 1;
        var targetTierClass = 'tier-' + targetTierNum;

        // Remove nav for all tiers higher than this one (unless we're opening on same level on hover)
        if (e.type != 'forceopen') {
          $tierCont.children().each(function () {
            if (parseInt($(this).attr('class').split('-')[1]) >= targetTierNum) {
              if (e.type == 'forceclose') {
                $(this).removeClass('tier-appeared');
                var $this = $(this);
                theme.hoverRemoveTierTimeoutId = setTimeout(function () {
                  $this.remove();
                }, 260);
              } else {
                $(this).slideUpAndRemove(navAnimSpeed);
              }
            }
          });
        }

        // Are we expanding or collapsing
        if ($(this).hasClass('expanded') && e.type != 'forceopen') {
          // Collapsing. Reset state
          $(this).removeClass('expanded').removeAttr('aria-expanded').removeAttr('aria-controls');
        } else {
          /// Show nav
          // Reset other nav items at this level
          $tierEl.find('a.expanded').removeClass('expanded').removeAttr('aria-expanded');
          clearTimeout(theme.hoverRemoveTierTimeoutId);

          // If next tier div doesn't exist, make it
          var $targetTierEl = $tierCont.children('.' + targetTierClass);
          if ($targetTierEl.length == 0) {
            $targetTierEl = $('<div />').addClass(targetTierClass).attr('id', 'menu-' + targetTierClass).appendTo($tierCont);
            if (navAnimSpeed > 0) {
              // New tier, start at 0 height
              $targetTierEl.css('height', '0px');
            }
          } else {
            if (navAnimSpeed > 0) {
              // Tier exists, fix its height before replacing contents
              $targetTierEl.css('height', $targetTierEl.height() + 'px');
            }
          }
          // Populate new tier
          $targetTierEl.empty().stop(true, false).append($(this).siblings('ul').clone().attr('style', ''));
          $targetTierEl.append($(this).parent().find('.nav-contact-info').clone());

          if (navAnimSpeed > 0) {
            // Transition to correct height, then clear height css
            $targetTierEl.animate(
            {
              height: $targetTierEl.children().outerHeight() },

            navAnimSpeed,
            function () {
              $(this).css('height', '');
            });

          }
          // Add class after reflow, for any transitions
          setTimeout(function () {
            $targetTierEl.addClass('tier-appeared');
          }, 10);
          // Mark as expanded
          $(this).addClass('expanded').attr('aria-expanded', 'true').attr('aria-controls', 'menu-' + targetTierClass);
          $('body').addClass('nav-mega-open');
        }
      });

      // Expanding nav on hover
      theme.closeOpenMenuItem = function () {
        $('body').removeClass('nav-mega-open');
        $('.multi-level-nav .has-children.expanded').trigger('forceclose');
      };

      $(document).on('mouseenter mouseleave', '.multi-level-nav .tier-1 .contains-mega-menu', function (e) {
        if (theme.viewport.isSm()) {
          clearTimeout(theme.closeOpenMenuItemTimeoutId);
          if (e.type == 'mouseenter') {
            $('.lazyload-manual', this).removeClass('lazyload-manual').addClass('lazyload');
            $(this).children('a').trigger('forceopen');
          } else {
            theme.closeOpenMenuItemTimeoutId = setTimeout(theme.closeOpenMenuItem, 200);
          }
        }
      });

      $(document).on('mouseenter', '.multi-level-nav .contains-children', function () {
        $('.lazyload-manual', this).removeClass('lazyload-manual').addClass('lazyload');
      });

      $(document).on('mouseleave', '.multi-level-nav .tier-appeared', function () {
        if (theme.viewport.isSm()) {
          clearTimeout(theme.closeOpenMenuItemTimeoutId);
          theme.closeOpenMenuItemTimeoutId = setTimeout(theme.closeOpenMenuItem, 50);
        }
      });

      $(document).on('mouseenter', '.multi-level-nav .tier-2, .multi-level-nav .tier-3', function () {
        if (theme.viewport.isSm()) {
          clearTimeout(theme.closeOpenMenuItemTimeoutId);
        }
      });

      // Slide up and remove
      $.fn.slideUpAndRemove = function () {var speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 200;
        $(this).each(function () {
          $(this).slideUp(speed, function () {
            $(this).remove();
          });
        });
      };

      $(document).on('click', '.main-menu-panel__back-link', function (e) {
        e.preventDefault();

        var $appearing = $($(this).attr('href'));
        var $disappearing = $(this).closest('.main-menu-panel').addClass('main-menu-panel--inactive-right');

        if ($(this).attr('href') == '#main-menu-panel') {
          // 3rd tier -> 1st tier, hide middle menu
          $('.main-menu-panel--child.main-menu-panel--inactive-left').
          addClass('main-menu-panel--inactive-right').
          removeClass('main-menu-panel--inactive-left');

          $('#pageheader .main-menu-toggle').removeClass('main-menu-toggle--back');
        }
        setTimeout(function () {
          $appearing.removeClass('main-menu-panel--inactive-left');
        }, menuPanelTransitionDelay);
      });

      // Toggle search side drawer
      if (theme.settings.enable_search) {
        document.querySelector('.header-search-toggle').addEventListener('click', (e) => {
          e.preventDefault();
          var headerSearch = document.querySelector('.header-search');

          document.documentElement.classList.add('open-side-drawer');
          headerSearch.classList.add('is-open');

          setTimeout(() => {
            headerSearch.querySelector('input[name="q"]').focus();
          }, 500);
        });
      }

      document.querySelectorAll('.input-with-clear__clear').forEach((btn) => {
        btn.addEventListener('click', () => {
          var input = btn.previousElementSibling;
          input.value = '';
          input.dispatchEvent(new Event('change'));
        });
      });

      /// Gallery
      // Variant images
      $(document).on('variantImageSelected', '.media-gallery', function (e, data) {
        // Get image src
        var variantSrc = data.featured_media.preview_image.src.split('?')[0].replace(/http[s]?:/, '');

        // Locate matching thumbnail & click it
        var $thumb = $(this).find('.thumb[href^="' + variantSrc + '"]:first');
        $thumb.trigger('click');

        // Scroll thumbnails to ensure active thumb is visible
        var $thumbScroller = $(this).find('.thumbnails__scroller');

        if ($thumbScroller.length) {
          if (window.innerWidth >= 992) {
            $thumbScroller.animate({
              scrollTop: $thumbScroller.scrollTop() + ($thumb.offset().top - $thumbScroller.offset().top) },
            500);
          } else {
            $thumbScroller.animate({
              scrollLeft: $thumbScroller.scrollLeft() + ($thumb.offset().left - $thumbScroller.offset().left) },
            500);
          }
        }
      });

      $(document).on('click', '.js-prod-qty', function () {
        var $qtyInput = $(this).closest('.qty-selector').find('input.quantity');
        var currValue = parseInt($qtyInput.val());
        var newValue = $(this).data('direction') === '+' ? currValue += 1 : currValue -= 1;

        $qtyInput.val(Math.max(1, newValue));
      });

      // Hide the footer on the challenge page
      if (window.location.href.indexOf('/challenge') > 0 && window.location.href.indexOf('/pages') === -1) {
        document.getElementById('pagefooter').style.display = 'none';
      }

      // On any section load
      $(document).on('shopify:section:load', function (e) {
        theme.checkForBannerBehindHeader();
        document.getElementById('main-menu-disclosure').open = true;

        if (e.target.id === 'shopify-section-header') {
          setTimeout(() => {
            theme.setHeaderHeight();
            theme.checkMenuPadding();
          }, 10);
        } else if (e.target.id === 'shopify-section-announcement') {
          theme.setViewportHeight();
        }
      });

      // On any section unload
      $(document).on('shopify:section:unload', function () {
        setTimeout(() => {
          theme.checkForBannerBehindHeader();

          if ($('html').hasClass('open-menu')) {
            $('#main-menu .lazyload-manual').removeClass('lazyload-manual').addClass('lazyload');
          }
        }, 10);
      });

      // On any section reorder
      $(document).on('shopify:section:reorder', function () {
        theme.checkForBannerBehindHeader();
      });
    }

    // General lightbox for all
    $('a[rel=lightbox]').colorbox({ maxWidth: '94%' });

    // Galleries (only on large screens)
    if ($(window).height() >= theme.lightbox_min_window_height && $(window).width() >= theme.lightbox_min_window_width) {
      $('a[rel="gallery"]').colorbox({ rel: 'gallery', maxWidth: '94%' });
    }

    $(document).on('click', '.size-chart-link', function () {
      $.colorbox({
        html: $('.size-chart-content').html(),
        maxWidth: '94%' });

      return false;
    });

    // Show newsletter signup response
    if ($('.newsletter-response').length > 0 && $('.cc-popup-form__response--success').length === 0) {
      $.colorbox({
        fixed: true,
        maxWidth: '94%',
        html: [
        '<div class="signup-modal-feedback">',
        $('.newsletter-response:first').html(),
        '</div>'].
        join('') });

    }

    // Watch for tabbing
    function handleFirstTab(e) {
      if (e.keyCode === 9) {// 9 == tab
        $('body').addClass('user-is-tabbing');
        window.removeEventListener('keydown', handleFirstTab);
      }
    }
    window.addEventListener('keydown', handleFirstTab);

    // Watch for play/stop video events
    $(document).on('cc:video:play', function () {
      if ($(window).outerWidth() < 768) {
        $('body').addClass('video-modal-open');
      }
    }).on('cc:video:stop', function () {
      if ($(window).outerWidth() < 768) {
        $('body').removeClass('video-modal-open');
      }
    });
  });

  $(function () {
    // Register all sections
    theme.Sections.init();

    if (!document.documentElement.classList.contains('template-password')) {
      theme.Sections.register('header', theme.HeaderSection, { deferredLoad: false });
      theme.Sections.register('footer', theme.FooterSection);
      theme.Sections.register('collection', theme.ProductResultsSection, { deferredLoad: false });
      theme.Sections.register('product', theme.MainProductSection, { deferredLoad: false });
      theme.Sections.register('featured-product', theme.FeaturedProductSection);
      theme.Sections.register('cart', theme.CartSection, { deferredLoad: false });
      theme.Sections.register('search', theme.ProductResultsSection, { deferredLoad: false });
    }

    theme.Sections.register('slideshow', theme.SlideshowSection);
    theme.Sections.register('slideshow-with-text', theme.SlideshowWithTextSection);
    theme.Sections.register('blog', theme.BlogSection, { deferredLoad: false });
    theme.Sections.register('testimonials', theme.TestimonialsSection);
    theme.Sections.register('background-video', theme.VideoManager);
  });

  $.extend($.colorbox.settings, {
    previous: '<svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><title>Previous</title><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>',
    next: '<svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><title>Next</title><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>',
    close: '<svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><title>Close</title><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>' });



  //Register dynamically pulled in sections
  $(function ($) {
    if (cc.sections.length) {
      cc.sections.forEach((section) => {
        try {
          var data = {};
          if (typeof section.deferredLoad !== 'undefined') {
            data.deferredLoad = section.deferredLoad;
          }
          if (typeof section.deferredLoadViewportExcess !== 'undefined') {
            data.deferredLoadViewportExcess = section.deferredLoadViewportExcess;
          }
          theme.Sections.register(section.name, section.section, data);
        } catch (err) {
          console.error("Unable to register section ".concat(section.name, "."), err);
        }
      });
    } else {
      console.warn('Barry: No common sections have been registered.');
    }
  });

})(theme.jQuery);  
/* Built with Barry v1.0.8 */