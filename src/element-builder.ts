// Types
export type ChildElement = string | HTMLElement | Node | number | null | undefined;
export type CSSClassValue = string | string[];
export type AttributeObject = Record<string, string>;
export type StyleObject = Record<string, string | number>;
export type DatasetObject = Record<string, string>;
export type ParentSelector = string | HTMLElement | Element;
export type EventOptions = AddEventListenerOptions | boolean;

// Enhanced element type using intersection instead of interface extension  
export type EnhancedElement<T extends keyof HTMLElementTagNameMap = keyof HTMLElementTagNameMap> =
  HTMLElementTagNameMap[T] & {

    // Child manipulation with overloads
    addChild(...children: ChildElement[]): EnhancedElement<T>;
    addChildren(children: ChildElement[]): EnhancedElement<T>;
    addChildrenWithSeparator(children: ChildElement[], separator?: string): EnhancedElement<T>;
    createAndAdd<K extends keyof HTMLElementTagNameMap>(
      tag: K,
      configFn?: (element: EnhancedElement<K>) => void
    ): EnhancedElement<T>;

    // CSS classes
    addClass(className: CSSClassValue): EnhancedElement<T>;
    removeClass(className: CSSClassValue): EnhancedElement<T>;
    toggleClass(className: string): EnhancedElement<T>;
    hasClass(className: string): boolean;

    // Attributes - with proper overloads
    setAttr(name: string, value: string): EnhancedElement<T>;
    setAttr(attributes: AttributeObject): EnhancedElement<T>;
    removeAttr(name: string): EnhancedElement<T>;

    // Content
    setText(text: string): EnhancedElement<T>;
    setHtml(html: string): EnhancedElement<T>;
    appendHtml(html: string): EnhancedElement<T>;

    // Styles - with proper overloads
    setStyle(property: string, value: string | number): EnhancedElement<T>;
    setStyle(styles: StyleObject): EnhancedElement<T>;

    // Data attributes - with proper overloads
    setData(key: string, value: string): EnhancedElement<T>;
    setData(data: DatasetObject): EnhancedElement<T>;

    // Events
    on(event: string, handler: EventListener, options?: EventOptions): EnhancedElement<T>;
    off(event: string, handler: EventListener, options?: EventOptions): EnhancedElement<T>;
    once(event: string, handler: EventListener): EnhancedElement<T>;

    // DOM manipulation
    appendTo(parent: ParentSelector): EnhancedElement<T>;
    prependTo(parent: ParentSelector): EnhancedElement<T>;
    insertAfter(target: ParentSelector): EnhancedElement<T>;
    insertBefore(target: ParentSelector): EnhancedElement<T>;
    remove(): EnhancedElement<T>;
    empty(): EnhancedElement<T>;
    clone(deep?: boolean): EnhancedElement<T>;
  };

// Enhanced fragment type
export type EnhancedFragment = DocumentFragment & {
  addChild(...children: ChildElement[]): EnhancedFragment;
  appendTo(parent: ParentSelector): EnhancedFragment;
};

/**
 * TypeScript ElementBuilder with fluent interface for DOM manipulation
 */
export default class ElementBuilder {

