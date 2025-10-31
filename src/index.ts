// Главный экспорт - CouponsWidget с автоинициализацией
import './auto-init';
import CouponsWidget from './coupons-widget';

// Default export для UMD сборки
export default CouponsWidget;

// Экспорты для модульного использования
export { default as CouponsWidget } from './coupons-widget';
export { default as ElementBuilder } from './element-builder';

// Экспорт типов
export type { CouponsWidgetOptions, CouponData } from './coupons-widget';
export type {
  ChildElement,
  CSSClassValue,
  AttributeObject,
  StyleObject,
  DatasetObject,
  ParentSelector,
  EventOptions,
  EnhancedElement,
  EnhancedFragment
} from './element-builder';