  /**
   * Create HTML element with enhanced methods
   */
  static create<K extends keyof HTMLElementTagNameMap>(
    tag: K = 'div' as K
  ): EnhancedElement<K> {
    const element = document.createElement(tag) as HTMLElementTagNameMap[K];

    // Add child elements with support for arrays and various types
    (element as any).addChild = (...children: ChildElement[]): EnhancedElement<K> => {
      children.forEach(child => {
        if (Array.isArray(child)) {
          (element as any).addChild(...child);
        } else if (typeof child === 'string' || typeof child === 'number') {
          element.appendChild(document.createTextNode(String(child)));
        } else if (child instanceof Node) {
          element.appendChild(child);
        } else if (child !== null && child !== undefined) {
          element.appendChild(document.createTextNode(String(child)));
        }
      });
      return element as EnhancedElement<K>;
    };

    // Alternative method for adding multiple elements
    (element as any).addChildren = (children: ChildElement[]): EnhancedElement<K> => {
      if (Array.isArray(children)) {
        return (element as any).addChild(...children);
      }
      return (element as any).addChild(children);
    };

    // Add elements with separator
    (element as any).addChildrenWithSeparator = (
      children: ChildElement[],
      separator: string = ', '
    ): EnhancedElement<K> => {
      if (!Array.isArray(children) || children.length === 0) return element as EnhancedElement<K>;

      children.forEach((child, index) => {
        (element as any).addChild(child);
        if (index < children.length - 1) {
          (element as any).addChild(separator);
        }
      });
      return element as EnhancedElement<K>;
    };

    // Quick create and add method
    (element as any).createAndAdd = <T extends keyof HTMLElementTagNameMap>(
      tag: T,
      configFn?: (element: EnhancedElement<T>) => void
    ): EnhancedElement<K> => {
      const newElement = ElementBuilder.create(tag);
      if (typeof configFn === 'function') {
        configFn(newElement);
      }
      return (element as any).addChild(newElement);
    };

    // CSS class methods
    (element as any).addClass = (className: CSSClassValue): EnhancedElement<K> => {
      if (Array.isArray(className)) {
        element.classList.add(...className);
      } else {
        element.classList.add(className);
      }
      return element as EnhancedElement<K>;
    };

    (element as any).removeClass = (className: CSSClassValue): EnhancedElement<K> => {
      if (Array.isArray(className)) {
        element.classList.remove(...className);
      } else {
        element.classList.remove(className);
      }
      return element as EnhancedElement<K>;
    };

    (element as any).toggleClass = (className: string): EnhancedElement<K> => {
      element.classList.toggle(className);
      return element as EnhancedElement<K>;
    };

    (element as any).hasClass = (className: string): boolean => {
      return element.classList.contains(className);
    };

    // Attribute methods with proper overloads
    (element as any).setAttr = ((
      nameOrAttributes: string | AttributeObject,
      value?: string
    ): EnhancedElement<K> => {
      if (typeof nameOrAttributes === 'object') {
        Object.entries(nameOrAttributes).forEach(([key, val]) => {
          element.setAttribute(key, val);
        });
      } else {
        element.setAttribute(nameOrAttributes, value!);
      }
      return element as EnhancedElement<K>;
    });

    (element as any).removeAttr = (name: string): EnhancedElement<K> => {
      element.removeAttribute(name);
      return element as EnhancedElement<K>;
    };

    // Content methods
    (element as any).setText = (text: string): EnhancedElement<K> => {
      element.textContent = text;
      return element as EnhancedElement<K>;
    };

    (element as any).setHtml = (html: string): EnhancedElement<K> => {
      element.innerHTML = html;
      return element as EnhancedElement<K>;
    };

    (element as any).appendHtml = (html: string): EnhancedElement<K> => {
      element.insertAdjacentHTML('beforeend', html);
      return element as EnhancedElement<K>;
    };

    // Style methods with proper overloads
    (element as any).setStyle = ((
      propertyOrStyles: string | StyleObject,
      value?: string | number
    ): EnhancedElement<K> => {
      if (typeof propertyOrStyles === 'object') {
        Object.assign(element.style, propertyOrStyles);
      } else {
        (element.style as any)[propertyOrStyles] = value;
      }
      return element as EnhancedElement<K>;
    });

    // Data attribute methods with proper overloads
    (element as any).setData = ((
      keyOrData: string | DatasetObject,
      value?: string
    ): EnhancedElement<K> => {
      if (typeof keyOrData === 'object') {
        Object.entries(keyOrData).forEach(([k, v]) => {
          element.dataset[k] = v;
        });
      } else {
        element.dataset[keyOrData] = value!;
      }
      return element as EnhancedElement<K>;
    });

    // Event methods
    (element as any).on = (
      event: string,
      handler: EventListener,
      options?: EventOptions
    ): EnhancedElement<K> => {
      element.addEventListener(event, handler, options);
      return element as EnhancedElement<K>;
    };

    (element as any).off = (
      event: string,
      handler: EventListener,
      options?: EventOptions
    ): EnhancedElement<K> => {
      element.removeEventListener(event, handler, options);
      return element as EnhancedElement<K>;
    };

    (element as any).once = (event: string, handler: EventListener): EnhancedElement<K> => {
      element.addEventListener(event, handler, { once: true });
      return element as EnhancedElement<K>;
    };

    // DOM manipulation methods
    (element as any).appendTo = (parent: ParentSelector): EnhancedElement<K> => {
      const parentElement = typeof parent === 'string'
        ? document.querySelector(parent)
        : parent;
      if (parentElement) {
        parentElement.appendChild(element);
      }
      return element as EnhancedElement<K>;
    };

    (element as any).prependTo = (parent: ParentSelector): EnhancedElement<K> => {
      const parentElement = typeof parent === 'string'
        ? document.querySelector(parent)
        : parent;
      if (parentElement) {
        parentElement.insertBefore(element, parentElement.firstChild);
      }
      return element as EnhancedElement<K>;
    };

    (element as any).insertAfter = (target: ParentSelector): EnhancedElement<K> => {
      const targetElement = typeof target === 'string'
        ? document.querySelector(target)
        : target;
      if (targetElement && targetElement.parentNode) {
        targetElement.parentNode.insertBefore(element, targetElement.nextSibling);
      }
      return element as EnhancedElement<K>;
    };

    (element as any).insertBefore = (target: ParentSelector): EnhancedElement<K> => {
      const targetElement = typeof target === 'string'
        ? document.querySelector(target)
        : target;
      if (targetElement && targetElement.parentNode) {
        targetElement.parentNode.insertBefore(element, targetElement);
      }
      return element as EnhancedElement<K>;
    };

    (element as any).remove = (): EnhancedElement<K> => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      return element as EnhancedElement<K>;
    };

    (element as any).empty = (): EnhancedElement<K> => {
      element.innerHTML = '';
      return element as EnhancedElement<K>;
    };

    (element as any).clone = (deep: boolean = true): EnhancedElement<K> => {
      const cloned = element.cloneNode(deep);
      return ElementBuilder.enhance(cloned as HTMLElementTagNameMap[K]);
    };

    return element as EnhancedElement<K>;
  }

  /**
   * Enhance existing element with builder methods
   */
  static enhance<K extends keyof HTMLElementTagNameMap>(
    element: HTMLElementTagNameMap[K]
  ): EnhancedElement<K> {
    const enhanced = element as any;

    // Добавляем все методы ElementBuilder к элементу
    enhanced.addClass = function (className: string) {
      this.classList.add(className);
      return this;
    };

    enhanced.removeClass = function (className: string) {
      this.classList.remove(className);
      return this;
    };

    enhanced.hasClass = function (className: string) {
      return this.classList.contains(className);
    };

    enhanced.setText = function (text: string) {
      this.textContent = text;
      return this;
    };

    enhanced.setHtml = function (html: string) {
      this.innerHTML = html;
      return this;
    };

    enhanced.empty = function () {
      this.innerHTML = '';
      return this;
    };

    enhanced.addChild = function (...children: any[]) {
      children.forEach(child => {
        if (typeof child === 'string') {
          this.appendChild(document.createTextNode(child));
        } else {
          this.appendChild(child);
        }
      });
      return this;
    };

    enhanced.setAttr = function (name: string, value?: string) {
      if (value !== undefined) {
        this.setAttribute(name, value);
      }
      return this;
    };

    enhanced.setStyle = function (property: string, value?: string) {
      if (value !== undefined) {
        this.style.setProperty(property, value);
      }
      return this;
    };

    enhanced.setData = function (key: string, value?: string) {
      if (value !== undefined) {
        this.dataset[key] = value;
      }
      return this;
    };

    enhanced.appendTo = function (parent: any) {
      const parentElement = typeof parent === 'string'
        ? document.querySelector(parent)
        : parent;
      if (parentElement) {
        parentElement.appendChild(this);
      }
      return this;
    };

    return enhanced as EnhancedElement<K>;
  }

  /**
   * Create document fragment with enhanced methods
   */
  static createFragment(): EnhancedFragment {
    const fragment = document.createDocumentFragment();

    (fragment as any).addChild = (...children: ChildElement[]): EnhancedFragment => {
      children.forEach(child => {
        if (typeof child === 'string' || typeof child === 'number') {
          fragment.appendChild(document.createTextNode(String(child)));
        } else if (child instanceof Node) {
          fragment.appendChild(child);
        }
      });
      return fragment as EnhancedFragment;
    };

    (fragment as any).appendTo = (parent: ParentSelector): EnhancedFragment => {
      const parentElement = typeof parent === 'string'
        ? document.querySelector(parent)
        : parent;
      if (parentElement) {
        parentElement.appendChild(fragment);
      }
      return fragment as EnhancedFragment;
    };

    return fragment as EnhancedFragment;
  }

  // Quick creation methods for common elements

  static div(className?: string): EnhancedElement<'div'> {
    const el = ElementBuilder.create('div');
    return className ? el.addClass(className) : el;
  }

  static span(text?: string, className?: string): EnhancedElement<'span'> {
    const el = ElementBuilder.create('span');
    if (text) el.setText(text);
    if (className) el.addClass(className);
    return el;
  }

}

// Global export for browser use
if (typeof window !== 'undefined') {
  (window as any).ElementBuilder = ElementBuilder;
}